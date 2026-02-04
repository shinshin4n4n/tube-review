'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';
import {
  createListSchema,
  updateListSchema,
  type CreateListInput,
  type UpdateListInput,
} from '@/lib/validations/list';
import type { MyList, PaginatedLists } from '@/lib/types/list';

/**
 * リストを作成
 */
export async function createMyListAction(
  input: CreateListInput
): Promise<ApiResponse<MyList>> {
  try {
    // バリデーション
    const validated = createListSchema.parse(input);

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

    // リストを挿入
    const { data, error } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        name: validated.name,
        description: validated.description || null,
        is_public: validated.isPublic || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'リストの作成に失敗しました',
        500
      );
    }

    // マイリストページを再検証
    revalidatePath('/my-lists');

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * リストを更新
 */
export async function updateMyListAction(
  listId: string,
  input: UpdateListInput
): Promise<ApiResponse<MyList>> {
  try {
    // バリデーション
    const validated = updateListSchema.parse(input);

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

    // 更新データを構築
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.isPublic !== undefined)
      updateData.isPublic = validated.isPublic;

    // リストを更新（RLSで自分のリストのみ更新可能）
    const { data, error } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', listId)
      .eq('user_id', user.id) // 自分のリストのみ更新
      .select()
      .single();

    if (error) {
      // レコードが見つからない、または権限がない
      if (error.code === 'PGRST116') {
        throw new ApiError(
          API_ERROR_CODES.FORBIDDEN,
          'このリストを編集する権限がありません',
          403
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'リストの更新に失敗しました',
        500
      );
    }

    // マイリストページを再検証
    revalidatePath('/my-lists');

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * リストを削除
 */
export async function deleteMyListAction(
  listId: string
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

    // リストを削除（RLSで自分のリストのみ削除可能）
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id); // 自分のリストのみ削除

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'リストの削除に失敗しました',
        500
      );
    }

    // マイリストページを再検証
    revalidatePath('/my-lists');

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * 自分のリスト一覧を取得
 */
export async function getMyListsAction(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedLists>> {
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
    const offset = (page - 1) * limit;

    // リスト取得
    const { data: lists, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 総件数取得
    const { count, error: countError } = await supabase
      .from('lists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // エラーハンドリング
    if (error || countError) {
      console.error('Supabase error:', error || countError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'リストの取得に失敗しました',
        500
      );
    }

    // ページネーション情報を構築
    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: {
        lists: (lists as MyList[]) || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}
