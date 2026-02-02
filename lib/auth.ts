import { createClient } from '@/lib/supabase/server';

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
    throw new Error('Authentication required');
  }
  return user;
}
