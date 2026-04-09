/**
 * チャンネル情報のキャッシュヘルパー
 */

import { getRedisClient, isCacheEnabled, CACHE_KEYS, CACHE_TTL } from "./redis";
import { logger } from "@/lib/logger";
import type { ChannelDetails } from "@/lib/youtube/types";

/**
 * チャンネル基本情報をキャッシュから取得
 */
export async function getCachedChannelInfo(
  channelId: string
): Promise<ChannelDetails | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const key = `${CACHE_KEYS.CHANNEL_INFO}:${channelId}`;
    const cached = await redis.get<ChannelDetails>(key);

    if (cached) {
      logger.debug(`[Cache HIT] Channel info: ${channelId}`, { channelId });
      return cached;
    }

    logger.debug(`[Cache MISS] Channel info: ${channelId}`, { channelId });
    return null;
  } catch (error) {
    logger.error(
      "Failed to get cached channel info",
      error instanceof Error ? error : undefined,
      { channelId }
    );
    return null;
  }
}

/**
 * チャンネル基本情報をキャッシュに保存
 */
export async function setCachedChannelInfo(
  channelId: string,
  data: ChannelDetails
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `${CACHE_KEYS.CHANNEL_INFO}:${channelId}`;
    await redis.set(key, data, {
      ex: CACHE_TTL.CHANNEL_INFO,
    });

    logger.debug(`[Cache SET] Channel info: ${channelId}`, { channelId });
  } catch (error) {
    logger.error(
      "Failed to set cached channel info",
      error instanceof Error ? error : undefined,
      { channelId }
    );
  }
}

/**
 * チャンネル統計情報をキャッシュから取得
 */
export async function getCachedChannelStats(
  channelId: string
): Promise<ChannelDetails | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const key = `${CACHE_KEYS.CHANNEL_STATS}:${channelId}`;
    const cached = await redis.get<ChannelDetails>(key);

    if (cached) {
      logger.debug(`[Cache HIT] Channel stats: ${channelId}`, { channelId });
      return cached;
    }

    logger.debug(`[Cache MISS] Channel stats: ${channelId}`, { channelId });
    return null;
  } catch (error) {
    logger.error(
      "Failed to get cached channel stats",
      error instanceof Error ? error : undefined,
      { channelId }
    );
    return null;
  }
}

/**
 * チャンネル統計情報をキャッシュに保存
 */
export async function setCachedChannelStats(
  channelId: string,
  data: ChannelDetails
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `${CACHE_KEYS.CHANNEL_STATS}:${channelId}`;
    await redis.set(key, data, {
      ex: CACHE_TTL.CHANNEL_STATS,
    });

    logger.debug(`[Cache SET] Channel stats: ${channelId}`, { channelId });
  } catch (error) {
    logger.error(
      "Failed to set cached channel stats",
      error instanceof Error ? error : undefined,
      { channelId }
    );
  }
}

/**
 * チャンネル情報のキャッシュを無効化
 */
export async function invalidateChannelCache(channelId: string): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const infoKey = `${CACHE_KEYS.CHANNEL_INFO}:${channelId}`;
    const statsKey = `${CACHE_KEYS.CHANNEL_STATS}:${channelId}`;

    await Promise.all([redis.del(infoKey), redis.del(statsKey)]);

    logger.info(`[Cache INVALIDATE] Channel: ${channelId}`, { channelId });
  } catch (error) {
    logger.error(
      "Failed to invalidate channel cache",
      error instanceof Error ? error : undefined,
      { channelId }
    );
  }
}
