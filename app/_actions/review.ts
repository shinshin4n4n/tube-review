'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';
import {
  createReviewSchema,
  getChannelReviewsSchema,
  type CreateReviewInput,
} from '@/lib/validations/review';
import type { Review, PaginatedReviews, ReviewWithUser } from '@/lib/types/review';

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

    // レビューを挿入
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        channel_id: validated.channelId,
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
 */
export async function getChannelReviewsAction(
  channelId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedReviews>> {
  try {
    // バリデーション
    const validated = getChannelReviewsSchema.parse({ channelId, page, limit });

    // Supabaseクライアント作成
    const supabase = await createClient();
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
        user:users!inner(
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('channel_id', validated.channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + validated.limit - 1);

    // 総件数取得
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', validated.channelId)
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

    // レビューデータを変換（user を配列から単一オブジェクトに）
    const transformedReviews: ReviewWithUser[] = (reviews || []).map(
      (review) => {
        const user = Array.isArray(review.user) ? review.user[0] : review.user;
        return {
          ...review,
          user,
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
