'use server';

import { createClient } from '@/lib/supabase/server';
import type { RankingChannel, RecentReviewWithChannel } from '@/lib/types/ranking';

/**
 * 今週の人気チャンネルランキングを取得
 * Materialized View (channel_stats) を活用
 *
 * @param limit - 取得件数（デフォルト: 10）
 * @returns ランキングチャンネル一覧
 */
export async function getRankingChannels(limit = 10): Promise<RankingChannel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('channels_with_stats')
    .select(`
      id,
      youtube_channel_id,
      title,
      description,
      thumbnail_url,
      subscriber_count,
      review_count,
      average_rating,
      recent_review_count
    `)
    .not('recent_review_count', 'is', null) // NULL値を除外
    .gte('recent_review_count', 1) // 最低1件のレビューが必要
    .order('recent_review_count', { ascending: false })
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching ranking channels:', error);
    throw new Error('ランキングの取得に失敗しました');
  }

  return (data || []) as RankingChannel[];
}

/**
 * 新着レビューを取得（ページネーション対応）
 * チャンネル情報とユーザー情報を含む
 *
 * @param page - ページ番号（デフォルト: 1）
 * @param limit - 取得件数（デフォルト: 20）
 * @returns 新着レビュー一覧とページネーション情報
 */
export async function getRecentReviews(
  page = 1,
  limit = 20
): Promise<{
  reviews: RecentReviewWithChannel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const supabase = await createClient();

  // 総件数を取得
  const { count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      user_id,
      channel_id,
      rating,
      title,
      content,
      is_spoiler,
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
        thumbnail_url
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching recent reviews:', error);
    throw new Error('新着レビューの取得に失敗しました');
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
