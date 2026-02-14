"use server";

import { z } from "zod";
import type { ApiResponse } from "@/lib/types/api";
import {
  searchChannelsSchema,
  getChannelDetailsSchema,
} from "@/lib/validations/youtube";
import { searchChannels, getChannelDetails } from "@/lib/youtube/api";
import type { ChannelSearchResult, ChannelDetails } from "@/lib/youtube/types";
import { YouTubeApiError, YouTubeErrorCode } from "@/lib/youtube/types";
import { createClient } from "@/lib/supabase/server";

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
    const results = await searchChannels(validated.query, validated.maxResults);

    return {
      success: true,
      data: results,
    };
  } catch (err) {
    // Zodバリデーションエラー
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message || "Validation error",
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
    console.error("Search channels error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while searching channels",
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

    // チャンネルデータをDBに保存（upsert）
    try {
      const supabase = await createClient();
      const { error: upsertError } = await supabase.from("channels").upsert(
        {
          youtube_channel_id: details.youtubeChannelId,
          title: details.title,
          description: details.description || null,
          thumbnail_url: details.thumbnailUrl,
          subscriber_count: details.subscriberCount,
          video_count: details.videoCount,
          view_count: details.viewCount,
          cache_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "youtube_channel_id",
          ignoreDuplicates: false,
        }
      );

      if (upsertError) {
        console.error("Failed to upsert channel to DB:", upsertError);
        // DBへの保存に失敗してもYouTubeデータは返す
      }
    } catch (dbError) {
      console.error("Database error while saving channel:", dbError);
      // DBエラーでもYouTubeデータは返す
    }

    return {
      success: true,
      data: details,
    };
  } catch (err) {
    // Zodバリデーションエラー
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message || "Validation error",
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
    console.error("Get channel details error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching channel details",
    };
  }
}

/**
 * データベースのチャンネルIDからチャンネル詳細を取得
 * @param channelId データベースのチャンネルID（UUID）
 */
export async function getChannelDetailsByDbIdAction(
  channelId: string
): Promise<ApiResponse<ChannelDetails>> {
  try {
    const supabase = await createClient();

    // UUIDかYouTube IDかを判定
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        channelId
      );

    // データベースからチャンネル情報を取得
    let query = supabase
      .from("channels")
      .select(
        "youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, view_count, published_at"
      );

    // UUIDの場合はIDで検索、そうでない場合はYouTube IDで検索
    if (isUUID) {
      query = query.eq("id", channelId);
    } else {
      query = query.eq("youtube_channel_id", channelId);
    }

    const { data: channel, error: dbError } = await query.single();

    if (dbError || !channel) {
      console.error("Channel not found in database:", dbError);
      // データベースにない場合は、YouTube APIから取得
      if (!isUUID) {
        return await getChannelDetailsAction(channelId);
      }
      return {
        success: false,
        error: "チャンネルが見つかりませんでした",
      };
    }

    // データベースの情報をChannelDetails形式に変換
    const channelDetails: ChannelDetails = {
      youtubeChannelId: channel.youtube_channel_id,
      title: channel.title,
      description: channel.description || undefined,
      thumbnailUrl: channel.thumbnail_url || "",
      subscriberCount: channel.subscriber_count || 0,
      videoCount: channel.video_count || 0,
      viewCount: channel.view_count || 0,
      publishedAt: channel.published_at || "",
      customUrl: undefined, // データベースには保存していない
    };

    return {
      success: true,
      data: channelDetails,
    };
  } catch (err) {
    console.error("Get channel details by DB ID error:", err);
    return {
      success: false,
      error: "チャンネル詳細の取得に失敗しました",
    };
  }
}

/**
 * YouTubeErrorCodeに対応するユーザーフレンドリーなエラーメッセージを取得
 */
function getErrorMessage(code: YouTubeErrorCode): string {
  switch (code) {
    case YouTubeErrorCode.QUOTA_EXCEEDED:
      return "YouTube API quota exceeded. Please try again later.";
    case YouTubeErrorCode.RATE_LIMIT:
      return "Rate limit exceeded. Please try again later.";
    case YouTubeErrorCode.INVALID_API_KEY:
      return "Invalid API configuration. Please contact support.";
    case YouTubeErrorCode.NOT_FOUND:
      return "Channel not found.";
    case YouTubeErrorCode.NETWORK_ERROR:
      return "Network error occurred. Please check your connection and try again.";
    default:
      return "An error occurred while communicating with YouTube API.";
  }
}
