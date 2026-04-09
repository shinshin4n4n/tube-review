"use server";

import { createClient } from "@/lib/supabase/server";
import { ApiError, handleApiError } from "@/lib/api/error";
import { API_ERROR_CODES, type ApiResponse } from "@/lib/types/api";

/**
 * リストチャンネル型（チャンネル情報を含む）
 */
interface ListChannelWithChannel {
  id: string;
  order_index: number;
  created_at: string;
  channel: {
    id: string;
    youtube_channel_id: string;
    title: string;
    description: string | null;
    thumbnail_url: string;
    subscriber_count: number;
    video_count: number;
  };
}

/**
 * リストのチャンネル一覧を取得
 */
export async function getListChannelsAction(
  listId: string
): Promise<ApiResponse<ListChannelWithChannel[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("list_channels")
      .select(
        `
        id,
        order_index,
        created_at,
        channel:channels!inner (
          id,
          youtube_channel_id,
          title,
          description,
          thumbnail_url,
          subscriber_count,
          video_count
        )
      `
      )
      .eq("list_id", listId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "チャンネル一覧の取得に失敗しました",
        500
      );
    }

    // データ変換（Supabaseは channel を配列で返すため、最初の要素を取得）
    const transformed = (data || []).map((item) => ({
      ...item,
      channel: Array.isArray(item.channel) ? item.channel[0] : item.channel,
    })) as ListChannelWithChannel[];

    return {
      success: true,
      data: transformed,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * チャンネル検索結果型
 */
interface SearchChannelResult {
  id: string;
  youtube_channel_id: string;
  title: string;
  thumbnail_url: string;
  subscriber_count: number;
}

/**
 * チャンネルを検索（リスト追加用）
 * YouTube APIから直接検索し、結果をデータベースに保存
 */
export async function searchChannelsForListAction(
  query: string
): Promise<ApiResponse<SearchChannelResult[]>> {
  try {
    // YouTube APIから検索
    const { searchChannels, getChannelDetails } =
      await import("@/lib/youtube/api");
    const youtubeResults = await searchChannels(query, 10);

    if (youtubeResults.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const supabase = await createClient();
    const searchResults: SearchChannelResult[] = [];

    // 各チャンネルの詳細情報を取得してデータベースに保存（upsert）
    for (const ytChannel of youtubeResults) {
      try {
        // チャンネル詳細情報を取得（登録者数などを含む）
        const channelDetails = await getChannelDetails(
          ytChannel.youtubeChannelId
        );

        // データベースにチャンネルを保存
        const { data: upsertedChannel, error: upsertError } = await supabase
          .from("channels")
          .upsert(
            {
              youtube_channel_id: channelDetails.youtubeChannelId,
              title: channelDetails.title,
              description: channelDetails.description || null,
              thumbnail_url: channelDetails.thumbnailUrl,
              subscriber_count: channelDetails.subscriberCount || 0,
              video_count: channelDetails.videoCount || 0,
              view_count: channelDetails.viewCount || 0,
              cache_updated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "youtube_channel_id",
              ignoreDuplicates: false,
            }
          )
          .select(
            "id, youtube_channel_id, title, thumbnail_url, subscriber_count"
          )
          .single();

        if (upsertError) {
          console.error(
            "[searchChannelsForListAction] Upsert error for channel:",
            ytChannel.youtubeChannelId,
            upsertError
          );
          continue;
        }

        if (upsertedChannel) {
          searchResults.push(upsertedChannel);
        }
      } catch (channelError) {
        console.error(
          "[searchChannelsForListAction] Error processing channel:",
          ytChannel.youtubeChannelId,
          channelError
        );
        // 個別のチャンネルでエラーが発生しても、他のチャンネルの処理を続行
        continue;
      }
    }

    return {
      success: true,
      data: searchResults,
    };
  } catch (err) {
    console.error("[searchChannelsForListAction] Caught error:", err);

    // YouTube APIエラーの場合
    if (err && typeof err === "object" && "code" in err) {
      const ytError = err as { code: string };
      if (ytError.code === "QUOTA_EXCEEDED") {
        return {
          success: false,
          error:
            "YouTube APIのクォータを超過しました。しばらくしてから再度お試しください。",
        };
      }
      if (ytError.code === "RATE_LIMIT") {
        return {
          success: false,
          error:
            "リクエスト制限に達しました。しばらくしてから再度お試しください。",
        };
      }
    }

    return handleApiError(err);
  }
}
