import { z } from 'zod';

/**
 * チャンネルステータス型
 */
export const channelStatusEnum = z.enum([
  'want_to_watch',
  'watching',
  'watched',
]);

export type ChannelStatus = z.infer<typeof channelStatusEnum>;

/**
 * マイリスト追加時のバリデーションスキーマ
 */
export const addToMyListSchema = z.object({
  channelId: z
    .string({ message: 'チャンネルIDは必須です' })
    .uuid('有効なチャンネルIDを指定してください'),
  status: channelStatusEnum,
});

/**
 * マイリスト追加入力型
 */
export type AddToMyListInput = z.infer<typeof addToMyListSchema>;

/**
 * ステータス更新時のバリデーションスキーマ
 */
export const updateMyListStatusSchema = z.object({
  status: channelStatusEnum,
});

/**
 * ステータス更新入力型
 */
export type UpdateMyListStatusInput = z.infer<
  typeof updateMyListStatusSchema
>;
