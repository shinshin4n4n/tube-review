'use server';

import { z } from 'zod';
import type { ApiResponse } from '@/lib/types/api';
import {
  searchChannelsSchema,
  getChannelDetailsSchema,
} from '@/lib/validation/youtube';
import { searchChannels, getChannelDetails } from '@/lib/youtube/api';
import type { ChannelSearchResult, ChannelDetails } from '@/lib/youtube/types';
import { YouTubeApiError, YouTubeErrorCode } from '@/lib/youtube/types';

/**
 * YouTubeチャンネルを検索
 * @param query 検索クエリ
 * @param maxResults 最大取得件数
 */
export async function searchChannelsAction(
  query: string,
  maxResults: number = 10
): Promise<ApiResponse<ChannelSearchResult[]>> {
  try {
    // バリデーション
    const validated = searchChannelsSchema.parse({ query, maxResults });

    // チャンネル検索
    const results = await searchChannels(
      validated.query,
      validated.maxResults
    );

    return {
      success: true,
      data: results,
    };
  } catch (err) {
    // Zodバリデーションエラー
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message || 'Validation error',
        details: err.issues,
      };
    }

    // YouTube APIエラー
    if (err instanceof YouTubeApiError) {
      return {
        success: false,
        error: getErrorMessage(err.code),
        details: err.details,
      };
    }

    // 予期しないエラー
    console.error('Search channels error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while searching channels',
    };
  }
}

/**
 * YouTubeチャンネル詳細を取得
 * @param youtubeChannelId YouTubeチャンネルID
 */
export async function getChannelDetailsAction(
  youtubeChannelId: string
): Promise<ApiResponse<ChannelDetails>> {
  try {
    // バリデーション
    const validated = getChannelDetailsSchema.parse({ youtubeChannelId });

    // チャンネル詳細取得
    const details = await getChannelDetails(validated.youtubeChannelId);

    return {
      success: true,
      data: details,
    };
  } catch (err) {
    // Zodバリデーションエラー
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message || 'Validation error',
        details: err.issues,
      };
    }

    // YouTube APIエラー
    if (err instanceof YouTubeApiError) {
      return {
        success: false,
        error: getErrorMessage(err.code),
        details: err.details,
      };
    }

    // 予期しないエラー
    console.error('Get channel details error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching channel details',
    };
  }
}

/**
 * YouTubeErrorCodeに対応するユーザーフレンドリーなエラーメッセージを取得
 */
function getErrorMessage(code: YouTubeErrorCode): string {
  switch (code) {
    case YouTubeErrorCode.QUOTA_EXCEEDED:
      return 'YouTube API quota exceeded. Please try again later.';
    case YouTubeErrorCode.RATE_LIMIT:
      return 'Rate limit exceeded. Please try again later.';
    case YouTubeErrorCode.INVALID_API_KEY:
      return 'Invalid API configuration. Please contact support.';
    case YouTubeErrorCode.NOT_FOUND:
      return 'Channel not found.';
    case YouTubeErrorCode.NETWORK_ERROR:
      return 'Network error occurred. Please check your connection and try again.';
    default:
      return 'An error occurred while communicating with YouTube API.';
  }
}
