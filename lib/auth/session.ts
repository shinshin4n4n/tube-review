import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * 現在のセッションを取得
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get session:', error);
    return null;
  }

  return session;
}

/**
 * セッションをリフレッシュ
 */
export async function refreshSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();

  if (error) {
    console.error('Failed to refresh session:', error);
    return null;
  }

  return session;
}

/**
 * セッションからユーザー情報を取得
 */
export async function getUserFromSession(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}
