/**
 * レビュー集計のキャッシュヘルパー
 */

import { getRedisClient, isCacheEnabled, CACHE_KEYS, CACHE_TTL } from "./redis";
import { logger } from "@/lib/logger";

/**
 * レビュー統計の型
 */
export interface ReviewStats {
  channelId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  timestamp: number;
}

/**
 * チャンネルのレビュー統計をキャッシュから取得
 */
export async function getCachedReviewStats(
  channelId: string
): Promise<ReviewStats | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const key = `${CACHE_KEYS.REVIEW_STATS}:${channelId}`;
    const cached = await redis.get<ReviewStats>(key);

    if (cached) {
      logger.debug(`[Cache HIT] Review stats: ${channelId}`, { channelId });
      return cached;
    }

    logger.debug(`[Cache MISS] Review stats: ${channelId}`, { channelId });
    return null;
  } catch (error) {
    logger.error(
      "Failed to get cached review stats",
      error instanceof Error ? error : undefined,
      { channelId }
    );
    return null;
  }
}

/**
 * チャンネルのレビュー統計をキャッシュに保存
 */
export async function setCachedReviewStats(
  channelId: string,
  stats: ReviewStats
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `${CACHE_KEYS.REVIEW_STATS}:${channelId}`;
    await redis.set(key, stats, {
      ex: CACHE_TTL.REVIEW_STATS,
    });

    logger.debug(`[Cache SET] Review stats: ${channelId}`, { channelId });
  } catch (error) {
    logger.error(
      "Failed to set cached review stats",
      error instanceof Error ? error : undefined,
      { channelId }
    );
  }
}

/**
 * チャンネルのレビュー統計キャッシュを無効化
 * レビューの投稿・更新・削除時に呼び出す
 */
export async function invalidateReviewStatsCache(
  channelId: string
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `${CACHE_KEYS.REVIEW_STATS}:${channelId}`;
    await redis.del(key);

    logger.info(`[Cache INVALIDATE] Review stats: ${channelId}`, { channelId });
  } catch (error) {
    logger.error(
      "Failed to invalidate review stats cache",
      error instanceof Error ? error : undefined,
      { channelId }
    );
  }
}
