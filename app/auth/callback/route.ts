import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

/**
 * リダイレクトURLのバリデーション
 * セキュリティ対策：外部URLへのリダイレクトを防ぐ
 */
function isValidRedirectUrl(url: string): boolean {
  // 相対URLのみ許可
  if (!url.startsWith("/")) return false;
  // プロトコル相対URL（//example.com）を防ぐ
  if (url.startsWith("//")) return false;
  // JavaScriptスキームを防ぐ
  if (url.toLowerCase().startsWith("javascript:")) return false;
  return true;
}

/**
 * 認証コールバックハンドラー
 * - Email確認リンク
 * - OAuth認証（Google/GitHub）
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  // 'redirect'パラメータと'next'パラメータの両方をサポート（後方互換性）
  const redirect =
    requestUrl.searchParams.get("redirect") ??
    requestUrl.searchParams.get("next") ??
    "/";

  // リダイレクトURLのバリデーション
  const safeRedirect = isValidRedirectUrl(redirect) ? redirect : "/";

  // レスポンスオブジェクトを先に作成
  const response = NextResponse.redirect(new URL(safeRedirect, request.url));

  // OAuth認証（code）またはMagic Link認証（token_hash）の処理
  if (code || token_hash) {
    await cookies();

    // Supabaseクライアントを作成（レスポンスにCookieを設定）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // リクエストCookieを更新
            request.cookies.set({
              name,
              value,
              ...options,
            });
            // レスポンスCookieを更新（重要！）
            // 同じレスポンスオブジェクトに追加していく
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
              value: "",
              ...options,
            });
            // レスポンスCookieを削除
            // 同じレスポンスオブジェクトから削除していく
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    let error = null;
    let data = null;

    if (code) {
      // OAuth認証の場合
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
      data = result.data;
      logger.info("OAuth code exchange completed", {
        hasSession: !!data?.session,
      });
    } else if (token_hash && type) {
      // Magic Link認証の場合
      const result = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "magiclink" | "email",
      });
      error = result.error;
      data = result.data;
      logger.info("Magic Link OTP verification completed", {
        hasSession: !!data?.session,
      });
    }

    if (error) {
      logger.error("Authentication callback failed", error);
      return NextResponse.redirect(
        new URL("/login?error=auth_failed", request.url)
      );
    }

    // セッション作成成功をログ出力
    if (data?.session) {
      logger.info("Session created successfully", {
        hasUser: !!data.user,
        tokenLength: data.session.access_token.length,
      });
    }
  }

  return response;
}
