import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * リダイレクトURLのバリデーション
 * セキュリティ対策：外部URLへのリダイレクトを防ぐ
 */
function isValidRedirectUrl(url: string): boolean {
  // 相対URLのみ許可
  if (!url.startsWith('/')) return false;
  // プロトコル相対URL（//example.com）を防ぐ
  if (url.startsWith('//')) return false;
  // JavaScriptスキームを防ぐ
  if (url.toLowerCase().startsWith('javascript:')) return false;
  return true;
}

/**
 * 認証コールバックハンドラー
 * - Email確認リンク
 * - OAuth認証（Google/GitHub）
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // 'redirect'パラメータと'next'パラメータの両方をサポート（後方互換性）
  const redirect = requestUrl.searchParams.get('redirect') ?? requestUrl.searchParams.get('next') ?? '/';

  // リダイレクトURLのバリデーション
  const safeRedirect = isValidRedirectUrl(redirect) ? redirect : '/';

  if (code) {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', request.url)
      );
    }

    // セッション作成成功をログ出力（デバッグ用）
    if (data.session) {
      console.log('Session created successfully for user:', data.user?.email);
    }
  }

  // 認証成功後のリダイレクト
  // NextResponseを使ってリダイレクトすることで、Cookieが正しく設定される
  const response = NextResponse.redirect(new URL(safeRedirect, request.url));

  return response;
}
