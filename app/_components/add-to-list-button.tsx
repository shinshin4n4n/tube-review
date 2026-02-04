'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  addToMyListAction,
  updateMyListStatusAction,
  removeFromMyListAction,
} from '@/app/_actions/user-channel';
import type { UserChannel } from '@/lib/types/user-channel';
import type { ChannelStatus } from '@/lib/validations/user-channel';
import { STATUS_LABELS } from '@/lib/types/user-channel';

interface AddToListButtonProps {
  channelId: string;
  currentStatus: UserChannel | null;
}

/**
 * マイリスト追加ボタンコンポーネント
 * チャンネルをマイリストに追加・ステータス変更・削除
 */
export default function AddToListButton({
  channelId,
  currentStatus,
}: AddToListButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToList = async (status: ChannelStatus) => {
    setIsLoading(true);

    try {
      const result = await addToMyListAction({
        channelId,
        status,
      });

      if (result.success) {
        const statusLabel = STATUS_LABELS[status];
        toast({
          title: 'マイリストに追加しました',
          description: `「${statusLabel.emoji} ${statusLabel.label}」として追加されました`,
        });
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'マイリストへの追加に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Add to list error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: ChannelStatus) => {
    if (!currentStatus) return;

    setIsLoading(true);

    try {
      const result = await updateMyListStatusAction(currentStatus.id, {
        status,
      });

      if (result.success) {
        const statusLabel = STATUS_LABELS[status];
        toast({
          title: 'ステータスを変更しました',
          description: `「${statusLabel.emoji} ${statusLabel.label}」に変更されました`,
        });
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'ステータスの変更に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentStatus) return;

    setIsLoading(true);

    try {
      const result = await removeFromMyListAction(currentStatus.id);

      if (result.success) {
        toast({
          title: 'マイリストから削除しました',
          description: 'チャンネルがマイリストから削除されました',
        });
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'マイリストからの削除に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Remove from list error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 未追加の場合
  if (!currentStatus) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isLoading}
            className="bg-accent hover:bg-accent-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            マイリストに追加
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleAddToList('want')}
            disabled={isLoading}
          >
            <span className="mr-2">{STATUS_LABELS.want.emoji}</span>
            {STATUS_LABELS.want.label}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAddToList('watching')}
            disabled={isLoading}
          >
            <span className="mr-2">{STATUS_LABELS.watching.emoji}</span>
            {STATUS_LABELS.watching.label}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAddToList('watched')}
            disabled={isLoading}
          >
            <span className="mr-2">{STATUS_LABELS.watched.emoji}</span>
            {STATUS_LABELS.watched.label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 既に追加済みの場合
  const currentLabel = STATUS_LABELS[currentStatus.status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isLoading}
          variant="outline"
          className="border-accent text-accent hover:bg-accent hover:text-white"
        >
          <Check className="mr-2 h-4 w-4" />
          <span className="mr-1">{currentLabel.emoji}</span>
          {currentLabel.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleUpdateStatus('want')}
          disabled={
            isLoading || currentStatus.status === 'want'
          }
        >
          <span className="mr-2">{STATUS_LABELS.want.emoji}</span>
          {STATUS_LABELS.want.label}
          {currentStatus.status === 'want' && (
            <Check className="ml-auto h-4 w-4" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleUpdateStatus('watching')}
          disabled={isLoading || currentStatus.status === 'watching'}
        >
          <span className="mr-2">{STATUS_LABELS.watching.emoji}</span>
          {STATUS_LABELS.watching.label}
          {currentStatus.status === 'watching' && (
            <Check className="ml-auto h-4 w-4" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleUpdateStatus('watched')}
          disabled={isLoading || currentStatus.status === 'watched'}
        >
          <span className="mr-2">{STATUS_LABELS.watched.emoji}</span>
          {STATUS_LABELS.watched.label}
          {currentStatus.status === 'watched' && (
            <Check className="ml-auto h-4 w-4" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRemove}
          disabled={isLoading}
          className="text-red-600 focus:text-red-600"
        >
          <X className="mr-2 h-4 w-4" />
          マイリストから削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
