import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { RecentReviewWithChannel } from '@/lib/types/ranking';

interface RecentReviewsProps {
  reviews: RecentReviewWithChannel[];
}

/**
 * 新着レビュー表示コンポーネント
 * トップページに最新20件のレビューを表示
 */
export function RecentReviews({ reviews }: RecentReviewsProps) {
  if (reviews.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary" size={28} />
          <h2 className="text-2xl md:text-3xl font-bold text-content">新着レビュー</h2>
        </div>
        <p className="text-content-secondary text-center py-12">
          まだレビューがありません。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* セクションタイトル */}
      <div className="flex items-center gap-2">
        <MessageSquare className="text-primary" size={28} />
        <h2 className="text-2xl md:text-3xl font-bold text-content">新着レビュー</h2>
        <Badge variant="outline" className="ml-2">
          {reviews.length}件
        </Badge>
      </div>

      {/* レビューリスト */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/channels/${review.channel.id}`}
            className="block group"
          >
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-surface border-stroke">
              <CardHeader className="pb-3">
                {/* チャンネル情報 */}
                <div className="flex items-center gap-3">
                  {/* チャンネルサムネイル */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-elevated flex-shrink-0">
                    {review.channel.thumbnail_url ? (
                      <Image
                        src={review.channel.thumbnail_url}
                        alt={review.channel.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                  </div>

                  {/* チャンネル名 + ユーザー情報 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-content text-sm truncate group-hover:text-primary transition-colors">
                      {review.channel.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-content-secondary">
                      <span>{review.user.display_name || review.user.username}</span>
                      <span>•</span>
                      <span suppressHydrationWarning>
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* 星評価 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star size={16} className="fill-star-filled text-star-filled" />
                    <span className="text-sm font-medium text-content">{review.rating}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* レビュータイトル */}
                {review.title && (
                  <h4 className="font-semibold text-content mb-1 text-sm line-clamp-1">
                    {review.title}
                  </h4>
                )}

                {/* レビュー本文（抜粋） */}
                <p className="text-sm text-content-secondary line-clamp-2">
                  {review.is_spoiler ? (
                    <span className="text-yellow-600">⚠️ ネタバレあり</span>
                  ) : (
                    review.content
                  )}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* もっと見るリンク */}
      <div className="text-center pt-4">
        <Link
          href="/reviews"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          すべてのレビューを見る →
        </Link>
      </div>
    </section>
  );
}
