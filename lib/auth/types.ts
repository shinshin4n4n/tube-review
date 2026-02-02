import type { User } from '@supabase/supabase-js';

/**
 * 認証状態
 */
export type AuthState = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

/**
 * 認証プロバイダー
 */
export type AuthProvider = 'google' | 'github';

/**
 * サインアップ入力
 */
export type SignUpInput = {
  email: string;
  password: string;
  displayName?: string;
};

/**
 * サインイン入力
 */
export type SignInInput = {
  email: string;
  password: string;
};

/**
 * Magic Link入力
 */
export type MagicLinkInput = {
  email: string;
};

/**
 * OAuth入力
 */
export type OAuthInput = {
  provider: AuthProvider;
};
