/**
 * ランキング型定義
 */

/**
 * ランキング用チャンネル情報
 * チャンネル基本情報 + 統計情報
 */
export interface RankingChannel {
  id: string;
  youtube_channel_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  subscriber_count: number;
  review_count: number;
  average_rating: number;
  recent_review_count: number;
}

/**
 * ランキングレスポンス
 */
export interface RankingResponse {
  channels: RankingChannel[];
  period: 'week' | 'month' | 'all';
}

/**
 * 新着レビュー（チャンネル情報付き）
 */
export interface RecentReviewWithChannel {
  id: string;
  user_id: string;
  channel_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_spoiler: boolean;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  channel: {
    id: string;
    youtube_channel_id: string;
    title: string;
    thumbnail_url: string | null;
  };
}
