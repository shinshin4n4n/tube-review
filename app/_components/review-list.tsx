'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaginatedReviews, ReviewWithUser } from '@/lib/types/review';
import ReviewCard from './review-card';
import Pagination from './pagination';
import ReviewEditDialog from './review-edit-dialog';
import DeleteReviewDialog from './delete-review-dialog';
import { deleteReviewAction } from '@/app/_actions/review';
import { useToast } from '@/hooks/use-toast';

interface ReviewListProps {
  initialData: PaginatedReviews;
  channelId: string;
  currentUserId?: string;
}

/**
 * レビュー一覧コンポーネント
 * レビューカードの配列とページネーションを表示します
 */
export default function ReviewList({
  initialData,
  channelId,
  currentUserId,
}: ReviewListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingReview, setEditingReview] = useState<ReviewWithUser | null>(
    null
  );
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (reviewId: string) => {
    const review = initialData.reviews.find((r) => r.id === reviewId);
    if (review) {
      setEditingReview(review);
    }
  };

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
        router.refresh();
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

  if (initialData.reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>まだレビューがありません</p>
        <p className="text-sm mt-2">最初のレビューを投稿しましょう！</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="space-y-4">
          {initialData.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={() => handleEdit(review.id)}
              onDelete={() => handleDelete(review.id)}
            />
          ))}
        </div>

        {initialData.pagination.totalPages > 1 && (
          <Pagination
            currentPage={initialData.pagination.page}
            totalPages={initialData.pagination.totalPages}
            baseUrl={`/channels/${channelId}`}
          />
        )}
      </div>

      {/* 編集ダイアログ */}
      {editingReview && (
        <ReviewEditDialog
          open={!!editingReview}
          onOpenChange={(open) => !open && setEditingReview(null)}
          review={editingReview}
        />
      )}

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
