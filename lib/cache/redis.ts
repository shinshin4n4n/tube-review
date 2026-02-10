/**
 * Upstash Redis クライアント
 * @see https://upstash.com/docs/redis
 */

import { Redis } from '@upstash/redis';

// Redisクライアントのインスタンス（シングルトン）
let redis: Redis | null = null;

/**
 * Redisクライアントを取得
 * 環境変数が設定されていない場合はnullを返す（開発環境での柔軟性のため）
 */
export function getRedisClient(): Redis | null {
  // 既にインスタンスがある場合は再利用
  if (redis) {
    return redis;
  }

  // 環境変数が設定されていない場合はnullを返す
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Upstash Redis credentials not found. Caching is disabled.');
    return null;
  }

  // Redisクライアントを初期化
  redis = new Redis({
    url,
    token,
  });

  return redis;
}

/**
 * キャッシュが有効かどうかをチェック
 */
export function isCacheEnabled(): boolean {
  return getRedisClient() !== null;
}

/**
 * キャッシュキーのプレフィックス
 */
export const CACHE_KEYS = {
  // チャンネル情報
  CHANNEL_INFO: 'channel:info',
  CHANNEL_STATS: 'channel:stats',

  // ランキング
  RANKING_TOTAL: 'ranking:total',
  RANKING_CATEGORY: 'ranking:category',

  // レビュー集計
  REVIEW_STATS: 'review:stats',
} as const;

/**
 * TTL（秒単位）
 */
export const CACHE_TTL = {
  // チャンネル情報: 24時間
  CHANNEL_INFO: 60 * 60 * 24,

  // チャンネル統計: 1時間
  CHANNEL_STATS: 60 * 60,

  // ランキング: 15分
  RANKING: 60 * 15,

  // レビュー集計: 5分
  REVIEW_STATS: 60 * 5,
} as const;
