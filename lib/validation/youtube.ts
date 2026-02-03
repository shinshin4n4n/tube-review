import { z } from 'zod';

/**
 * チャンネル検索バリデーションスキーマ
 */
export const searchChannelsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters'),
  maxResults: z
    .number()
    .int()
    .min(1, 'maxResults must be at least 1')
    .max(50, 'maxResults must be at most 50')
    .default(10),
});

/**
 * チャンネル詳細取得バリデーションスキーマ
 */
export const getChannelDetailsSchema = z.object({
  youtubeChannelId: z
    .string()
    .min(1, 'YouTube Channel ID is required')
    .regex(
      /^UC[\w-]{22}$/,
      'Invalid YouTube Channel ID format (must start with UC and be 24 characters)'
    ),
});

export type SearchChannelsInput = z.infer<typeof searchChannelsSchema>;
export type GetChannelDetailsInput = z.infer<typeof getChannelDetailsSchema>;
