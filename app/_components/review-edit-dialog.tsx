'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/common/star-rating';
import { updateReviewAction } from '@/app/_actions/review';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { ReviewWithUser } from '@/lib/types/review';

interface ReviewEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: ReviewWithUser;
}

/**
 * レビュー編集ダイアログ
 * モーダル内でレビューを編集できます
 */
export default function ReviewEditDialog({
  open,
  onOpenChange,
  review,
}: ReviewEditDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(review.rating);
  const [title, setTitle] = useState<string>(review.title || '');
  const [content, setContent] = useState<string>(review.content);
  const [isSpoiler, setIsSpoiler] = useState<boolean>(review.is_spoiler);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    rating?: string;
    title?: string;
    content?: string;
  }>({});

  // ダイアログが開かれた時にフォームをリセット
  useEffect(() => {
    if (open) {
      setRating(review.rating);
      setTitle(review.title || '');
      setContent(review.content);
      setIsSpoiler(review.is_spoiler);
      setErrors({});
    }
  }, [open, review]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (rating === 0) {
      newErrors.rating = '評価を選択してください';
    }

    if (content.length < 50) {
      newErrors.content = 'レビュー本文は50文字以上で入力してください';
    }

    if (content.length > 2000) {
      newErrors.content = 'レビュー本文は2000文字以内で入力してください';
    }

    if (title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateReviewAction(review.id, {
        rating,
        title: title || undefined,
        content,
        isSpoiler,
      });

      if (result.success) {
        toast({
          title: 'レビューを更新しました',
          description: 'レビューが正常に更新されました',
        });

        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'レビューの更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Review update error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>レビューを編集</DialogTitle>
          <DialogDescription>
            レビューの内容を編集できます
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 星評価 */}
          <div>
            <Label htmlFor="rating" className="text-base font-semibold mb-2 block">
              評価 <span className="text-red-500">*</span>
            </Label>
            <StarRating rating={rating} onRatingChange={setRating} size={32} />
            {errors.rating && (
              <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
            )}
          </div>

          {/* タイトル（オプション） */}
          <div>
            <Label htmlFor="title" className="text-base font-semibold mb-2 block">
              タイトル（オプション）
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="例: とても参考になるチャンネル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-sm text-content-secondary mt-1">
              {title.length} / 100文字
            </p>
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* レビュー本文 */}
          <div>
            <Label htmlFor="content" className="text-base font-semibold mb-2 block">
              レビュー本文 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="このチャンネルについての感想を50文字以上で入力してください..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              maxLength={2000}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p
              className={`text-sm mt-1 ${
                content.length < 50
                  ? 'text-red-500'
                  : content.length >= 50 && content.length <= 2000
                    ? 'text-green-600'
                    : 'text-content-secondary'
              }`}
            >
              {content.length} / 2000文字
              {content.length < 50 && ` (あと${50 - content.length}文字必要)`}
            </p>
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content}</p>
            )}
          </div>

          {/* ネタバレフラグ */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isSpoiler"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4"
            />
            <Label htmlFor="isSpoiler" className="text-sm cursor-pointer">
              ネタバレを含む
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || content.length < 50}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
