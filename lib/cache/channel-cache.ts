/**
 * チャンネル情報のキャッシュヘルパー
 */

import {
  getRedisClient,
  isCacheEnabled,
  CACHE_KEYS,
  CACHE_TTL,
} from './redis';
import type { ChannelDetails } from '@/lib/youtube/types';

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
      console.log(`[Cache HIT] Channel info: ${channelId}`);
      return cached;
    }

    console.log(`[Cache MISS] Channel info: ${channelId}`);
    return null;
  } catch (error) {
    console.error('Failed to get cached channel info:', error);
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

    console.log(`[Cache SET] Channel info: ${channelId}`);
  } catch (error) {
    console.error('Failed to set cached channel info:', error);
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
      console.log(`[Cache HIT] Channel stats: ${channelId}`);
      return cached;
    }

    console.log(`[Cache MISS] Channel stats: ${channelId}`);
    return null;
  } catch (error) {
    console.error('Failed to get cached channel stats:', error);
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

    console.log(`[Cache SET] Channel stats: ${channelId}`);
  } catch (error) {
    console.error('Failed to set cached channel stats:', error);
  }
}

/**
 * チャンネル情報のキャッシュを無効化
 */
export async function invalidateChannelCache(
  channelId: string
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const infoKey = `${CACHE_KEYS.CHANNEL_INFO}:${channelId}`;
    const statsKey = `${CACHE_KEYS.CHANNEL_STATS}:${channelId}`;

    await Promise.all([redis.del(infoKey), redis.del(statsKey)]);

    console.log(`[Cache INVALIDATE] Channel: ${channelId}`);
  } catch (error) {
    console.error('Failed to invalidate channel cache:', error);
  }
}
