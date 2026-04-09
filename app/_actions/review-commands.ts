"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/error";
import { API_ERROR_CODES, type ApiResponse } from "@/lib/types/api";
import { DB_ERROR_CODES } from "@/lib/constants/database-errors";
import { extractYoutubeChannelId } from "@/lib/types/guards";
import { findChannelDbId } from "@/lib/supabase/channel-query";
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from "@/lib/validations/review";
import type { Review } from "@/lib/types/review";

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
        "ログインが必要です",
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // チャンネルのデータベースIDを解決
    const channelLookup = await findChannelDbId(supabase, validated.channelId);
    if (!channelLookup.found) {
      throw new ApiError(
        API_ERROR_CODES.NOT_FOUND,
        "チャンネルが見つかりません",
        404
      );
    }
    const channelDbId = channelLookup.channelDbId;

    // レビューを挿入
    const { data, error } = await supabase
      .from("reviews")
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
      if (error.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
        throw new ApiError(
          API_ERROR_CODES.DUPLICATE,
          "このチャンネルにはすでにレビューを投稿しています",
          409
        );
      }

      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "レビューの投稿に失敗しました",
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
        "ログインが必要です",
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // レビューを更新（RLSで自分のレビューのみ更新可能）
    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content,
        is_spoiler: validated.isSpoiler || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      // RLSポリシー 'reviews_update_own' で user_id チェック済み
      .select("*, channel:channels!inner(youtube_channel_id)")
      .single();

    if (error) {
      // レコードが見つからない、または権限がない
      if (error.code === "PGRST116") {
        throw new ApiError(
          API_ERROR_CODES.FORBIDDEN,
          "このレビューを編集する権限がありません",
          403
        );
      }

      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "レビューの更新に失敗しました",
        500
      );
    }

    // YouTubeチャンネルIDを取得
    const youtubeChannelId = extractYoutubeChannelId(data.channel);

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
        "ログインが必要です",
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // YouTubeチャンネルIDを取得（再検証用）
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("channel:channels!inner(youtube_channel_id)")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !review) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        "このレビューを削除する権限がありません",
        403
      );
    }

    // YouTubeチャンネルIDを取得
    const youtubeChannelId = extractYoutubeChannelId(review.channel);

    // ソフトデリート（deleted_atを設定）
    // RLSポリシー 'reviews_update_own' で user_id チェック済み
    const { error } = await supabase
      .from("reviews")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "レビューの削除に失敗しました",
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
        "ログインが必要です",
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // 既存の投票を確認
    const { data: existingVote, error: checkError } = await supabase
      .from("review_helpful")
      .select("*")
      .eq("review_id", reviewId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Supabase error:", checkError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "投票状態の確認に失敗しました",
        500
      );
    }

    let isHelpful: boolean;

    if (existingVote) {
      // 既に投票済み → 投票を削除
      const { error: deleteError } = await supabase
        .from("review_helpful")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Supabase error:", deleteError);
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          "投票の取り消しに失敗しました",
          500
        );
      }

      isHelpful = false;
    } else {
      // まだ投票していない → 投票を追加
      const { error: insertError } = await supabase
        .from("review_helpful")
        .insert({
          review_id: reviewId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("Supabase error:", insertError);
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          "投票の追加に失敗しました",
          500
        );
      }

      isHelpful = true;
    }

    // 最新の投票数を取得
    const { count, error: countError } = await supabase
      .from("review_helpful")
      .select("*", { count: "exact", head: true })
      .eq("review_id", reviewId);

    if (countError) {
      console.error("Supabase error:", countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "投票数の取得に失敗しました",
        500
      );
    }

    // reviews テーブルの helpful_count を更新
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ helpful_count: count || 0 })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Supabase error:", updateError);
      // helpful_count の更新失敗は致命的ではないので、警告のみ
    }

    // チャンネル詳細ページを再検証（YouTubeチャンネルIDを取得）
    const { data: review } = await supabase
      .from("reviews")
      .select("channel:channels!inner(youtube_channel_id)")
      .eq("id", reviewId)
      .single();

    if (review) {
      const youtubeChannelId = extractYoutubeChannelId(review.channel);

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
