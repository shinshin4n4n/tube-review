import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

/**
 * Route Handler専用のSupabaseクライアント作成
 * Server Componentとは異なり、Route HandlerではCookieの設定が可能
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Route Handlerでは直接setできる
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Route Handler内でのCookie設定エラーをログ出力
            console.error('Cookie set error in route handler:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Route Handlerでは直接deleteできる
            cookieStore.delete(name);
          } catch (error) {
            // Route Handler内でのCookie削除エラーをログ出力
            console.error('Cookie remove error in route handler:', error);
          }
        },
      },
    }
  );
}
