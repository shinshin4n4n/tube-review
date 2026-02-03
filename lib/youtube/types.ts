/**
 * YouTube API型定義とアプリケーション内部型
 */

// ==================== YouTube API Response Types ====================

/**
 * YouTube検索APIレスポンス（チャンネル検索）
 */
export interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeSearchItem {
  id: {
    kind: string;
    channelId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
    };
  };
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

/**
 * YouTube Channels APIレスポンス（チャンネル詳細）
 */
export interface YouTubeChannelResponse {
  items: YouTubeChannelItem[];
}

export interface YouTubeChannelItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

// ==================== Application Internal Types ====================

/**
 * チャンネル検索結果（アプリケーション内部型）
 */
export interface ChannelSearchResult {
  youtubeChannelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

/**
 * チャンネル詳細（アプリケーション内部型）
 */
export interface ChannelDetails {
  youtubeChannelId: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

// ==================== Rate Limiter Types ====================

/**
 * YouTube API操作タイプ
 */
export type YouTubeOperation = 'search' | 'details';

/**
 * クォータ使用量
 */
export interface QuotaUsage {
  date: string; // YYYY-MM-DD形式
  used: number;
  operations: {
    search: number;
    details: number;
  };
}

/**
 * 操作別コスト定義
 */
export const OPERATION_COSTS: Record<YouTubeOperation, number> = {
  search: 100,
  details: 1,
} as const;

/**
 * 操作別上限定義
 */
export const OPERATION_LIMITS: Record<YouTubeOperation, number> = {
  search: 80, // 100 units × 80 = 8,000 units
  details: 2000, // 1 unit × 2,000 = 2,000 units
} as const;

/**
 * 日次クォータ上限
 */
export const DAILY_QUOTA_LIMIT = 10000;

// ==================== Cache Types ====================

/**
 * キャッシュデータ
 */
export interface CachedData<T> {
  data: T;
  expiresAt: string; // ISO 8601形式
}

/**
 * キャッシュTTL（24時間 = 86400秒）
 */
export const CACHE_TTL_SECONDS = 86400;

// ==================== Error Types ====================

/**
 * YouTube APIエラーコード
 */
export enum YouTubeErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_API_KEY = 'INVALID_API_KEY',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * YouTube APIエラー
 */
export class YouTubeApiError extends Error {
  constructor(
    public code: YouTubeErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'YouTubeApiError';
  }
}
