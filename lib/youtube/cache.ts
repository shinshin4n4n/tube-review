import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
import { YouTubeOperation, CACHE_TTL_SECONDS } from './types';
import { getRedisClient, isCacheEnabled } from '@/lib/cache/redis';

/**
 * キャッシュからデータを取得
 * Upstash Redis → Supabase の順で確認（2層キャッシュ）
 * @param cacheKey キャッシュキー
 * @returns キャッシュデータ（存在しないか期限切れの場合はnull）
 */
export async function getCachedData<T>(cacheKey: string): Promise<T | null> {
  // 1層目: Upstash Redis キャッシュをチェック
  if (isCacheEnabled()) {
    try {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get<T>(cacheKey);
        if (cached) {
          console.log(`[Redis Cache HIT] ${cacheKey}`);
          return cached;
        }
        console.log(`[Redis Cache MISS] ${cacheKey}`);
      }
    } catch (error) {
      console.error('Redis cache get error:', error);
      // Redisエラー時はSupabaseキャッシュにフォールバック
    }
  }

  // 2層目: Supabase キャッシュにフォールバック
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('youtube_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    // 期限切れチェック
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return null;
    }

    console.log(`[Supabase Cache HIT] ${cacheKey}`);
    return data.data as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * データをキャッシュに保存
 * Upstash Redis と Supabase の両方に保存（2層キャッシュ）
 * @param cacheKey キャッシュキー
 * @param data 保存するデータ
 */
export async function setCachedData<T>(
  cacheKey: string,
  data: T
): Promise<void> {
  // 1層目: Upstash Redis に保存
  if (isCacheEnabled()) {
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.set(cacheKey, data, {
          ex: CACHE_TTL_SECONDS,
        });
        console.log(`[Redis Cache SET] ${cacheKey}`);
      }
    } catch (error) {
      console.error('Redis cache set error:', error);
      // Redisエラーでも処理は継続（Supabaseキャッシュに保存）
    }
  }

  // 2層目: Supabase にも保存（フォールバック用）
  try {
    const supabase = await createClient();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);

    const { error } = await supabase
      .from('youtube_cache')
      .upsert({
        cache_key: cacheKey,
        data,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase cache set error:', error);
    } else {
      console.log(`[Supabase Cache SET] ${cacheKey}`);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * キャッシュキーを生成
 * @param operation 操作タイプ
 * @param params パラメータ
 * @returns SHA256ハッシュベースのキャッシュキー
 */
export function generateCacheKey(
  operation: YouTubeOperation,
  params: Record<string, unknown>
): string {
  // パラメータをソートして一貫性のあるJSON文字列を生成
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);

  const paramsString = JSON.stringify(sortedParams);

  // SHA256ハッシュを生成
  const hash = createHash('sha256').update(paramsString).digest('hex');

  return `youtube:${operation}:${hash}`;
}
