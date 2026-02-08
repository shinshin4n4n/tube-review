import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home, Search } from 'lucide-react';

/**
 * グローバル404 Not Foundページ
 *
 * URLが存在しない場合に表示されるページ
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 md:p-12">
          {/* アイコン */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center">
              <FileQuestion className="w-12 h-12 text-accent" />
            </div>
          </div>

          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-content mb-4">
              404 - ページが見つかりません
            </h1>
            <p className="text-lg text-content-secondary">
              お探しのページは存在しないか、移動または削除された可能性があります。
            </p>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent-hover"
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                ホームに戻る
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href="/search">
                <Search className="mr-2 h-5 w-5" />
                チャンネルを検索
              </Link>
            </Button>
          </div>

          {/* 補足情報 */}
          <div className="mt-12 pt-8 border-t border-stroke">
            <p className="text-sm text-content-secondary text-center">
              問題が解決しない場合は、
              <Link
                href="https://github.com/shinshin4n4n/tube-review/issues"
                className="text-accent hover:underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHubイシュー
              </Link>
              からお問い合わせください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
