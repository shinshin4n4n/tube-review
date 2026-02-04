'use client';

import { PaginatedReviews } from '@/lib/types/review';
import ReviewCard from './review-card';
import Pagination from './pagination';
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
  const { toast } = useToast();

  const handleEdit = () => {
    // E4-3で実装予定
    toast({
      title: '編集機能は未実装です',
      description: 'E4-3で実装予定',
    });
  };

  const handleDelete = async () => {
    // E4-4で実装予定
    toast({
      title: '削除機能は未実装です',
      description: 'E4-4で実装予定',
    });
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
    <div>
      <div className="space-y-4">
        {initialData.reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
  );
}
