'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserX, Home, RefreshCw } from 'lucide-react';
import { logger, generateErrorId } from '@/lib/logger';

interface ProfileErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * プロフィールページエラー
 *
 * プロフィール情報の取得・更新中のエラーをキャッチ
 */
export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    const id = generateErrorId();

    logger.error('Profile page error occurred', error, {
      errorId: id,
      digest: error.digest,
      page: 'profile',
    });

    // setState を非同期で実行
    setTimeout(() => {
      setErrorId(id);
    }, 0);
  }, [error]);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 md:p-12">
          {/* アイコン */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <UserX className="w-12 h-12 text-destructive" />
            </div>
          </div>

          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-content mb-4">
              プロフィールエラー
            </h1>
            <p className="text-lg text-content-secondary">
              プロフィール情報の読み込み中にエラーが発生しました。
              <br />
              ログインしているか確認して、再度お試しください。
            </p>

            {errorId && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-content-secondary">
                  エラーID:{' '}
                  <code className="text-accent font-mono">{errorId}</code>
                </p>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={reset}
              size="lg"
              className="bg-accent hover:bg-accent-hover"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              再読み込み
            </Button>

            <Button size="lg" variant="outline" onClick={() => window.location.href = '/'}>
              <Home className="mr-2 h-5 w-5" />
              ホームに戻る
            </Button>
          </div>

          {/* ヒント */}
          <div className="mt-12 pt-8 border-t border-stroke">
            <h3 className="font-semibold text-content mb-4">
              エラーが解決しない場合
            </h3>
            <ul className="text-sm text-content-secondary space-y-2 list-disc list-inside">
              <li>ログインしているか確認してください</li>
              <li>セッションが期限切れの場合は、再度ログインしてください</li>
              <li>ブラウザのキャッシュとCookieをクリアしてみてください</li>
              <li>別のブラウザで試してみてください</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
