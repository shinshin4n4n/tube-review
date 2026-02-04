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
} from '@/lib/validations/user-channel';
import type { UserChannel } from '@/lib/types/user-channel';

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

    // 既存のエントリを確認
    const { data: existing } = await supabase
      .from('user_channels')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_id', validated.channelId)
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
        channel_id: validated.channelId,
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
      .select()
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

    // チャンネル詳細ページを再検証
    revalidatePath(`/channels/${data.channel_id}`);

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

    // channel_idを取得（再検証用）
    const { data: userChannel, error: fetchError } = await supabase
      .from('user_channels')
      .select('channel_id')
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
    revalidatePath(`/channels/${userChannel.channel_id}`);

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

    // ユーザーのステータスを取得
    const { data, error } = await supabase
      .from('user_channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
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
