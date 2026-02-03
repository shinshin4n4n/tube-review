import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
import { YouTubeOperation, CACHE_TTL_SECONDS } from './types';

/**
 * キャッシュからデータを取得
 * @param cacheKey キャッシュキー
 * @returns キャッシュデータ（存在しないか期限切れの場合はnull）
 */
export async function getCachedData<T>(cacheKey: string): Promise<T | null> {
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

    return data.data as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * データをキャッシュに保存
 * @param cacheKey キャッシュキー
 * @param data 保存するデータ
 */
export async function setCachedData<T>(
  cacheKey: string,
  data: T
): Promise<void> {
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
      console.error('Cache set error:', error);
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
