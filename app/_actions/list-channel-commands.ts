"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/error";
import { API_ERROR_CODES, type ApiResponse } from "@/lib/types/api";
import type { SearchChannelResult } from "./list-channel-queries";

/**
 * リストにチャンネルを追加
 */
export async function addChannelToListAction(
  listId: string,
  channelId: string
): Promise<ApiResponse<void>> {
  try {
    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        "ログインが必要です",
        401
      );
    }

    const supabase = await createClient();

    // リストの所有者確認
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("user_id", user.id)
      .single();

    if (listError || !list) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        "このリストを編集する権限がありません",
        403
      );
    }

    // 既に追加されているか確認
    const { data: existing } = await supabase
      .from("list_channels")
      .select("id")
      .eq("list_id", listId)
      .eq("channel_id", channelId)
      .single();

    if (existing) {
      throw new ApiError(
        API_ERROR_CODES.DUPLICATE,
        "このチャンネルは既にリストに追加されています",
        409
      );
    }

    // 現在の最大order_indexを取得
    const { data: maxOrder } = await supabase
      .from("list_channels")
      .select("order_index")
      .eq("list_id", listId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const orderIndex = (maxOrder?.order_index || 0) + 1;

    // list_channelsに追加
    const { error: insertError } = await supabase.from("list_channels").insert({
      list_id: listId,
      channel_id: channelId,
      order_index: orderIndex,
    });

    if (insertError) {
      console.error("Supabase error:", insertError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "チャンネルの追加に失敗しました",
        500
      );
    }

    revalidatePath(`/my-channels/lists/${listId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * リストからチャンネルを削除
 */
export async function removeChannelFromListAction(
  listId: string,
  channelId: string
): Promise<ApiResponse<void>> {
  try {
    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        "ログインが必要です",
        401
      );
    }

    const supabase = await createClient();

    // リストの所有者確認
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("user_id", user.id)
      .single();

    if (listError || !list) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        "このリストを編集する権限がありません",
        403
      );
    }

    // list_channelsから削除
    const { error: deleteError } = await supabase
      .from("list_channels")
      .delete()
      .eq("list_id", listId)
      .eq("channel_id", channelId);

    if (deleteError) {
      console.error("Supabase error:", deleteError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "チャンネルの削除に失敗しました",
        500
      );
    }

    revalidatePath(`/my-channels/lists/${listId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * チャンネルを検索（リスト追加用）
 * YouTube APIから直接検索し、結果をデータベースに保存
 */
export async function searchChannelsForListAction(
  query: string
): Promise<ApiResponse<SearchChannelResult[]>> {
  try {
    const { searchChannels, getChannelDetails } =
      await import("@/lib/youtube/api");
    const youtubeResults = await searchChannels(query, 10);

    if (youtubeResults.length === 0) {
      return { success: true, data: [] };
    }

    const supabase = await createClient();
    const searchResults: SearchChannelResult[] = [];

    for (const ytChannel of youtubeResults) {
      try {
        const channelDetails = await getChannelDetails(
          ytChannel.youtubeChannelId
        );

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
            { onConflict: "youtube_channel_id", ignoreDuplicates: false }
          )
          .select(
            "id, youtube_channel_id, title, thumbnail_url, subscriber_count"
          )
          .single();

        if (upsertError) {
          console.error(
            "[searchChannelsForListAction] Upsert error:",
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
          "[searchChannelsForListAction] Error processing:",
          ytChannel.youtubeChannelId,
          channelError
        );
        continue;
      }
    }

    return { success: true, data: searchResults };
  } catch (err) {
    console.error("[searchChannelsForListAction] Caught error:", err);

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
