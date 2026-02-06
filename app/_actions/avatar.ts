'use server';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';

/**
 * アバター画像をアップロード
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<ApiResponse<{ url: string }>> {
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

    // ファイル取得
    const file = formData.get('file') as File;
    if (!file) {
      throw new ApiError(
        API_ERROR_CODES.VALIDATION_ERROR,
        'ファイルが選択されていません',
        400
      );
    }

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError(
        API_ERROR_CODES.VALIDATION_ERROR,
        'ファイルサイズは5MB以下にしてください',
        400
      );
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new ApiError(
        API_ERROR_CODES.VALIDATION_ERROR,
        'JPEG、PNG、GIF、WebP形式の画像のみアップロード可能です',
        400
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // 既存のアバターを削除（存在する場合）
    const { data: existingUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (existingUser?.avatar_url) {
      // Storage URLからパスを抽出
      const oldPath = extractStoragePathFromUrl(existingUser.avatar_url);
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    // ファイル名生成（タイムスタンプ + 元のファイル名）
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${timestamp}.${fileExt}`;

    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'アップロードに失敗しました',
        500
      );
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path);

    if (!urlData.publicUrl) {
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        '画像URLの取得に失敗しました',
        500
      );
    }

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
      },
    };
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * アバター画像を削除
 */
export async function deleteAvatarAction(): Promise<ApiResponse<void>> {
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

    // 既存のアバターURLを取得
    const { data: existingUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (!existingUser?.avatar_url) {
      return {
        success: true,
        data: undefined,
      };
    }

    // Storage URLからパスを抽出
    const path = extractStoragePathFromUrl(existingUser.avatar_url);
    if (path) {
      // Storageから削除
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([path]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          '画像の削除に失敗しました',
          500
        );
      }
    }

    // DBのavatar_urlをクリア
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'プロフィールの更新に失敗しました',
        500
      );
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
 * Storage URLからファイルパスを抽出
 */
function extractStoragePathFromUrl(url: string): string | null {
  try {
    // URL例: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/timestamp.jpg
    const match = url.match(/\/avatars\/(.+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
