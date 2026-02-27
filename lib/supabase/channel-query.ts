import type { SupabaseClient } from "@supabase/supabase-js";
import { isUUID } from "@/lib/validation-utils";

/**
 * チャンネルIDの検索結果
 */
export type ChannelLookupResult =
  | { found: true; channelDbId: string }
  | { found: false };

/**
 * チャンネルIDからデータベースIDを解決する
 *
 * UUID形式の場合はデータベースIDとして直接使用し、
 * YouTube ID形式の場合はyoutube_channel_idカラムで検索する。
 *
 * @param supabase Supabaseクライアント
 * @param channelId UUID形式またはYouTubeチャンネルID
 * @returns チャンネルのデータベースID、見つからない場合はnull
 */
export async function findChannelDbId(
  supabase: SupabaseClient,
  channelId: string
): Promise<ChannelLookupResult> {
  const isChannelUUID = isUUID(channelId);

  if (isChannelUUID) {
    // UUID形式の場合は直接データベースIDとして検索
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      return { found: false };
    }

    return { found: true, channelDbId: channel.id };
  }

  // YouTube IDの場合はyoutube_channel_idで検索
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("id")
    .eq("youtube_channel_id", channelId)
    .single();

  if (channelError || !channel) {
    return { found: false };
  }

  return { found: true, channelDbId: channel.id };
}
