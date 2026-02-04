import Link from 'next/link';
import { AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * チャンネルが見つからない場合の404ページ
 */
export default function ChannelNotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center py-8 px-4">
      <div className="max-w-md mx-auto text-center">
        <AlertCircle
          className="w-16 h-16 mx-auto text-destructive mb-4"
          data-testid="error-message"
        />
        <h1 className="text-3xl font-bold text-content mb-4">
          チャンネルが見つかりませんでした
        </h1>
        <p className="text-content-secondary mb-8">
          指定されたチャンネルは存在しないか、削除された可能性があります。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/search">
            <Button className="w-full sm:w-auto">
              <Search className="w-5 h-5 mr-2" />
              チャンネルを検索
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              トップページへ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
