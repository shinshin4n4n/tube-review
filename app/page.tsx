import { Layout } from '@/components/layout';
import { HeroSection } from '@/app/_components/hero-section';
import { PopularChannels } from '@/app/_components/popular-channels';
import { RecentReviews } from '@/app/_components/recent-reviews';
import { getRankingChannels, getRecentReviews } from '@/app/_actions/ranking';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * ISR設定（1時間ごとに再生成）
 * ランキングと新着レビューは頻繁に変わるため
 */
export const revalidate = 3600; // 1時間

/**
 * トップページ
 * - ヒーローセクション
 * - 今週の人気チャンネルランキング
 * - 新着レビュー一覧
 */
export default async function Home() {
  // 並列でデータ取得
  const [rankingChannels, recentReviewsData] = await Promise.all([
    getRankingChannels(10),
    getRecentReviews(1, 20),
  ]);

  // 日付を事前フォーマット
  const reviewsWithFormattedDates = recentReviewsData.reviews.map((review) => ({
    ...review,
    formattedDate: formatDistanceToNow(new Date(review.created_at), {
      addSuffix: true,
      locale: ja,
    }),
  }));

  return (
    <Layout>
      <div className="space-y-12">
        {/* ヒーローセクション */}
        <HeroSection />

        {/* 今週の人気チャンネル */}
        <PopularChannels channels={rankingChannels} />

        {/* 新着レビュー */}
        <RecentReviews reviews={reviewsWithFormattedDates} />
      </div>
    </Layout>
  );
}
