import { Layout } from '@/components/layout';
import { RecentReviews } from '@/app/_components/recent-reviews';
import { getRecentReviews } from '@/app/_actions/ranking';
import { MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'すべてのレビュー | TubeReview',
  description: '新着レビュー一覧',
};

/**
 * レビュー一覧ページ
 * 全てのレビューをページネーション付きで表示
 */
export default async function ReviewsPage() {
  // レビューを取得（50件）
  const reviews = await getRecentReviews(50);

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
            ユーザーの投稿したレビューを新着順に表示しています
          </p>
        </div>

        {/* レビュー一覧 */}
        <RecentReviews reviews={reviews} />
      </div>
    </Layout>
  );
}
