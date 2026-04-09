"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/error";
import { API_ERROR_CODES, type ApiResponse } from "@/lib/types/api";
import { extractYoutubeChannelId } from "@/lib/types/guards";
import { isUUID } from "@/lib/validation-utils";
import {
  addToMyListSchema,
  updateMyListStatusSchema,
  type AddToMyListInput,
  type UpdateMyListStatusInput,
} from "@/lib/validations/user-channel";
import type { UserChannel } from "@/lib/types/user-channel";
import { DB_ERROR_CODES } from "@/lib/constants/database-errors";

/**
 * チャンネルをマイリストに追加
 */
export async function addToMyListAction(
  input: AddToMyListInput
): Promise<ApiResponse<UserChannel>> {
  try {
    // バリデーション
    const validated = addToMyListSchema.parse(input);

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

    // channelIdがUUID形式かどうかをチェック
    const isChannelUUID = isUUID(validated.channelId);

    let channelDbId: string;

    if (isChannelUUID) {
      // UUID形式の場合は直接データベースIDとして使用
      channelDbId = validated.channelId;

      // チャンネルの存在確認
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .select("id")
        .eq("id", channelDbId)
        .single();

      if (channelError || !channel) {
        throw new ApiError(
          API_ERROR_CODES.NOT_FOUND,
          "チャンネルが見つかりません",
          404
        );
      }
    } else {
      // YouTube IDの場合は検索
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .select("id")
        .eq("youtube_channel_id", validated.channelId)
        .single();

      if (channelError || !channel) {
        throw new ApiError(
          API_ERROR_CODES.NOT_FOUND,
          "チャンネルが見つかりません",
          404
        );
      }

      channelDbId = channel.id;
    }

    // 既存のエントリを確認
    const { data: existing } = await supabase
      .from("user_channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_id", channelDbId)
      .single();

    // 既に追加済みの場合はエラー
    if (existing) {
      throw new ApiError(
        API_ERROR_CODES.DUPLICATE,
        "このチャンネルは既にマイリストに追加されています",
        409
      );
    }

    // user_channelsに挿入
    const { data, error } = await supabase
      .from("user_channels")
      .insert({
        user_id: user.id,
        channel_id: channelDbId,
        status: validated.status,
      })
      .select()
      .single();

    if (error) {
      // 重複エラーチェック（UNIQUE制約違反）
      if (error.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
        throw new ApiError(
          API_ERROR_CODES.DUPLICATE,
          "このチャンネルは既にマイリストに追加されています",
          409
        );
      }

      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "マイリストへの追加に失敗しました",
        500
      );
    }

    // チャンネル詳細ページを再検証
    revalidatePath(`/channels/${validated.channelId}`);

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * マイリストのステータスを更新
 */
export async function updateMyListStatusAction(
  userChannelId: string,
  input: UpdateMyListStatusInput
): Promise<ApiResponse<UserChannel>> {
  try {
    // バリデーション
    const validated = updateMyListStatusSchema.parse(input);

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

    // ステータスを更新（RLSで自分のデータのみ更新可能）
    const { data, error } = await supabase
      .from("user_channels")
      .update({
        status: validated.status,
      })
      .eq("id", userChannelId)
      // RLSポリシー 'user_channels_update_own' で user_id チェック済み
      .select("*, channel:channels!inner(youtube_channel_id)")
      .single();

    if (error) {
      // レコードが見つからない、または権限がない
      if (error.code === "PGRST116") {
        throw new ApiError(
          API_ERROR_CODES.FORBIDDEN,
          "このデータを編集する権限がありません",
          403
        );
      }

      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "ステータスの更新に失敗しました",
        500
      );
    }

    // YouTubeチャンネルIDを取得
    const youtubeChannelId = extractYoutubeChannelId(data.channel);

    // チャンネル詳細ページを再検証
    if (youtubeChannelId) {
      revalidatePath(`/channels/${youtubeChannelId}`);
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * マイリストから削除
 */
export async function removeFromMyListAction(
  userChannelId: string
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

    // Supabaseクライアント作成
    const supabase = await createClient();

    // YouTubeチャンネルIDを取得（再検証用）
    const { data: userChannel, error: fetchError } = await supabase
      .from("user_channels")
      .select("channel:channels!inner(youtube_channel_id)")
      .eq("id", userChannelId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !userChannel) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        "このデータを削除する権限がありません",
        403
      );
    }

    // YouTubeチャンネルIDを取得
    const youtubeChannelId = extractYoutubeChannelId(userChannel.channel);

    // user_channelsから削除
    // RLSポリシー 'user_channels_delete_own' で user_id チェック済み
    const { error } = await supabase
      .from("user_channels")
      .delete()
      .eq("id", userChannelId);

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "マイリストからの削除に失敗しました",
        500
      );
    }

    // チャンネル詳細ページを再検証
    if (youtubeChannelId) {
      revalidatePath(`/channels/${youtubeChannelId}`);
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    return handleApiError(err);
  }
}
