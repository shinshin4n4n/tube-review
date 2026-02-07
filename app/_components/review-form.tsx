'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StarRating } from './star-rating';
import { createReviewAction } from '@/app/_actions/review';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  channelId: string;
}

/**
 * レビュー投稿フォーム
 */
export function ReviewForm({ channelId }: ReviewFormProps) {
  const router = useRouter();
  const { toast, toasts } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    rating?: string;
    title?: string;
    content?: string;
  }>({});

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
      const result = await createReviewAction({
        channelId,
        rating,
        title: title || undefined,
        content,
        isSpoiler: false,
      });

      if (result.success) {
        toast({
          title: 'レビューを投稿しました',
          description: 'レビューが正常に投稿されました',
        });

        // フォームをリセット
        setRating(0);
        setTitle('');
        setContent('');
        setErrors({});

        // ページをリフレッシュ
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'レビューの投稿に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Review submission error:', error);
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
    <>
      <Toaster toasts={toasts} />
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* 星評価 */}
      <div>
        <Label htmlFor="rating" className="text-base font-semibold mb-2 block text-foreground">
          評価 <span className="text-red-500">*</span>
        </Label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size={32}
        />
        {errors.rating && (
          <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
        )}
      </div>

      {/* タイトル（オプション） */}
      <div>
        <Label htmlFor="title" className="text-base font-semibold mb-2 block text-foreground">
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
        <Label htmlFor="content" className="text-base font-semibold mb-2 block text-foreground">
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

      {/* 送信ボタン */}
      <Button
        type="submit"
        disabled={isSubmitting || rating === 0 || content.length < 50}
        className="w-full bg-accent hover:bg-accent-hover"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            投稿中...
          </>
        ) : (
          'レビューを投稿'
        )}
      </Button>
    </form>
    </>
  );
}
