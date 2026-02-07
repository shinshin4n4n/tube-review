/**
 * レビュー型定義
 */
export interface Review {
  id: string;
  user_id: string;
  channel_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_spoiler: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * レビューとユーザー情報を含む型
 */
export interface ReviewWithUser extends Review {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  is_helpful?: boolean; // 現在のユーザーが「参考になった」を投票しているか
}

/**
 * レビューとユーザー・チャンネル情報を含む型
 */
export interface ReviewWithUserAndChannel extends ReviewWithUser {
  channel: {
    id: string;
    youtube_channel_id: string;
    title: string;
    thumbnail_url: string | null;
  };
}

/**
 * ページネーション付きレビューリスト
 */
export interface PaginatedReviews {
  reviews: ReviewWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ページネーション付きマイレビューリスト
 */
export interface PaginatedMyReviews {
  reviews: ReviewWithUserAndChannel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
