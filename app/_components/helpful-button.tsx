'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { toggleHelpfulAction } from '@/app/_actions/review';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface HelpfulButtonProps {
  reviewId: string;
  initialIsHelpful: boolean;
  initialHelpfulCount: number;
  currentUserId?: string;
}

/**
 * 「参考になった」ボタンコンポーネント
 * レビューに対する「参考になった」投票を管理します
 */
export default function HelpfulButton({
  reviewId,
  initialIsHelpful,
  initialHelpfulCount,
  currentUserId,
}: HelpfulButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // 楽観的UI更新用のローカル状態
  const [isHelpful, setIsHelpful] = useState(initialIsHelpful);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);

  const handleToggle = async () => {
    // 未ログインの場合はログインを促す
    if (!currentUserId) {
      toast({
        title: 'ログインが必要です',
        description: '「参考になった」を投票するにはログインしてください',
        variant: 'destructive',
      });
      return;
    }

    // 楽観的UI更新
    const newIsHelpful = !isHelpful;
    const newHelpfulCount = newIsHelpful ? helpfulCount + 1 : helpfulCount - 1;

    setIsHelpful(newIsHelpful);
    setHelpfulCount(newHelpfulCount);

    // Server Actionを実行
    startTransition(async () => {
      const result = await toggleHelpfulAction(reviewId);

      if (result.success) {
        // サーバーの結果で更新
        setIsHelpful(result.data.isHelpful);
        setHelpfulCount(result.data.helpfulCount);

        // ページをリフレッシュ
        router.refresh();
      } else {
        // エラーの場合は元に戻す
        setIsHelpful(!newIsHelpful);
        setHelpfulCount(helpfulCount);

        toast({
          title: 'エラー',
          description: result.error || '投票に失敗しました',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button
      variant={isHelpful ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="gap-2"
      data-testid="helpful-button"
      aria-label={isHelpful ? '参考になったを取り消す' : '参考になった'}
    >
      <ThumbsUp className={`h-4 w-4 ${isHelpful ? 'fill-current' : ''}`} />
      <span>参考になった</span>
      {helpfulCount > 0 && (
        <span className="font-semibold" data-testid="helpful-count">
          ({helpfulCount})
        </span>
      )}
    </Button>
  );
}
