'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/profile';

/**
 * ユーザープロフィールの型定義
 */
export type UserProfile = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  occupation: string | null;
  gender: string | null;
  birth_date: string | null;
  prefecture: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * プロフィールを更新
 */
export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ApiResponse<UserProfile>> {
  try {
    // バリデーション
    const validated = updateProfileSchema.parse(input);

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

    // プロフィールを更新（RLSで自分のプロフィールのみ更新可能）
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: validated.displayName,
        bio: validated.bio,
        occupation: validated.occupation,
        gender: validated.gender,
        birth_date: validated.birthDate || null,
        prefecture: validated.prefecture,
        website_url: validated.websiteUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      // レコードが見つからない、または権限がない
      if (error.code === 'PGRST116') {
        throw new ApiError(
          API_ERROR_CODES.FORBIDDEN,
          'プロフィールを編集する権限がありません',
          403
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'プロフィールの更新に失敗しました',
        500
      );
    }

    // プロフィールページを再検証
    revalidatePath('/profile');
    revalidatePath('/settings/profile');

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * 現在のユーザープロフィールを取得
 */
export async function getCurrentProfileAction(): Promise<
  ApiResponse<UserProfile>
> {
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

    // プロフィールを取得
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'プロフィールの取得に失敗しました',
        500
      );
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}
