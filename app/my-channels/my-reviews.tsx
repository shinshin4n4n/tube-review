'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/common/star-rating';
import DeleteReviewDialog from '@/app/_components/delete-review-dialog';
import { getMyReviewsAction } from '@/app/_actions/review';
import { deleteReviewAction } from '@/app/_actions/review';
import type { ReviewWithUserAndChannel } from '@/lib/types/review';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * マイれびゅ!コンポーネント
 */
export default function MyReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithUserAndChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getMyReviewsAction();

      if (result.success) {
        setReviews(result.data.reviews);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleDelete = (reviewId: string) => {
    setDeletingReviewId(reviewId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReviewId) return;

    setIsDeleting(true);

    try {
      const result = await deleteReviewAction(deletingReviewId);

      if (result.success) {
        toast({
          title: 'レビューを削除しました',
          description: 'レビューが正常に削除されました',
        });

        setDeletingReviewId(null);
        setReviews((prev) => prev.filter((review) => review.id !== deletingReviewId));
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'レビューの削除に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Review delete error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-content-secondary text-lg">
          まだレビューを投稿していません
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-content-secondary">{reviews.length} 件のレビュー</p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* チャンネル情報 */}
              <Link
                href={`/channels/${review.channel.id}`}
                className="flex items-center gap-4 mb-4 group"
              >
                <Image
                  src={review.channel.thumbnail_url || '/default-channel.png'}
                  alt={review.channel.title}
                  width={64}
                  height={64}
                  className="rounded-full object-cover group-hover:scale-105 transition-transform"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-content group-hover:text-accent transition-colors truncate">
                    {review.channel.title}
                  </h3>
                </div>
              </Link>

              {/* レビュー内容 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} size={20} />
                  <p className="text-sm text-gray-500">
                    {isClient
                      ? formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })
                      : new Date(review.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {review.title && (
                  <h4 className="font-semibold text-content">{review.title}</h4>
                )}

                <p className="text-content whitespace-pre-wrap">
                  {review.content}
                </p>

                {/* アクションボタン */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 削除確認ダイアログ */}
      <DeleteReviewDialog
        open={!!deletingReviewId}
        onOpenChange={(open) => !open && setDeletingReviewId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
