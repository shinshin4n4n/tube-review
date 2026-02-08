import { Layout } from '@/components/layout';
import { PopularChannels } from '@/app/_components/popular-channels';
import { getRankingChannels } from '@/app/_actions/ranking';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'チャンネルランキング | TubeReview',
  description: '今週の人気チャンネルランキング',
};

/**
 * ISR設定（1時間ごとに再生成）
 * ランキングは頻繁に変わるため
 */
export const revalidate = 3600; // 1時間

/**
 * ランキングページ
 * 今週の人気チャンネルを表示
 */
export default async function RankingPage() {
  // ランキングチャンネルを取得（50件）
  const channels = await getRankingChannels(50);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* ページタイトル */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-accent" size={32} />
            <h1 className="text-3xl md:text-4xl font-bold text-content">
              チャンネルランキング
            </h1>
            <Badge variant="secondary" className="ml-2">
              直近7日間
            </Badge>
          </div>
          <p className="text-content-secondary">
            新着レビュー数と平均評価をもとにランキングを算出しています
          </p>
        </div>

        {/* ランキング一覧 */}
        <PopularChannels channels={channels} />
      </div>
    </Layout>
  );
}
