import type { Metadata } from 'next';
import { Layout } from '@/components/layout';
import { getCategories } from '@/app/_actions/category';
import { CategoryCard } from '@/app/_components/category-card';

/**
 * メタデータ生成（SEO最適化）
 */
export const metadata: Metadata = {
  title: 'カテゴリー一覧 | TubeReview',
  description:
    'YouTubeチャンネルをカテゴリー別に探す。エンタメ、ゲーム、音楽、教育、テクノロジーなど、興味のあるジャンルからお気に入りのチャンネルを見つけよう。',
  openGraph: {
    title: 'カテゴリー一覧 | TubeReview',
    description:
      'YouTubeチャンネルをカテゴリー別に探す。エンタメ、ゲーム、音楽、教育、テクノロジーなど、興味のあるジャンルからお気に入りのチャンネルを見つけよう。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'カテゴリー一覧 | TubeReview',
    description:
      'YouTubeチャンネルをカテゴリー別に探す。エンタメ、ゲーム、音楽、教育、テクノロジーなど。',
  },
};

/**
 * ISR設定（1時間ごとに再生成）
 */
export const revalidate = 3600; // 1時間

/**
 * カテゴリー一覧ページ
 */
export default async function CategoriesPage() {
  // カテゴリー一覧を取得
  const categories = await getCategories();

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
    ],
  };

  // 構造化データ（ItemList）
  const itemListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: categories.map((category, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: category.name,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tubereview.example.com'}/categories/${category.slug}`,
        description: category.description,
      },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListStructuredData),
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content mb-4">
            カテゴリー一覧
          </h1>
          <p className="text-content-secondary">
            興味のあるジャンルからYouTubeチャンネルを探しましょう
          </p>
        </div>

        {/* カテゴリーグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>

        {/* カテゴリーがない場合 */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-content-secondary">
              現在、カテゴリーはありません
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
