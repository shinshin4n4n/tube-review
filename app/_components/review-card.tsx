'use client';

import { ReviewWithUser } from '@/lib/types/review';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './star-rating';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ReviewCardProps {
  review: ReviewWithUser;
  currentUserId?: string;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
}

/**
 * レビューカードコンポーネント
 * 個別のレビューを表示します
 */
export default function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [isSpoilerExpanded, setIsSpoilerExpanded] = useState(false);
  const isOwner = currentUserId === review.user_id;

  return (
    <Card data-testid="review-card">
      <CardHeader>
        {/* ユーザー情報 + 星評価 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
              {review.user.display_name?.[0] || review.user.username[0]}
            </div>
            <div>
              <p className="font-medium">
                {review.user.display_name || review.user.username}
              </p>
              <p className="text-sm text-gray-500" data-testid="review-date">
                {formatDistanceToNow(new Date(review.created_at), {
                  addSuffix: true,
                  locale: ja,
                })}
              </p>
            </div>
          </div>
          <StarRating rating={review.rating} readonly size={20} />
        </div>
      </CardHeader>

      <CardContent>
        {/* タイトル */}
        {review.title && <h3 className="font-semibold mb-2">{review.title}</h3>}

        {/* ネタバレ処理 */}
        {review.is_spoiler && !isSpoilerExpanded ? (
          <div className="p-4 border border-yellow-500 bg-yellow-50 rounded">
            <p className="text-sm text-yellow-800 mb-2">
              ⚠️ このレビューにはネタバレが含まれます
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSpoilerExpanded(true)}
            >
              表示する
            </Button>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
        )}

        {/* 編集・削除ボタン（自分のレビューのみ） */}
        {isOwner && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(review.id)}
            >
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete?.(review.id)}
            >
              削除
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
