'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyListCard from '@/app/_components/my-list-card';
import type { UserChannelWithChannel } from '@/lib/types/user-channel';
import type { ChannelStatus } from '@/lib/validations/user-channel';
import { STATUS_LABELS } from '@/lib/types/user-channel';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 空の状態を表示するコンポーネント
 */
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-16">
    <p className="text-content-secondary text-lg">{message}</p>
  </div>
);

/**
 * チャンネルグリッド表示コンポーネント
 */
const ChannelGrid = ({ channels }: { channels: UserChannelWithChannel[] }) => {
  // 日付を事前フォーマット
  const channelsWithFormattedDates = useMemo(() => {
    return channels.map((item) => ({
      item,
      formattedDate: formatDistanceToNow(new Date(item.created_at), {
        addSuffix: true,
        locale: ja,
      }),
    }));
  }, [channels]);

  if (channels.length === 0) {
    return <EmptyState message="まだチャンネルを追加していません" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {channelsWithFormattedDates.map(({ item, formattedDate }) => (
        <MyListCard key={item.id} item={item} formattedDate={formattedDate} />
      ))}
    </div>
  );
};

interface MyListClientProps {
  items: UserChannelWithChannel[];
  stats: {
    all: number;
    want: number;
    watching: number;
    watched: number;
  };
  currentStatus?: ChannelStatus;
}

/**
 * マイリストクライアントコンポーネント
 */
export default function MyListClient({
  items,
  stats,
  currentStatus,
}: MyListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    const query = params.toString();
    router.push(`/my-list${query ? `?${query}` : ''}`);
  };

  const defaultTab = currentStatus || 'all';

  // フィルタリング
  const filterByStatus = (status?: ChannelStatus) => {
    if (!status) return items;
    return items.filter((item) => item.status === status);
  };

  return (
    <Tabs value={defaultTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="all">
          すべて
          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {stats.all}
          </span>
        </TabsTrigger>
        <TabsTrigger value="want">
          {STATUS_LABELS.want.emoji} {STATUS_LABELS.want.label}
          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {stats.want}
          </span>
        </TabsTrigger>
        <TabsTrigger value="watching">
          {STATUS_LABELS.watching.emoji} {STATUS_LABELS.watching.label}
          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {stats.watching}
          </span>
        </TabsTrigger>
        <TabsTrigger value="watched">
          {STATUS_LABELS.watched.emoji} {STATUS_LABELS.watched.label}
          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {stats.watched}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <ChannelGrid channels={items} />
      </TabsContent>

      <TabsContent value="want">
        <ChannelGrid channels={filterByStatus('want')} />
      </TabsContent>

      <TabsContent value="watching">
        <ChannelGrid channels={filterByStatus('watching')} />
      </TabsContent>

      <TabsContent value="watched">
        <ChannelGrid channels={filterByStatus('watched')} />
      </TabsContent>
    </Tabs>
  );
}
