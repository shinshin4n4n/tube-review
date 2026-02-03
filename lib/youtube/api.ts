import { env } from '@/lib/env';
import {
  YouTubeSearchResponse,
  YouTubeChannelResponse,
  ChannelSearchResult,
  ChannelDetails,
  YouTubeApiError,
  YouTubeErrorCode,
} from './types';
import { getCachedData, setCachedData, generateCacheKey } from './cache';
import { youtubeRateLimiter } from './rate-limiter';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube Data API クライアントクラス
 */
class YouTubeDataApiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = env.YOUTUBE_API_KEY;
  }

  /**
   * チャンネルを検索
   * @param query 検索クエリ
   * @param maxResults 最大取得件数
   */
  async searchChannels(
    query: string,
    maxResults: number
  ): Promise<ChannelSearchResult[]> {
    const url = new URL(`${YOUTUBE_API_BASE_URL}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('type', 'channel');
    url.searchParams.append('q', query);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('key', this.apiKey);

    const response = await this.fetchWithErrorHandling<YouTubeSearchResponse>(
      url.toString()
    );

    return response.items.map((item) => ({
      youtubeChannelId: item.id.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high.url,
    }));
  }

  /**
   * チャンネル詳細を取得
   * @param youtubeChannelId YouTubeチャンネルID
   */
  async getChannelDetails(
    youtubeChannelId: string
  ): Promise<ChannelDetails> {
    const url = new URL(`${YOUTUBE_API_BASE_URL}/channels`);
    url.searchParams.append('part', 'snippet,statistics');
    url.searchParams.append('id', youtubeChannelId);
    url.searchParams.append('key', this.apiKey);

    const response = await this.fetchWithErrorHandling<YouTubeChannelResponse>(
      url.toString()
    );

    if (!response.items || response.items.length === 0) {
      throw new YouTubeApiError(
        YouTubeErrorCode.NOT_FOUND,
        `Channel not found: ${youtubeChannelId}`
      );
    }

    const channel = response.items[0]!;

    return {
      youtubeChannelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl: channel.snippet.thumbnails.high.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
      videoCount: parseInt(channel.statistics.videoCount, 10),
      viewCount: parseInt(channel.statistics.viewCount, 10),
    };
  }

  /**
   * エラーハンドリング付きfetch
   */
  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        await this.handleHttpError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof YouTubeApiError) {
        throw error;
      }

      console.error('YouTube API network error:', error);
      throw new YouTubeApiError(
        YouTubeErrorCode.NETWORK_ERROR,
        'Network error occurred while fetching from YouTube API',
        error
      );
    }
  }

  /**
   * HTTPエラーをハンドリング
   */
  private async handleHttpError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 403) {
      const errorMessage =
        errorData.error?.message || JSON.stringify(errorData);

      if (errorMessage.toLowerCase().includes('quota')) {
        throw new YouTubeApiError(
          YouTubeErrorCode.RATE_LIMIT,
          'YouTube API quota exceeded',
          errorData
        );
      }

      throw new YouTubeApiError(
        YouTubeErrorCode.INVALID_API_KEY,
        'Invalid API key',
        errorData
      );
    }

    if (response.status === 404) {
      throw new YouTubeApiError(
        YouTubeErrorCode.NOT_FOUND,
        'Resource not found',
        errorData
      );
    }

    throw new YouTubeApiError(
      YouTubeErrorCode.UNKNOWN_ERROR,
      `HTTP error ${response.status}`,
      errorData
    );
  }
}

/**
 * チャンネルを検索（キャッシュ統合版）
 * @param query 検索クエリ
 * @param maxResults 最大取得件数
 */
export async function searchChannels(
  query: string,
  maxResults: number = 10
): Promise<ChannelSearchResult[]> {
  // キャッシュチェック
  const cacheKey = generateCacheKey('search', { query, maxResults });
  const cached = await getCachedData<ChannelSearchResult[]>(cacheKey);

  if (cached) {
    return cached;
  }

  // レート制限チェック
  await youtubeRateLimiter.checkQuota('search');

  // APIから取得
  const client = new YouTubeDataApiClient();
  const results = await client.searchChannels(query, maxResults);

  // キャッシュに保存
  await setCachedData(cacheKey, results);

  return results;
}

/**
 * チャンネル詳細を取得（キャッシュ統合版）
 * @param youtubeChannelId YouTubeチャンネルID
 */
export async function getChannelDetails(
  youtubeChannelId: string
): Promise<ChannelDetails> {
  // キャッシュチェック
  const cacheKey = generateCacheKey('details', { youtubeChannelId });
  const cached = await getCachedData<ChannelDetails>(cacheKey);

  if (cached) {
    return cached;
  }

  // レート制限チェック
  await youtubeRateLimiter.checkQuota('details');

  // APIから取得
  const client = new YouTubeDataApiClient();
  const details = await client.getChannelDetails(youtubeChannelId);

  // キャッシュに保存
  await setCachedData(cacheKey, details);

  return details;
}
