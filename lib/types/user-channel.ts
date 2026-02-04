import type { ChannelStatus } from '@/lib/validations/user-channel';

/**
 * ユーザーチャンネル型定義
 */
export interface UserChannel {
  id: string;
  user_id: string;
  channel_id: string;
  status: ChannelStatus;
  added_at: string;
  updated_at: string;
}

/**
 * ステータス表示ラベル
 */
export const STATUS_LABELS: Record<
  ChannelStatus,
  { label: string; emoji: string; color: string }
> = {
  want: {
    label: '見たい',
    emoji: '📌',
    color: 'bg-blue-100 text-blue-800',
  },
  watching: {
    label: '見ている',
    emoji: '👀',
    color: 'bg-green-100 text-green-800',
  },
  watched: {
    label: '見た',
    emoji: '✅',
    color: 'bg-gray-100 text-gray-800',
  },
};
