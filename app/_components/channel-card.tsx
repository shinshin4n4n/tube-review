import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { ChannelSearchResult } from '@/lib/youtube/types';

type ChannelCardProps = {
  channel: ChannelSearchResult;
};

/**
 * チャンネルカードコンポーネント
 * 検索結果一覧でチャンネル情報を表示
 */
export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Link
      href={`/channels/${channel.youtubeChannelId}`}
      className="block"
      data-testid="channel-card"
    >
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-surface border-stroke">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* サムネイル */}
            <div className="flex-shrink-0">
              <Image
                src={channel.thumbnailUrl}
                alt={channel.title}
                width={80}
                height={80}
                className="rounded-full object-cover"
                data-testid="channel-thumbnail"
                unoptimized
              />
            </div>

            {/* チャンネル情報 */}
            <div className="flex-1 min-w-0">
              {/* チャンネル名 */}
              <h3
                className="text-lg font-bold text-content mb-1 truncate"
                data-testid="channel-name"
              >
                {channel.title}
              </h3>

              {/* 説明文（2行省略） */}
              <p
                className="text-sm text-content-secondary line-clamp-2"
                data-testid="channel-description"
              >
                {channel.description || 'チャンネルの説明がありません'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
