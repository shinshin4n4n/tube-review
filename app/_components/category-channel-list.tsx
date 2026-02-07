import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users } from 'lucide-react';
import type { CategoryChannel } from '@/app/_actions/category';

interface CategoryChannelListProps {
  channels: CategoryChannel[];
}

/**
 * カテゴリー別チャンネル一覧コンポーネント
 *
 * カテゴリー詳細ページで使用するチャンネル一覧
 */
export function CategoryChannelList({ channels }: CategoryChannelListProps) {
  if (channels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-content-secondary">
          このカテゴリーにはまだチャンネルがありません
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          href={`/channels/${channel.id}`}
          data-testid="channel-card"
        >
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-4">
              {/* サムネイル */}
              <div className="aspect-square relative rounded-lg overflow-hidden mb-3 bg-gray-100">
                {channel.thumbnail_url ? (
                  <Image
                    src={channel.thumbnail_url}
                    alt={channel.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400 text-4xl">📺</span>
                  </div>
                )}
              </div>

              {/* チャンネル情報 */}
              <h3 className="font-bold text-content mb-2 line-clamp-2 min-h-[3rem]">
                {channel.title}
              </h3>

              {/* 統計情報 */}
              <div className="flex items-center gap-4 text-sm text-content-secondary">
                {/* 登録者数 */}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(channel.subscriber_count)}</span>
                </div>

                {/* レビュー数と平均評価 */}
                {channel.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>
                      {channel.average_rating.toFixed(1)} ({channel.review_count})
                    </span>
                  </div>
                )}
              </div>

              {/* 説明（オプション） */}
              {channel.description && (
                <p className="text-sm text-content-secondary mt-2 line-clamp-2">
                  {channel.description}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/**
 * 数値フォーマット（千の位でカンマ区切り、大きな数字は「万」表示）
 */
function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString('ja-JP');
}
