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

// searchChannelsForListAction は DB upsert を含むため list-channel-commands.ts に配置

/**
 * チャンネル検索結果型（commands でも使用するため export）
 */
export interface SearchChannelResult {
  id: string;
  youtube_channel_id: string;
  title: string;
  thumbnail_url: string;
  subscriber_count: number;
}
