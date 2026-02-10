'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Users, Plus } from 'lucide-react';
import {
  searchChannelsForListAction,
  addChannelToListAction,
} from '@/app/_actions/list-channel';

interface AddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  onChannelAdded: () => void;
}

/**
 * チャンネル追加ダイアログ
 */
export default function AddChannelDialog({
  open,
  onOpenChange,
  listId,
  onChannelAdded,
}: AddChannelDialogProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    youtube_channel_id: string;
    title: string;
    thumbnail_url: string;
    subscriber_count: number;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingChannelId, setAddingChannelId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.trim().length < 2) {
      toast({
        title: 'エラー',
        description: '2文字以上で検索してください',
        variant: 'destructive',
      });
      return;
    }

    console.log('[AddChannelDialog] Starting search with query:', query);
    setIsSearching(true);

    try {
      const result = await searchChannelsForListAction(query);
      console.log('[AddChannelDialog] Search result:', result);

      if (result.success) {
        console.log('[AddChannelDialog] Search successful, results count:', result.data.length);
        setSearchResults(result.data);

        if (result.data.length === 0) {
          console.log('[AddChannelDialog] No results found, showing toast');
          toast({
            title: '検索結果なし',
            description: 'チャンネルが見つかりませんでした',
          });
        } else {
          console.log('[AddChannelDialog] Found results:', result.data);
        }
      } else {
        console.error('[AddChannelDialog] Search failed:', result.error);
        toast({
          title: 'エラー',
          description: result.error || '検索に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[AddChannelDialog] Search error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
      console.log('[AddChannelDialog] Search completed');
    }
  };

  const handleAdd = async (channelId: string) => {
    setAddingChannelId(channelId);

    try {
      const result = await addChannelToListAction(listId, channelId);

      if (result.success) {
        toast({
          title: 'チャンネルを追加しました',
          description: 'リストにチャンネルが追加されました',
        });

        setQuery('');
        setSearchResults([]);
        onChannelAdded();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'チャンネルの追加に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Add error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setAddingChannelId(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>チャンネルを検索して追加</DialogTitle>
          <DialogDescription>
            チャンネル名で検索して、リストに追加できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索フォーム */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                チャンネル名
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="チャンネル名を入力..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || query.trim().length < 2}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  検索中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  検索
                </>
              )}
            </Button>
          </div>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-content-secondary">
                {searchResults.length} 件のチャンネルが見つかりました
              </p>

              <div className="space-y-2">
                {searchResults.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Image
                      src={channel.thumbnail_url || '/default-channel.png'}
                      alt={channel.title}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                      unoptimized
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-content truncate">
                        {channel.title}
                      </h4>
                      {channel.subscriber_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Users className="w-4 h-4" />
                          <span>
                            {channel.subscriber_count.toLocaleString('ja-JP')}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAdd(channel.id)}
                      disabled={addingChannelId === channel.id}
                      className="bg-accent hover:bg-accent-hover"
                    >
                      {addingChannelId === channel.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          追加中...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          追加
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
