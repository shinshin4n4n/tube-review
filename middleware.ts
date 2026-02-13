import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Supabase認証のミドルウェア
 * - セッションの更新とCookieの管理
 * - すべてのリクエストで実行され、認証状態を維持
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // リクエストCookieを更新（次のミドルウェア/APIルートで利用可能）
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // レスポンスCookieを更新（ブラウザに返される）
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // リクエストCookieを削除
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          // レスポンスCookieを削除
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // セッションを更新（期限切れのトークンをリフレッシュ）
  await supabase.auth.getUser();

  return response;
}

/**
 * ミドルウェアの実行対象を設定
 * 静的ファイル、画像、Next.js内部ファイルは除外
 */
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - .*\\.(?:svg|png|jpg|jpeg|gif|webp) (画像ファイル)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
