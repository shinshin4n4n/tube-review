import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { magicLinkSchema } from '@/lib/validation/auth';
import { handleApiError } from '@/lib/api/error';

export async function POST(request: NextRequest) {
  try {
    console.log('[Magic Link] Starting request');
    const body = await request.json();
    console.log('[Magic Link] Body parsed');

    // バリデーション
    const result = magicLinkSchema.safeParse(body);
    if (!result.success) {
      console.error('[Magic Link] Validation failed:', result.error);
      return NextResponse.json(
        { error: result.error.issues[0]?.message || '入力内容を確認してください' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    console.log('[Magic Link] Email validated:', email);

    console.log('[Magic Link] Creating Supabase client...');
    const supabase = await createRouteHandlerClient();
    console.log('[Magic Link] Supabase client created');

    // Magic Link送信
    console.log('Sending OTP to:', email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error('Magic Link送信エラー:', {
        message: error.message,
        status: error.status,
        code: (error as any).code,
      });

      // レート制限エラーの場合は専用メッセージ
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: '送信制限に達しました。少し時間をおいてから再度お試しください。'
          },
          { status: 429 } // Too Many Requests
        );
      }

      return NextResponse.json(
        handleApiError(error),
        { status: 500 }
      );
    }

    console.log('OTP sent successfully to:', email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Magic Link] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Magic Link] Error stack:', errorStack);

    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}
