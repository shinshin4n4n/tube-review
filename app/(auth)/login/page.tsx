'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { magicLinkSchema } from '@/lib/validation/auth';

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

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  // リダイレクト先を取得（バリデーション付き）
  const redirect = searchParams.get('redirect') || '/';
  const safeRedirect = isValidRedirectUrl(redirect) ? redirect : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // バリデーション
    const result = magicLinkSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message || '入力内容を確認してください');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('ログインリンクの送信に失敗しました');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    // OAuth認証後のコールバックURLにリダイレクト先を含める
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('redirect', safeRedirect);

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (googleError) {
      setError('Googleログインに失敗しました。もう一度お試しください。');
      setLoading(false);
    }
    // 成功時はGoogleの認証画面にリダイレクトされるのでローディング解除不要
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-content">
            ログイン
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* エラー・成功メッセージ */}
          {error && (
            <p
              className="text-sm text-red-500 mb-4"
              role="alert"
              data-testid="error-message"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="text-sm text-green-600 mb-4"
              role="status"
              data-testid="success-message"
            >
              メールを確認してください。ログインリンクを送信しました。
            </p>
          )}

          {/* Magic Link Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={loading}
            >
              {loading ? '送信中...' : 'ログインリンクを送信'}
            </Button>
          </form>

          {/* 区切り線 */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stroke" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-content-secondary">または</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-6"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            {loading ? 'ログイン中...' : 'Googleでログイン'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
