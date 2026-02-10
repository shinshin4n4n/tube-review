import { Layout } from '@/components/layout';
import { RecentReviews } from '@/app/_components/recent-reviews';
import { getRecentReviews } from '@/app/_actions/ranking';
import { MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'すべてのレビュー | TubeReview',
  description: '新着レビュー一覧',
};

type ReviewsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/**
 * レビュー一覧ページ
 * 全てのレビューをページネーション付きで表示
 */
export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  // レビューを取得（20件/ページ）
  const data = await getRecentReviews(page, 20);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* ページタイトル */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="text-primary" size={32} />
            <h1 className="text-3xl md:text-4xl font-bold text-content">
              すべてのレビュー
            </h1>
          </div>
          <p className="text-content-secondary">
            ユーザーの投稿したレビューを新着順に表示しています（全{data.pagination.total}件）
          </p>
        </div>

        {/* レビュー一覧 */}
        <RecentReviews reviews={data.reviews} pagination={data.pagination} />
      </div>
    </Layout>
  );
}
