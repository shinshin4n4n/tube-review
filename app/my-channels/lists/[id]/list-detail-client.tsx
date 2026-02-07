'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getListChannelsAction,
  removeChannelFromListAction,
} from '@/app/_actions/list-channel';
import AddChannelDialog from './add-channel-dialog';

interface ListDetailClientProps {
  listId: string;
}

/**
 * リスト詳細クライアントコンポーネント
 */
export default function ListDetailClient({ listId }: ListDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(
    null
  );

  // データ取得
  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getListChannelsAction(listId);

    if (result.success) {
      setChannels(result.data);
    } else {
      setError(result.error || 'データの取得に失敗しました');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchChannels();
  }, [listId]);

  const handleDelete = async (channelId: string) => {
    if (!confirm('このチャンネルをリストから削除しますか？')) {
      return;
    }

    setDeletingChannelId(channelId);

    try {
      const result = await removeChannelFromListAction(listId, channelId);

      if (result.success) {
        toast({
          title: 'チャンネルを削除しました',
          description: 'リストからチャンネルが削除されました',
        });

        // リストを更新
        setChannels((prev) =>
          prev.filter((item) => item.channel.id !== channelId)
        );
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'チャンネルの削除に失敗しました',
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
      setDeletingChannelId(null);
    }
  };

  const handleChannelAdded = () => {
    setShowAddDialog(false);
    fetchChannels();
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

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-content-secondary">
          {channels.length} チャンネル
        </p>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-accent hover:bg-accent-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          チャンネルを追加
        </Button>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-content-secondary text-lg mb-4">
            まだチャンネルが追加されていません
          </p>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-accent hover:bg-accent-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            最初のチャンネルを追加
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4">
                <Link
                  href={`/channels/${item.channel.id}`}
                  className="block group"
                >
                  <div className="flex gap-4">
                    {/* サムネイル */}
                    <div className="flex-shrink-0">
                      <Image
                        src={
                          item.channel.thumbnail_url ||
                          '/default-channel.png'
                        }
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
                      {item.channel.subscriber_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Users className="w-4 h-4" />
                          <span>
                            {item.channel.subscriber_count.toLocaleString(
                              'ja-JP'
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* 削除ボタン */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 w-full"
                    onClick={() => handleDelete(item.channel.id)}
                    disabled={deletingChannelId === item.channel.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    リストから削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* チャンネル追加ダイアログ */}
      <AddChannelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        listId={listId}
        onChannelAdded={handleChannelAdded}
      />
    </>
  );
}
