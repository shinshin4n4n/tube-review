import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';
import type { RankingChannel } from '@/lib/types/ranking';

interface PopularChannelsProps {
  channels: RankingChannel[];
}

/**
 * 人気チャンネルランキング表示コンポーネント
 * Materialized Viewから取得したデータを表示
 */
export function PopularChannels({ channels }: PopularChannelsProps) {
  if (channels.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-accent" size={28} />
          <h2 className="text-2xl md:text-3xl font-bold text-content">今週の人気</h2>
        </div>
        <p className="text-content-secondary text-center py-12">
          まだレビューがありません。最初のレビューを書いてみませんか？
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6" id="ranking">
      {/* セクションタイトル */}
      <div className="flex items-center gap-2">
        <TrendingUp className="text-accent" size={28} />
        <h2 className="text-2xl md:text-3xl font-bold text-content">今週の人気</h2>
        <Badge variant="secondary" className="ml-2">
          直近7日間
        </Badge>
      </div>

      {/* チャンネルグリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {channels.map((channel, index) => (
          <Link
            key={channel.id}
            href={`/channels/${channel.youtube_channel_id}`}
            className="block group"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-surface border-stroke">
              <CardContent className="p-4 space-y-3">
                {/* ランキングバッジ */}
                {index < 3 && (
                  <div className="flex justify-center">
                    <Badge
                      variant={index === 0 ? 'default' : 'secondary'}
                      className={
                        index === 0
                          ? 'bg-accent text-white'
                          : index === 1
                            ? 'bg-secondary text-white'
                            : 'bg-primary/20 text-primary'
                      }
                    >
                      {index + 1}位
                    </Badge>
                  </div>
                )}

                {/* サムネイル */}
                <div className="flex justify-center">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-elevated">
                    {channel.thumbnail_url ? (
                      <Image
                        src={channel.thumbnail_url}
                        alt={channel.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                  </div>
                </div>

                {/* チャンネル名 */}
                <h3 className="text-center text-sm font-bold text-content line-clamp-2 min-h-[2.5rem]">
                  {channel.title}
                </h3>

                {/* 評価 */}
                {channel.review_count > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-star-filled text-star-filled" />
                      <span className="text-sm font-medium text-content">
                        {channel.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary">
                      ({channel.review_count}件のレビュー)
                    </p>
                    {channel.recent_review_count > 0 && (
                      <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                        今週+{channel.recent_review_count}件
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
