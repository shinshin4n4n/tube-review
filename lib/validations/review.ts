import { z } from 'zod';

/**
 * レビュー作成時のバリデーションスキーマ
 */
export const createReviewSchema = z.object({
  channelId: z
    .string({ message: 'チャンネルIDは必須です' })
    .uuid('有効なチャンネルIDを指定してください'),
  rating: z
    .number({ message: '評価は必須です' })
    .int('評価は整数でなければなりません')
    .min(1, '評価は1以上でなければなりません')
    .max(5, '評価は5以下でなければなりません'),
  title: z
    .string()
    .max(100, 'タイトルは100文字以内で入力してください')
    .optional(),
  content: z
    .string({ message: 'レビュー本文は必須です' })
    .min(50, 'レビュー本文は50文字以上で入力してください')
    .max(2000, 'レビュー本文は2000文字以内で入力してください'),
  isSpoiler: z.boolean().default(false).optional(),
});

/**
 * レビュー作成入力型
 */
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * レビュー更新時のバリデーションスキーマ
 */
export const updateReviewSchema = z.object({
  rating: z
    .number({ message: '評価は必須です' })
    .int('評価は整数でなければなりません')
    .min(1, '評価は1以上でなければなりません')
    .max(5, '評価は5以下でなければなりません'),
  title: z
    .string()
    .max(100, 'タイトルは100文字以内で入力してください')
    .optional(),
  content: z
    .string({ message: 'レビュー本文は必須です' })
    .min(50, 'レビュー本文は50文字以上で入力してください')
    .max(2000, 'レビュー本文は2000文字以内で入力してください'),
  isSpoiler: z.boolean().default(false).optional(),
});

/**
 * レビュー更新入力型
 */
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

/**
 * チャンネルレビュー取得時のバリデーションスキーマ
 */
export const getChannelReviewsSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
  page: z.number().int().positive('Page must be positive'),
  limit: z.number().int().min(1).max(50).default(10),
});

/**
 * チャンネルレビュー取得入力型
 */
export type GetChannelReviewsInput = z.infer<typeof getChannelReviewsSchema>;
