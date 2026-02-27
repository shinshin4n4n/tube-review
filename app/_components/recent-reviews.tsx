import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star } from "lucide-react";
import type { RecentReviewWithChannel } from "@/lib/types/ranking";
import Pagination from "@/components/common/pagination";

type ReviewWithFormattedDate = RecentReviewWithChannel & {
  formattedDate?: string;
};

interface RecentReviewsProps {
  reviews: ReviewWithFormattedDate[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** セクション見出し（新着レビュー）を表示するか。デフォルト true */
  showHeader?: boolean;
}

/**
 * 新着レビュー表示コンポーネント
 * トップページに最新20件のレビューを表示
 * レビュー一覧ページではページネーション対応
 */
export function RecentReviews({
  reviews,
  pagination,
  showHeader = true,
}: RecentReviewsProps) {
  if (reviews.length === 0) {
    return (
      <section className="space-y-6">
        {showHeader && (
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary" size={28} />
            <h2 className="text-content text-2xl font-bold md:text-3xl">
              新着レビュー
            </h2>
          </div>
        )}
        <p className="text-content-secondary py-12 text-center">
          まだレビューがありません。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* セクションタイトル（トップページ用） */}
      {showHeader && (
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary" size={28} />
          <h2 className="text-content text-2xl font-bold md:text-3xl">
            新着レビュー
          </h2>
          <Badge variant="outline" className="ml-2">
            {reviews.length}件
          </Badge>
        </div>
      )}

      {/* レビューリスト */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/channels/${review.channel.id}`}
            className="group block"
          >
            <Card className="bg-surface border-stroke h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <CardHeader className="pb-3">
                {/* チャンネル情報 */}
                <div className="flex items-center gap-3">
                  {/* チャンネルサムネイル */}
                  <div className="bg-elevated relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
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
                      <div className="bg-secondary h-full w-full" />
                    )}
                  </div>

                  {/* チャンネル名 + ユーザー情報 */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-content group-hover:text-primary truncate text-sm font-bold transition-colors">
                      {review.channel.title}
                    </h3>
                    <div className="text-content-secondary flex items-center gap-2 text-xs">
                      <span>
                        {review.user.display_name || review.user.username}
                      </span>
                      <span>•</span>
                      <span>{review.formattedDate}</span>
                    </div>
                  </div>

                  {/* 星評価 */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <Star
                      size={16}
                      className="fill-star-filled text-star-filled"
                    />
                    <span className="text-content text-sm font-medium">
                      {review.rating}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* レビュータイトル */}
                {review.title && (
                  <h4 className="text-content mb-1 line-clamp-1 text-sm font-semibold">
                    {review.title}
                  </h4>
                )}

                {/* レビュー本文（抜粋） */}
                <p className="text-content-secondary line-clamp-2 text-sm">
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

      {/* ページネーションまたはもっと見るリンク */}
      {pagination ? (
        // レビュー一覧ページの場合: ページネーション表示
        pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            baseUrl="/reviews"
          />
        )
      ) : (
        // トップページの場合: もっと見るリンク表示
        <div className="pt-4 text-center">
          <Link
            href="/reviews"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            すべてのレビューを見る →
          </Link>
        </div>
      )}
    </section>
  );
}
