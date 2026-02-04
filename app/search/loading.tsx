import { SearchForm } from '@/app/_components/search-form';
import { Card, CardContent } from '@/components/ui/card';

/**
 * 検索ページローディング状態
 */
export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-base py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 検索フォーム */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-content mb-4 text-center">
            チャンネル検索
          </h1>
          <SearchForm />
        </div>

        {/* ローディングインジケーター */}
        <div data-testid="search-loading" className="space-y-6">
          <div className="mb-6">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          </div>

          {/* スケルトンカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-full bg-surface border-stroke">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* サムネイルスケルトン */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
                    </div>

                    {/* テキストスケルトン */}
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
