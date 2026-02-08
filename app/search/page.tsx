import type { Metadata } from 'next';
import { Layout } from '@/components/layout';
import { SearchForm } from '@/app/_components/search-form';
import { ChannelCard } from '@/app/_components/channel-card';
import { searchChannelsAction } from '@/app/_actions/youtube';
import { AlertCircle, Search as SearchIcon } from 'lucide-react';
import { SearchBreadcrumb } from '@/app/_components/search-breadcrumb';

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tube-review.vercel.app';

  if (query) {
    const title = `「${query}」の検索結果`;
    const description = `「${query}」に関連するYouTubeチャンネルの検索結果。レビューや評価をチェックして、お気に入りのチャンネルを見つけよう。`;

    return {
      title,
      description,
      keywords: [query, 'YouTube', 'チャンネル', '検索', 'レビュー'],
      robots: {
        index: false, // 検索結果ページはインデックスしない
        follow: true,
      },
      openGraph: {
        title,
        description,
        url: `${siteUrl}/search?q=${encodeURIComponent(query)}`,
        siteName: 'TubeReview',
      },
    };
  }

  const title = 'チャンネル検索';
  const description = 'YouTubeチャンネルを検索してレビューを見つけよう。お気に入りのクリエイターや新しい発見があなたを待っています。';

  return {
    title,
    description,
    keywords: ['YouTube', 'チャンネル', '検索', 'レビュー', '発見'],
    alternates: {
      canonical: `${siteUrl}/search`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/search`,
      siteName: 'TubeReview',
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim();

  // 検索クエリがない場合は検索フォームのみ表示
  if (!query) {
    return (
      <Layout>
        {/* ブレッドクラム */}
        <div className="mb-4">
          <SearchBreadcrumb />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-content mb-4 text-center">
              チャンネル検索
            </h1>
            <SearchForm />
          </div>

          {/* 検索前の状態 */}
          <div className="text-center py-16" data-testid="search-initial-state">
            <SearchIcon className="w-16 h-16 mx-auto text-content-secondary mb-4" />
            <p className="text-content-secondary text-lg">
              キーワードを入力してチャンネルを検索してください
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // チャンネル検索を実行
  const result = await searchChannelsAction(query, 20);

  return (
    <Layout>
      {/* ブレッドクラム */}
      <div className="mb-4">
        <SearchBreadcrumb />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* 検索フォーム */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-content mb-4 text-center">
            チャンネル検索
          </h1>
          <SearchForm initialQuery={query} />
        </div>

        {/* 検索結果 */}
        {result.success ? (
          result.data && result.data.length > 0 ? (
            <div data-testid="search-results">
              {/* 検索結果件数 */}
              <div className="mb-6">
                <p className="text-content-secondary">
                  「{query}」の検索結果: {result.data.length}件
                </p>
              </div>

              {/* チャンネルカード一覧 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.data.map((channel) => (
                  <ChannelCard key={channel.youtubeChannelId} channel={channel} />
                ))}
              </div>
            </div>
          ) : (
            // 検索結果0件
            <div
              className="text-center py-16"
              data-testid="search-empty-state"
            >
              <SearchIcon className="w-16 h-16 mx-auto text-content-secondary mb-4" />
              <p className="text-content text-lg mb-2">
                「{query}」に一致するチャンネルが見つかりませんでした
              </p>
              <p className="text-content-secondary">
                別のキーワードで検索してみてください
              </p>
            </div>
          )
        ) : (
          // エラー状態
          <div
            className="text-center py-16"
            data-testid="search-error-state"
          >
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <p className="text-destructive text-lg mb-2">
              検索中にエラーが発生しました
            </p>
            <p className="text-content-secondary mb-4">{result.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              再度検索する
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
