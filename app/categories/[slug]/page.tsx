import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Layout } from '@/components/layout';
import { getChannelsByCategory } from '@/app/_actions/category';
import { CategoryChannelList } from '@/app/_components/category-channel-list';
import { getAllCategorySlugs, getCategoryBySlug } from '@/lib/constants/categories';
import { BackButton } from '@/components/ui/back-button';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

/**
 * generateStaticParams - ビルド時に静的生成するパスを指定
 */
export async function generateStaticParams() {
  const slugs = getAllCategorySlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

/**
 * メタデータ生成（SEO最適化）
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'カテゴリーが見つかりません | TubeReview',
      description: '指定されたカテゴリーが見つかりませんでした。',
    };
  }

  return {
    title: `${category.name}のチャンネル一覧 | TubeReview`,
    description: `${category.description}のYouTubeチャンネル一覧。人気順、新着順、登録者数順で並び替えて、お気に入りのチャンネルを見つけよう。`,
    openGraph: {
      title: `${category.name}のチャンネル一覧 | TubeReview`,
      description: `${category.description}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name}のチャンネル一覧 | TubeReview`,
      description: `${category.description}`,
    },
  };
}

/**
 * ISR設定（1時間ごとに再生成）
 */
export const revalidate = 3600; // 1時間

/**
 * カテゴリー詳細ページ
 */
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const sort = (resolvedSearchParams.sort as 'popular' | 'latest' | 'subscribers') || 'popular';
  const page = Number(resolvedSearchParams.page) || 1;

  // カテゴリー別チャンネルを取得
  const { channels, totalCount, category } = await getChannelsByCategory(
    slug,
    sort,
    page,
    20
  );

  // カテゴリーが存在しない場合
  if (!category) {
    notFound();
  }

  // ページネーション情報
  const totalPages = Math.ceil(totalCount / 20);

  // 構造化データ（BreadcrumbList）
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'トップ',
        item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tubereview.example.com'}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'カテゴリー一覧',
        item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tubereview.example.com'}/categories`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tubereview.example.com'}/categories/${slug}`,
      },
    ],
  };

  return (
    <Layout>
      {/* 構造化データ（SEO） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* 戻るボタン */}
        <BackButton />

        {/* カテゴリーヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl" aria-hidden="true">
              {category.icon}
            </span>
            <div>
              <h1 className="text-4xl font-bold text-content">
                {category.name}
              </h1>
              <p className="text-content-secondary mt-1">
                {totalCount} チャンネル
              </p>
            </div>
          </div>
          <p className="text-content-secondary">{category.description}</p>
        </div>

        {/* ソート機能 */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-content-secondary">並び替え:</span>
          <div className="flex gap-2">
            <SortLink slug={slug} currentSort={sort} sortType="popular">
              人気順
            </SortLink>
            <SortLink slug={slug} currentSort={sort} sortType="latest">
              新着順
            </SortLink>
            <SortLink slug={slug} currentSort={sort} sortType="subscribers">
              登録者数順
            </SortLink>
          </div>
        </div>

        {/* チャンネル一覧 */}
        <CategoryChannelList channels={channels} />

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <a
                href={`/categories/${slug}?sort=${sort}&page=${page - 1}`}
                className="px-4 py-2 rounded-lg border border-stroke bg-surface text-content hover:bg-surface-hover transition-colors"
              >
                前へ
              </a>
            )}
            <span className="px-4 py-2 text-content-secondary">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`/categories/${slug}?sort=${sort}&page=${page + 1}`}
                className="px-4 py-2 rounded-lg border border-stroke bg-surface text-content hover:bg-surface-hover transition-colors"
              >
                次へ
              </a>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

/**
 * ソートリンクコンポーネント
 */
function SortLink({
  slug,
  currentSort,
  sortType,
  children,
}: {
  slug: string;
  currentSort: string;
  sortType: string;
  children: React.ReactNode;
}) {
  const isActive = currentSort === sortType;

  return (
    <a
      href={`/categories/${slug}?sort=${sortType}`}
      className={`px-4 py-2 rounded-lg border transition-colors ${
        isActive
          ? 'border-primary bg-primary text-white'
          : 'border-stroke bg-surface text-content hover:bg-surface-hover'
      }`}
    >
      {children}
    </a>
  );
}
