import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/api/error';
import { API_ERROR_CODES } from '@/lib/types/api';

/**
 * 現在のユーザーを取得
 * 未認証の場合は null を返す
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 認証を必須とする
 * 未認証の場合はエラーをスロー
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new ApiError(
      API_ERROR_CODES.UNAUTHORIZED,
      'Authentication required',
      401
    );
  }
  return user;
}
