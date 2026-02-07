'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';

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
        'ログインが必要です',
        401
      );
    }

    const supabase = await createClient();

    // リストの所有者確認
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (listError || !list) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        'このリストを編集する権限がありません',
        403
      );
    }

    // 既に追加されているか確認
    const { data: existing } = await supabase
      .from('list_channels')
      .select('id')
      .eq('list_id', listId)
      .eq('channel_id', channelId)
      .single();

    if (existing) {
      throw new ApiError(
        API_ERROR_CODES.DUPLICATE,
        'このチャンネルは既にリストに追加されています',
        409
      );
    }

    // 現在の最大order_indexを取得
    const { data: maxOrder } = await supabase
      .from('list_channels')
      .select('order_index')
      .eq('list_id', listId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const orderIndex = (maxOrder?.order_index || 0) + 1;

    // list_channelsに追加
    const { error: insertError } = await supabase
      .from('list_channels')
      .insert({
        list_id: listId,
        channel_id: channelId,
        order_index: orderIndex,
      });

    if (insertError) {
      console.error('Supabase error:', insertError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'チャンネルの追加に失敗しました',
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
        'ログインが必要です',
        401
      );
    }

    const supabase = await createClient();

    // リストの所有者確認
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();

    if (listError || !list) {
      throw new ApiError(
        API_ERROR_CODES.FORBIDDEN,
        'このリストを編集する権限がありません',
        403
      );
    }

    // list_channelsから削除
    const { error: deleteError } = await supabase
      .from('list_channels')
      .delete()
      .eq('list_id', listId)
      .eq('channel_id', channelId);

    if (deleteError) {
      console.error('Supabase error:', deleteError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'チャンネルの削除に失敗しました',
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
 * リストのチャンネル一覧を取得
 */
export async function getListChannelsAction(
  listId: string
): Promise<ApiResponse<any[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('list_channels')
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
      .eq('list_id', listId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'チャンネル一覧の取得に失敗しました',
        500
      );
    }

    // データ変換
    const transformed = (data || []).map((item) => ({
      ...item,
      channel: Array.isArray(item.channel) ? item.channel[0] : item.channel,
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * チャンネルを検索（リスト追加用）
 */
export async function searchChannelsForListAction(
  query: string
): Promise<ApiResponse<any[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('channels')
      .select('id, youtube_channel_id, title, thumbnail_url, subscriber_count')
      .ilike('title', `%${query}%`)
      .limit(20);

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'チャンネル検索に失敗しました',
        500
      );
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (err) {
    return handleApiError(err);
  }
}
