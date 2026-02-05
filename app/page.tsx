import { Layout } from '@/components/layout';
import { HeroSection } from '@/app/_components/hero-section';
import { PopularChannels } from '@/app/_components/popular-channels';
import { RecentReviews } from '@/app/_components/recent-reviews';
import { getRankingChannels, getRecentReviews } from '@/app/_actions/ranking';

/**
 * トップページ
 * - ヒーローセクション
 * - 今週の人気チャンネルランキング
 * - 新着レビュー一覧
 */
export default async function Home() {
  // 並列でデータ取得
  const [rankingChannels, recentReviews] = await Promise.all([
    getRankingChannels(10),
    getRecentReviews(20),
  ]);

  return (
    <Layout>
      <div className="space-y-16">
        {/* ヒーローセクション */}
        <HeroSection />

        {/* 今週の人気チャンネル */}
        <PopularChannels channels={rankingChannels} />

        {/* 新着レビュー */}
        <RecentReviews reviews={recentReviews} />
      </div>
    </Layout>
  );
}
