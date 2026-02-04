import { Card, CardContent } from '@/components/ui/card';

/**
 * チャンネル詳細ページローディング状態
 */
export default function ChannelDetailLoading() {
  return (
    <div className="min-h-screen bg-base py-8 px-4">
      <div className="max-w-4xl mx-auto" data-testid="channel-loading">
        {/* チャンネルヘッダースケルトン */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* サムネイルスケルトン */}
              <div className="flex-shrink-0">
                <div className="w-44 h-44 rounded-full bg-muted animate-pulse" />
              </div>

              {/* チャンネル情報スケルトン */}
              <div className="flex-1 w-full space-y-4">
                {/* チャンネル名 */}
                <div className="h-8 bg-muted rounded animate-pulse w-3/4" />

                {/* カスタムURL */}
                <div className="h-5 bg-muted rounded animate-pulse w-1/4" />

                {/* 統計情報スケルトン */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center space-y-2">
                      <div className="h-5 bg-muted rounded animate-pulse mx-auto w-24" />
                      <div className="h-8 bg-muted rounded animate-pulse mx-auto w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 説明文スケルトン */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="h-6 bg-muted rounded animate-pulse w-40 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* ボタンスケルトン */}
        <div className="text-center">
          <div className="h-12 w-48 bg-muted rounded-lg animate-pulse inline-block" />
        </div>
      </div>
    </div>
  );
}
