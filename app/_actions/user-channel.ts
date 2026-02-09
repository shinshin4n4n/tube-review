'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';
import {
  addToMyListSchema,
  updateMyListStatusSchema,
  type AddToMyListInput,
  type UpdateMyListStatusInput,
  type ChannelStatus,
} from '@/lib/validations/user-channel';
import type {
  UserChannel,
  UserChannelWithChannel,
} from '@/lib/types/user-channel';

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
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // channelIdがUUID形式かどうかをチェック
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validated.channelId);

    let channelDbId: string;

    if (isUUID) {
      // UUID形式の場合は直接データベースIDとして使用
      channelDbId = validated.channelId;

      // チャンネルの存在確認
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelDbId)
        .single();

      if (channelError || !channel) {
        throw new ApiError(
          API_ERROR_CODES.NOT_FOUND,
          'チャンネルが見つかりません',
          404
        );
      }
    } else {
      // YouTube IDの場合は検索
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('youtube_channel_id', validated.channelId)
        .single();

      if (channelError || !channel) {
        throw new ApiError(
          API_ERROR_CODES.NOT_FOUND,
          'チャンネルが見つかりません',
          404
        );
      }

      channelDbId = channel.id;
    }

    // 既存のエントリを確認
    const { data: existing } = await supabase
      .from('user_channels')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_id', channelDbId)
      .single();

    // 既に追加済みの場合はエラー
    if (existing) {
      throw new ApiError(
        API_ERROR_CODES.DUPLICATE,
        'このチャンネルは既にマイリストに追加されています',
        409
      );
    }

    // user_channelsに挿入
    const { data, error } = await supabase
      .from('user_channels')
      .insert({
        user_id: user.id,
        channel_id: channelDbId,
        status: validated.status,
      })
      .select()
      .single();

    if (error) {
      // 重複エラーチェック（UNIQUE制約違反）
      if (error.code === '23505') {
        throw new ApiError(
          API_ERROR_CODES.DUPLICATE,
          'このチャンネルは既にマイリストに追加されています',
          409
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'マイリストへの追加に失敗しました',
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
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // ステータスを更新（RLSで自分のデータのみ更新可能）
    const { data, error } = await supabase
      .from('user_channels')
      .update({
        status: validated.status,
      })
      .eq('id', userChannelId)
      .eq('user_id', user.id) // 自分のデータのみ更新
      .select('*, channel:channels!inner(youtube_channel_id)')
      .single();

    if (error) {
      // レコードが見つからない、または権限がない
      if (error.code === 'PGRST116') {
        throw new ApiError(
          API_ERROR_CODES.FORBIDDEN,
          'このデータを編集する権限がありません',
          403
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'ステータスの更新に失敗しました',
        500
      );
    }

    // YouTubeチャンネルIDを取得
    const channel = data.channel as unknown as { youtube_channel_id?: string } | { youtube_channel_id?: string }[];
    const youtubeChannelId = Array.isArray(channel)
      ? channel[0]?.youtube_channel_id
      : channel?.youtube_channel_id;

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
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // YouTubeチャンネルIDを取得（再検証用）
    const { data: userChannel, error: fetchError } = await supabase
      .from('user_channels')
      .select('channel:channels!inner(youtube_channel_id)')
      .eq('id', userChannelId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !userChannel) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        'このデータを削除する権限がありません',
        403
      );
    }

    // YouTubeチャンネルIDを取得
    const channel = userChannel.channel as unknown as { youtube_channel_id?: string } | { youtube_channel_id?: string }[];
    const youtubeChannelId = Array.isArray(channel)
      ? channel[0]?.youtube_channel_id
      : channel?.youtube_channel_id;

    // user_channelsから削除（RLSで自分のデータのみ削除可能）
    const { error } = await supabase
      .from('user_channels')
      .delete()
      .eq('id', userChannelId)
      .eq('user_id', user.id); // 自分のデータのみ削除

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'マイリストからの削除に失敗しました',
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

/**
 * 特定チャンネルのユーザーステータスを取得
 * @param youtubeChannelId YouTubeチャンネルID
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channelId);

    let channelDbId: string;

    if (isUUID) {
      // UUID形式の場合は直接データベースIDとして使用
      channelDbId = channelId;

      // チャンネルの存在確認
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelDbId)
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
        .from('channels')
        .select('id')
        .eq('youtube_channel_id', channelId)
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
      .from('user_channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel_id', channelDbId)
      .single();

    // データが見つからない場合はnullを返す（エラーではない）
    if (error && error.code === 'PGRST116') {
      return {
        success: true,
        data: null,
      };
    }

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'ステータスの取得に失敗しました',
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
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // クエリビルダー
    let query = supabase
      .from('user_channels')
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // ステータスフィルタ
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'マイリストの取得に失敗しました',
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
