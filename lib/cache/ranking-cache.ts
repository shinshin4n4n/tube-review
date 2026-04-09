/**
 * ランキングのキャッシュヘルパー
 */

import { getRedisClient, isCacheEnabled, CACHE_KEYS, CACHE_TTL } from "./redis";
import { logger } from "@/lib/logger";

/**
 * ランキングデータの型
 */
export interface RankingData {
  channels: unknown[];
  timestamp: number;
}

/**
 * 総合ランキングをキャッシュから取得
 */
export async function getCachedTotalRanking(
  page: number = 1,
  limit: number = 20
): Promise<RankingData | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const key = `${CACHE_KEYS.RANKING_TOTAL}:${page}:${limit}`;
    const cached = await redis.get<RankingData>(key);

    if (cached) {
      logger.debug(`[Cache HIT] Total ranking: page ${page}`, { page, limit });
      return cached;
    }

    logger.debug(`[Cache MISS] Total ranking: page ${page}`, { page, limit });
    return null;
  } catch (error) {
    logger.error(
      "Failed to get cached total ranking",
      error instanceof Error ? error : undefined,
      { page, limit }
    );
    return null;
  }
}

/**
 * 総合ランキングをキャッシュに保存
 */
export async function setCachedTotalRanking(
  page: number,
  limit: number,
  data: RankingData
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `${CACHE_KEYS.RANKING_TOTAL}:${page}:${limit}`;
    await redis.set(key, data, {
      ex: CACHE_TTL.RANKING,
    });

    logger.debug(`[Cache SET] Total ranking: page ${page}`, { page, limit });
  } catch (error) {
    logger.error(
      "Failed to set cached total ranking",
      error instanceof Error ? error : undefined,
      { page, limit }
    );
  }
}

/**
 * カテゴリ別ランキングをキャッシュから取得
 */
export async function getCachedCategoryRanking(
  categorySlug: string,
  page: number = 1,
  limit: number = 20
): Promise<RankingData | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const key = `${CACHE_KEYS.RANKING_CATEGORY}:${categorySlug}:${page}:${limit}`;
    const cached = await redis.get<RankingData>(key);

    if (cached) {
      logger.debug(
        `[Cache HIT] Category ranking: ${categorySlug}, page ${page}`,
        { categorySlug, page, limit }
      );
      return cached;
    }

    logger.debug(
      `[Cache MISS] Category ranking: ${categorySlug}, page ${page}`,
      { categorySlug, page, limit }
    );
    return null;
  } catch (error) {
    logger.error(
      "Failed to get cached category ranking",
      error instanceof Error ? error : undefined,
      { categorySlug, page, limit }
    );
    return null;
  }
}

/**
 * カテゴリ別ランキングをキャッシュに保存
 */
export async function setCachedCategoryRanking(
  categorySlug: string,
  page: number,
  limit: number,
  data: RankingData
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `${CACHE_KEYS.RANKING_CATEGORY}:${categorySlug}:${page}:${limit}`;
    await redis.set(key, data, {
      ex: CACHE_TTL.RANKING,
    });

    logger.debug(
      `[Cache SET] Category ranking: ${categorySlug}, page ${page}`,
      { categorySlug, page, limit }
    );
  } catch (error) {
    logger.error(
      "Failed to set cached category ranking",
      error instanceof Error ? error : undefined,
      { categorySlug, page, limit }
    );
  }
}

/**
 * 全ランキングキャッシュを無効化
 */
export async function invalidateAllRankingCache(): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    // パターンマッチングでキーを削除
    // Note: Upstash Redisでは scan コマンドが使えないため、
    // 個別に削除するか、キー管理を工夫する必要がある
    // ここでは簡易的に主要なキーのみ削除
    const keysToDelete = [
      `${CACHE_KEYS.RANKING_TOTAL}:1:20`,
      `${CACHE_KEYS.RANKING_TOTAL}:1:50`,
    ];

    await Promise.all(keysToDelete.map((key) => redis.del(key)));

    logger.info("[Cache INVALIDATE] All ranking cache");
  } catch (error) {
    logger.error(
      "Failed to invalidate ranking cache",
      error instanceof Error ? error : undefined
    );
  }
}
