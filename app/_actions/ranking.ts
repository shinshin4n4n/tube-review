"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  RankingChannel,
  RecentReviewWithChannel,
  ReviewSearchParams,
} from "@/lib/types/ranking";

/**
 * 今週の人気チャンネルランキングを取得
 * Materialized View (channel_stats) を活用
 *
 * @param limit - 取得件数（デフォルト: 10）
 * @returns ランキングチャンネル一覧
 */
export async function getRankingChannels(
  limit = 10
): Promise<RankingChannel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels_with_stats")
    .select(
      `
      id,
      youtube_channel_id,
      title,
      description,
      thumbnail_url,
      subscriber_count,
      review_count,
      average_rating,
      recent_review_count
    `
    )
    .not("recent_review_count", "is", null) // NULL値を除外
    .gte("recent_review_count", 1) // 最低1件のレビューが必要
    .order("recent_review_count", { ascending: false })
    .order("average_rating", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching ranking channels:", error);
    throw new Error("ランキングの取得に失敗しました");
  }

  return (data || []) as RankingChannel[];
}

/**
 * レビューを取得（検索・フィルタリング・ページネーション対応）
 * チャンネル情報とユーザー情報を含む
 *
 * @param params - 検索パラメータ（省略時は新着順で全件取得）
 * @returns レビュー一覧とページネーション情報
 */
export async function getRecentReviews(
  params: ReviewSearchParams = {}
): Promise<{
  reviews: RecentReviewWithChannel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const {
    page = 1,
    limit = 20,
    query,
    sort = "recent",
    category,
    rating,
  } = params;

  const supabase = await createClient();

  // カテゴリフィルタ: 該当チャンネルIDを先に取得
  let channelIdsForCategory: string[] | null = null;
  if (category) {
    const { data: categoryChannels } = await supabase
      .from("channels")
      .select("id")
      .eq("category", category);
    channelIdsForCategory = (categoryChannels || []).map((c) => c.id);

    // カテゴリに該当するチャンネルがなければ空結果を返す
    if (channelIdsForCategory.length === 0) {
      return {
        reviews: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  // キーワード検索（チャンネル名）: 該当チャンネルIDを取得
  let channelIdsForQuery: string[] | null = null;
  if (query) {
    const { data: queryChannels } = await supabase
      .from("channels")
      .select("id")
      .ilike("title", `%${query}%`);
    channelIdsForQuery = (queryChannels || []).map((c) => c.id);
  }

  // カテゴリとチャンネル名検索の両方がある場合、交差を取る
  let filteredChannelIds: string[] | null = null;
  if (channelIdsForCategory && channelIdsForQuery) {
    const categorySet = new Set(channelIdsForCategory);
    filteredChannelIds = channelIdsForQuery.filter((id) => categorySet.has(id));
  } else if (channelIdsForCategory) {
    filteredChannelIds = channelIdsForCategory;
  }

  // 総件数クエリを構築
  let countQuery = supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  // フィルタ適用（カウント用）
  if (rating) {
    countQuery = countQuery.eq("rating", rating);
  }
  if (query) {
    // チャンネル名 OR タイトル・本文でマッチ
    if (channelIdsForQuery && channelIdsForQuery.length > 0) {
      if (filteredChannelIds) {
        // カテゴリ + キーワード: channelIds で絞り込み + テキスト検索
        countQuery = countQuery.or(
          `title.ilike.%${query}%,content.ilike.%${query}%,channel_id.in.(${filteredChannelIds.join(",")})`
        );
      } else {
        // キーワードのみ: テキスト検索 + チャンネル名マッチ
        countQuery = countQuery.or(
          `title.ilike.%${query}%,content.ilike.%${query}%,channel_id.in.(${channelIdsForQuery.join(",")})`
        );
      }
    } else {
      // チャンネル名にマッチなし → テキストのみ検索
      if (filteredChannelIds) {
        countQuery = countQuery
          .in("channel_id", filteredChannelIds)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      } else {
        countQuery = countQuery.or(
          `title.ilike.%${query}%,content.ilike.%${query}%`
        );
      }
    }
  } else if (filteredChannelIds) {
    countQuery = countQuery.in("channel_id", filteredChannelIds);
  }

  const { count } = await countQuery;

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // データ取得クエリを構築
  let dataQuery = supabase
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
      user:users!user_id (
        id,
        username,
        display_name,
        avatar_url
      ),
      channel:channels!channel_id (
        id,
        youtube_channel_id,
        title,
        thumbnail_url,
        category
      )
    `
    )
    .is("deleted_at", null);

  // フィルタ適用（データ用）
  if (rating) {
    dataQuery = dataQuery.eq("rating", rating);
  }
  if (query) {
    if (channelIdsForQuery && channelIdsForQuery.length > 0) {
      if (filteredChannelIds) {
        dataQuery = dataQuery.or(
          `title.ilike.%${query}%,content.ilike.%${query}%,channel_id.in.(${filteredChannelIds.join(",")})`
        );
      } else {
        dataQuery = dataQuery.or(
          `title.ilike.%${query}%,content.ilike.%${query}%,channel_id.in.(${channelIdsForQuery.join(",")})`
        );
      }
    } else {
      if (filteredChannelIds) {
        dataQuery = dataQuery
          .in("channel_id", filteredChannelIds)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      } else {
        dataQuery = dataQuery.or(
          `title.ilike.%${query}%,content.ilike.%${query}%`
        );
      }
    }
  } else if (filteredChannelIds) {
    dataQuery = dataQuery.in("channel_id", filteredChannelIds);
  }

  // ソート適用
  if (sort === "helpful") {
    dataQuery = dataQuery
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    dataQuery = dataQuery.order("created_at", { ascending: false });
  }

  dataQuery = dataQuery.range(offset, offset + limit - 1);

  const { data, error } = await dataQuery;

  if (error) {
    console.error("Error fetching reviews:", error);
    throw new Error("レビューの取得に失敗しました");
  }

  // データの型を変換
  const reviews = (data || []).map((review) => ({
    id: review.id,
    user_id: review.user_id,
    channel_id: review.channel_id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    is_spoiler: review.is_spoiler,
    helpful_count: review.helpful_count,
    created_at: review.created_at,
    user: Array.isArray(review.user) ? review.user[0] : review.user,
    channel: Array.isArray(review.channel) ? review.channel[0] : review.channel,
  })) as RecentReviewWithChannel[];

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
