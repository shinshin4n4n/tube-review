import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 認証コールバックハンドラー
 * - Email確認リンク
 * - OAuth認証（Google/GitHub）
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', request.url)
      );
    }
  }

  // 認証成功後のリダイレクト
  return NextResponse.redirect(new URL(next, request.url));
}
