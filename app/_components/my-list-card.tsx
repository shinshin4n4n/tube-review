'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  updateMyListStatusAction,
  removeFromMyListAction,
} from '@/app/_actions/user-channel';
import type { UserChannelWithChannel } from '@/lib/types/user-channel';
import type { ChannelStatus } from '@/lib/validations/user-channel';
import { STATUS_LABELS } from '@/lib/types/user-channel';

interface MyListCardProps {
  item: UserChannelWithChannel;
  formattedDate?: string;
}

/**
 * マイリストチャンネルカード
 */
export default function MyListCard({ item, formattedDate }: MyListCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: ChannelStatus) => {
    if (newStatus === item.status) return;

    setIsLoading(true);

    try {
      const result = await updateMyListStatusAction(item.id, {
        status: newStatus,
      });

      if (result.success) {
        const statusLabel = STATUS_LABELS[newStatus];
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
      console.error('Status change error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `「${item.channel.title}」をマイリストから削除しますか？`
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await removeFromMyListAction(item.id);

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
      console.error('Delete error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLabel = STATUS_LABELS[item.status];

  // 日付フォーマット（propsで渡されていない場合はクライアント側でフォーマット）
  const addedDate = formattedDate || formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <Link
          href={`/channels/${item.channel_id}`}
          className="block group"
          data-testid="channel-link"
        >
          <div className="flex gap-4">
            {/* サムネイル */}
            <div className="flex-shrink-0">
              <Image
                src={item.channel.thumbnail_url || '/default-channel.png'}
                alt={item.channel.title}
                width={88}
                height={88}
                className="rounded-full object-cover group-hover:scale-105 transition-transform"
                unoptimized
              />
            </div>

            {/* チャンネル情報 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-content mb-1 truncate group-hover:text-accent transition-colors">
                {item.channel.title}
              </h3>

              {/* 登録者数 */}
              <div className="flex items-center gap-1 text-content-secondary text-sm mb-2">
                <Users className="w-4 h-4" />
                <span>{item.channel.subscriber_count.toLocaleString()}人</span>
              </div>

              {/* ステータスバッジと追加日 */}
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${currentLabel.color}`}
                >
                  {currentLabel.emoji} {currentLabel.label}
                </span>
                <span className="text-content-secondary">{addedDate}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* アクションボタン */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {/* ステータス変更ドロップダウン */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex-1"
              >
                ステータス変更
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleStatusChange('want')}
                disabled={isLoading || item.status === 'want'}
              >
                <span className="mr-2">{STATUS_LABELS.want.emoji}</span>
                {STATUS_LABELS.want.label}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('watching')}
                disabled={isLoading || item.status === 'watching'}
              >
                <span className="mr-2">{STATUS_LABELS.watching.emoji}</span>
                {STATUS_LABELS.watching.label}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('watched')}
                disabled={isLoading || item.status === 'watched'}
              >
                <span className="mr-2">{STATUS_LABELS.watched.emoji}</span>
                {STATUS_LABELS.watched.label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 削除ボタン */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
