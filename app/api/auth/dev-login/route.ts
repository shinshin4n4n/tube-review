import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * 開発環境専用：即座にログインできるエンドポイント
 * 本番環境では無効化される
 */
export async function POST(request: NextRequest) {
  // 本番環境では無効
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // 開発用：メール確認なしで直接ログイン
    // 注: これはSupabaseの管理画面で「Enable email confirmations」を無効にする必要がある
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dev-password-bypass', // 開発用ダミーパスワード
    });

    if (error) {
      // パスワード認証が失敗した場合、OTPで試す
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // ユーザーが存在しない場合は作成
        },
      });

      if (otpError) {
        return NextResponse.json(
          {
            error: 'Development login failed',
            details: otpError.message,
            note: 'Try using Google login or wait for OTP email',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent to email (check your inbox)',
      });
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error('[Dev Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
