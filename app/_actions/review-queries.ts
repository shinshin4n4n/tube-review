"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/error";
import { API_ERROR_CODES, type ApiResponse } from "@/lib/types/api";
import { findChannelDbId } from "@/lib/supabase/channel-query";
import {
  fetchUserHelpfulVotes,
  transformReviewsWithUser,
} from "@/lib/review-helpers";
import { getChannelReviewsSchema } from "@/lib/validations/review";
import type {
  PaginatedReviews,
  ReviewWithUserAndChannel,
  PaginatedMyReviews,
} from "@/lib/types/review";

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
    const validated = getChannelReviewsSchema.parse({
      channelId: youtubeChannelId,
      page,
      limit,
    });

    // Supabaseクライアント作成
    const supabase = await createClient();

    // 現在のユーザーを取得（オプショナル）
    const user = await getUser();

    // チャンネルのデータベースIDを解決
    const channelLookup = await findChannelDbId(supabase, youtubeChannelId);
    if (!channelLookup.found) {
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
    const channelDbId = channelLookup.channelDbId;

    const offset = (validated.page - 1) * validated.limit;

    // レビュー取得（ユーザー情報を JOIN）
    const { data: reviews, error } = await supabase
      .from("reviews")
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
      .eq("channel_id", channelDbId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + validated.limit - 1);

    // 総件数取得
    const { count, error: countError } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", channelDbId)
      .is("deleted_at", null);

    // エラーハンドリング
    if (error || countError) {
      console.error("Supabase error:", error || countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "レビューの取得に失敗しました",
        500
      );
    }

    // ログインユーザーの投票状態を取得
    const userHelpfulVotes =
      user && reviews && reviews.length > 0
        ? await fetchUserHelpfulVotes(
            supabase,
            user.id,
            reviews.map((r) => r.id)
          )
        : new Set<string>();

    // レビューデータを変換（user を配列から単一オブジェクトに、is_helpful を追加）
    const transformedReviews = transformReviewsWithUser(
      reviews || [],
      userHelpfulVotes
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
        "ログインが必要です",
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // レビュー取得
    const { data: reviews, error } = await supabase
      .from("reviews")
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 総件数取得
    const { count, error: countError } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // エラーハンドリング
    if (error || countError) {
      console.error("Supabase error:", error || countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "レビューの取得に失敗しました",
        500
      );
    }

    // データ変換（userとchannelが配列の場合に対応）
    const transformed = (reviews || []).map((review) => ({
      ...review,
      user: Array.isArray(review.user) ? review.user[0] : review.user,
      channel: Array.isArray(review.channel)
        ? review.channel[0]
        : review.channel,
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
