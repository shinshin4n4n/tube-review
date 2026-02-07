'use client';

import { ReviewWithUser } from '@/lib/types/review';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from './star-rating';
import HelpfulButton from './helpful-button';
import { useState, useEffect } from 'react';
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
  const [isClient, setIsClient] = useState(false);
  const isOwner = currentUserId === review.user_id;

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card data-testid="review-card">
      <CardHeader>
        {/* ユーザー情報 + 星評価 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={review.user.avatar_url || undefined}
                alt={review.user.display_name || review.user.username}
              />
              <AvatarFallback className="bg-accent text-white">
                {(review.user.display_name?.[0] || review.user.username[0]).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {review.user.display_name || review.user.username}
              </p>
              <p className="text-sm text-gray-500" data-testid="review-date">
                {isClient
                  ? formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })
                  : new Date(review.created_at).toLocaleDateString('ja-JP')}
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

        {/* 参考になったボタン */}
        <div className="mt-4">
          <HelpfulButton
            reviewId={review.id}
            initialIsHelpful={review.is_helpful || false}
            initialHelpfulCount={review.helpful_count}
            currentUserId={currentUserId}
          />
        </div>

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
