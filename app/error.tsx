'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { logger, generateErrorId } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * グローバルエラーページ
 *
 * アプリケーション内で発生したエラーをキャッチして表示
 */
export default function Error({ error, reset }: ErrorProps) {
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    // エラーIDを生成
    const id = generateErrorId();

    // エラーをログに記録
    logger.error('Application error occurred', error, {
      errorId: id,
      digest: error.digest,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
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
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
          </div>

          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-content mb-4">
              エラーが発生しました
            </h1>
            <p className="text-lg text-content-secondary mb-4">
              申し訳ございません。予期しないエラーが発生しました。
              <br />
              ページを再読み込みするか、しばらく時間をおいてから再度お試しください。
            </p>

            {/* エラーID（開発環境のみ詳細表示） */}
            {errorId && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-content-secondary">
                  エラーID:{' '}
                  <code className="text-accent font-mono">{errorId}</code>
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2 text-left">
                    <summary className="cursor-pointer text-sm text-content-secondary hover:text-content">
                      開発者向け詳細情報
                    </summary>
                    <pre className="mt-2 p-3 bg-surface rounded text-xs overflow-auto max-h-48">
                      {error.message}
                      {'\n\n'}
                      {error.stack}
                    </pre>
                  </details>
                )}
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
              再試行
            </Button>

            <Button size="lg" variant="outline" onClick={() => window.location.href = '/'}>
              <Home className="mr-2 h-5 w-5" />
              ホームに戻る
            </Button>
          </div>

          {/* 補足情報 */}
          <div className="mt-12 pt-8 border-t border-stroke">
            <p className="text-sm text-content-secondary text-center">
              問題が解決しない場合は、エラーIDを添えて
              <a
                href="https://github.com/shinshin4n4n/tube-review/issues"
                className="text-accent hover:underline mx-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHubイシュー
              </a>
              からお問い合わせください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
