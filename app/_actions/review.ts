'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';
import {
  createReviewSchema,
  updateReviewSchema,
  getChannelReviewsSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from '@/lib/validations/review';
import type { Review, PaginatedReviews, ReviewWithUser, ReviewWithUserAndChannel, PaginatedMyReviews } from '@/lib/types/review';

/**
 * レビューを作成
 */
export async function createReviewAction(
  input: CreateReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // バリデーション
    const validated = createReviewSchema.parse(input);

    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // channelIdがUUID形式かどうかをチェック
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validated.channelId);

    let channelDbId: string;

    if (isUUID) {
      // UUID形式の場合は直接データベースIDとして使用
      channelDbId = validated.channelId;

      // チャンネルの存在確認
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelDbId)
        .single();

      if (channelError || !channel) {
        throw new ApiError(
          API_ERROR_CODES.NOT_FOUND,
          'チャンネルが見つかりません',
          404
        );
      }
    } else {
      // YouTube IDの場合は検索
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('youtube_channel_id', validated.channelId)
        .single();

      if (channelError || !channel) {
        throw new ApiError(
          API_ERROR_CODES.NOT_FOUND,
          'チャンネルが見つかりません',
          404
        );
      }

      channelDbId = channel.id;
    }

    // レビューを挿入
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        channel_id: channelDbId,
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content,
        is_spoiler: validated.isSpoiler || false,
      })
      .select()
      .single();

    if (error) {
      // 重複エラーチェック（UNIQUE制約違反）
      if (error.code === '23505') {
        throw new ApiError(
          API_ERROR_CODES.DUPLICATE,
          'このチャンネルにはすでにレビューを投稿しています',
          409
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'レビューの投稿に失敗しました',
        500
      );
    }

    // チャンネル詳細ページを再検証
    revalidatePath(`/channels/${validated.channelId}`);

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * チャンネルのレビュー一覧を取得（ページネーション付き）
 * @param youtubeChannelId YouTubeチャンネルID
 */
export async function getChannelReviewsAction(
  youtubeChannelId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedReviews>> {
  try {
    // バリデーション
    const validated = getChannelReviewsSchema.parse({ channelId: youtubeChannelId, page, limit });

    // Supabaseクライアント作成
    const supabase = await createClient();

    // 現在のユーザーを取得（オプショナル）
    const user = await getUser();

    // channelIdがUUID形式かどうかをチェック
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(youtubeChannelId);

    let channelDbId: string;

    if (isUUID) {
      // UUID形式の場合は直接データベースIDとして使用
      channelDbId = youtubeChannelId;

      // チャンネルの存在確認
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelDbId)
        .single();

      if (channelError || !channel) {
        return {
          success: true,
          data: {
            reviews: [],
            pagination: {
              page: validated.page,
              limit: validated.limit,
              total: 0,
              totalPages: 0,
            },
          },
        };
      }
    } else {
      // YouTube IDの場合は検索
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('youtube_channel_id', youtubeChannelId)
        .single();

      if (channelError || !channel) {
        return {
          success: true,
          data: {
            reviews: [],
            pagination: {
              page: validated.page,
              limit: validated.limit,
              total: 0,
              totalPages: 0,
            },
          },
        };
      }

      channelDbId = channel.id;
    }

    const offset = (validated.page - 1) * validated.limit;

    // レビュー取得（ユーザー情報を JOIN）
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        `
        id,
        user_id,
        channel_id,
        rating,
        title,
        content,
        is_spoiler,
        helpful_count,
        created_at,
        updated_at,
        deleted_at,
        user:users!reviews_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('channel_id', channelDbId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + validated.limit - 1);

    // 総件数取得
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelDbId)
      .is('deleted_at', null);

    // エラーハンドリング
    if (error || countError) {
      console.error('Supabase error:', error || countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'レビューの取得に失敗しました',
        500
      );
    }

    // ログインユーザーの投票状態を取得
    let userHelpfulVotes: Set<string> = new Set();
    if (user && reviews && reviews.length > 0) {
      const reviewIds = reviews.map((r) => r.id);
      const { data: helpfulData } = await supabase
        .from('review_helpful')
        .select('review_id')
        .in('review_id', reviewIds)
        .eq('user_id', user.id);

      if (helpfulData) {
        userHelpfulVotes = new Set(helpfulData.map((h) => h.review_id));
      }
    }

    // レビューデータを変換（user を配列から単一オブジェクトに、is_helpful を追加）
    const transformedReviews: ReviewWithUser[] = (reviews || []).map(
      (review) => {
        const reviewUser = Array.isArray(review.user) ? review.user[0] : review.user;
        return {
          ...review,
          user: reviewUser,
          is_helpful: userHelpfulVotes.has(review.id),
        } as ReviewWithUser;
      }
    );

    // ページネーション情報を構築
    const totalPages = Math.ceil((count || 0) / validated.limit);

    return {
      success: true,
      data: {
        reviews: transformedReviews,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: count || 0,
          totalPages,
        },
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * レビューを更新
 */
export async function updateReviewAction(
  reviewId: string,
  input: UpdateReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // バリデーション
    const validated = updateReviewSchema.parse(input);

    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // レビューを更新（RLSで自分のレビューのみ更新可能）
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content,
        is_spoiler: validated.isSpoiler || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', user.id) // 自分のレビューのみ更新
      .select('*, channel:channels!inner(youtube_channel_id)')
      .single();

    if (error) {
      // レコードが見つからない、または権限がない
      if (error.code === 'PGRST116') {
        throw new ApiError(
          API_ERROR_CODES.FORBIDDEN,
          'このレビューを編集する権限がありません',
          403
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'レビューの更新に失敗しました',
        500
      );
    }

    // YouTubeチャンネルIDを取得
    const channel = data.channel as unknown as { youtube_channel_id?: string } | { youtube_channel_id?: string }[];
    const youtubeChannelId = Array.isArray(channel)
      ? channel[0]?.youtube_channel_id
      : channel?.youtube_channel_id;

    // チャンネル詳細ページを再検証
    if (youtubeChannelId) {
      revalidatePath(`/channels/${youtubeChannelId}`);
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * レビューを削除（ソフトデリート）
 */
export async function deleteReviewAction(
  reviewId: string
): Promise<ApiResponse<void>> {
  try {
    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // YouTubeチャンネルIDを取得（再検証用）
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('channel:channels!inner(youtube_channel_id)')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !review) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        'このレビューを削除する権限がありません',
        403
      );
    }

    // YouTubeチャンネルIDを取得
    const channel = review.channel as unknown as { youtube_channel_id?: string } | { youtube_channel_id?: string }[];
    const youtubeChannelId = Array.isArray(channel)
      ? channel[0]?.youtube_channel_id
      : channel?.youtube_channel_id;

    // ソフトデリート（deleted_atを設定）
    const { error } = await supabase
      .from('reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id); // 自分のレビューのみ削除

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'レビューの削除に失敗しました',
        500
      );
    }

    // チャンネル詳細ページを再検証
    if (youtubeChannelId) {
      revalidatePath(`/channels/${youtubeChannelId}`);
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * レビューの「参考になった」をトグル
 * 投票していない場合は追加、投票済みの場合は削除
 */
export async function toggleHelpfulAction(
  reviewId: string
): Promise<ApiResponse<{ isHelpful: boolean; helpfulCount: number }>> {
  try {
    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // 既存の投票を確認
    const { data: existingVote, error: checkError } = await supabase
      .from('review_helpful')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Supabase error:', checkError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        '投票状態の確認に失敗しました',
        500
      );
    }

    let isHelpful: boolean;

    if (existingVote) {
      // 既に投票済み → 投票を削除
      const { error: deleteError } = await supabase
        .from('review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Supabase error:', deleteError);
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          '投票の取り消しに失敗しました',
          500
        );
      }

      isHelpful = false;
    } else {
      // まだ投票していない → 投票を追加
      const { error: insertError } = await supabase
        .from('review_helpful')
        .insert({
          review_id: reviewId,
          user_id: user.id,
        });

      if (insertError) {
        console.error('Supabase error:', insertError);
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          '投票の追加に失敗しました',
          500
        );
      }

      isHelpful = true;
    }

    // 最新の投票数を取得
    const { count, error: countError } = await supabase
      .from('review_helpful')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    if (countError) {
      console.error('Supabase error:', countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        '投票数の取得に失敗しました',
        500
      );
    }

    // reviews テーブルの helpful_count を更新
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ helpful_count: count || 0 })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Supabase error:', updateError);
      // helpful_count の更新失敗は致命的ではないので、警告のみ
    }

    // チャンネル詳細ページを再検証（YouTubeチャンネルIDを取得）
    const { data: review } = await supabase
      .from('reviews')
      .select('channel:channels!inner(youtube_channel_id)')
      .eq('id', reviewId)
      .single();

    if (review) {
      const channel = review.channel as
        | { youtube_channel_id: string }[]
        | { youtube_channel_id: string };
      const youtubeChannelId = Array.isArray(channel)
        ? channel[0]?.youtube_channel_id
        : channel?.youtube_channel_id;

      if (youtubeChannelId) {
        revalidatePath(`/channels/${youtubeChannelId}`);
      }
    }

    return {
      success: true,
      data: {
        isHelpful,
        helpfulCount: count || 0,
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * 自分のレビュー一覧を取得
 */
export async function getMyReviewsAction(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedMyReviews>> {
  try {
    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // レビュー取得
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        user:users!reviews_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        channel:channels!inner (
          id,
          youtube_channel_id,
          title,
          thumbnail_url
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 総件数取得
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // エラーハンドリング
    if (error || countError) {
      console.error('Supabase error:', error || countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'レビューの取得に失敗しました',
        500
      );
    }

    // データ変換（userとchannelが配列の場合に対応）
    const transformed = (reviews || []).map((review) => ({
      ...review,
      user: Array.isArray(review.user) ? review.user[0] : review.user,
      channel: Array.isArray(review.channel) ? review.channel[0] : review.channel,
    })) as ReviewWithUserAndChannel[];

    // ページネーション情報を構築
    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: {
        reviews: transformed,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}
