"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/error";
import { API_ERROR_CODES, type ApiResponse } from "@/lib/types/api";
import { isUUID } from "@/lib/validation-utils";
import type { ChannelStatus } from "@/lib/validations/user-channel";
import type {
  UserChannel,
  UserChannelWithChannel,
} from "@/lib/types/user-channel";

/**
 * 特定チャンネルのユーザーステータスを取得
 * @param channelId YouTubeチャンネルID または UUID
 */
export async function getMyChannelStatusAction(
  channelId: string
): Promise<ApiResponse<UserChannel | null>> {
  try {
    // 認証チェック（未ログインの場合はnullを返す）
    const user = await getUser();
    if (!user) {
      return {
        success: true,
        data: null,
      };
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // channelIdがUUID形式かどうかをチェック
    const isChannelUUID = isUUID(channelId);

    let channelDbId: string;

    if (isChannelUUID) {
      // UUID形式の場合は直接データベースIDとして使用
      channelDbId = channelId;

      // チャンネルの存在確認
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .select("id")
        .eq("id", channelDbId)
        .single();

      if (channelError || !channel) {
        return {
          success: true,
          data: null,
        };
      }
    } else {
      // YouTube IDの場合は検索
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .select("id")
        .eq("youtube_channel_id", channelId)
        .single();

      if (channelError || !channel) {
        return {
          success: true,
          data: null,
        };
      }

      channelDbId = channel.id;
    }

    // ユーザーのステータスを取得
    const { data, error } = await supabase
      .from("user_channels")
      .select("*")
      .eq("user_id", user.id)
      .eq("channel_id", channelDbId)
      .single();

    // データが見つからない場合はnullを返す（エラーではない）
    if (error && error.code === "PGRST116") {
      return {
        success: true,
        data: null,
      };
    }

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "ステータスの取得に失敗しました",
        500
      );
    }

    return {
      success: true,
      data: data as UserChannel,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * マイリスト一覧を取得
 */
export async function getMyListAction(
  status?: ChannelStatus
): Promise<ApiResponse<UserChannelWithChannel[]>> {
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

    // Supabaseクライアント作成
    const supabase = await createClient();

    // クエリビルダー
    let query = supabase
      .from("user_channels")
      .select(
        `
        id,
        user_id,
        channel_id,
        status,
        created_at,
        updated_at,
        channel:channels (
          id,
          youtube_channel_id,
          title,
          description,
          thumbnail_url,
          subscriber_count,
          video_count,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // ステータスフィルタ
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "マイリストの取得に失敗しました",
        500
      );
    }

    // データ変換（channelが配列の場合に対応）
    const transformed = data.map((item) => ({
      ...item,
      channel: Array.isArray(item.channel) ? item.channel[0] : item.channel,
    })) as UserChannelWithChannel[];

    return {
      success: true,
      data: transformed,
    };
  } catch (err) {
    return handleApiError(err);
  }
}
