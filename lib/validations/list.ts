import { z } from 'zod';

/**
 * リスト作成時のバリデーションスキーマ
 */
export const createListSchema = z.object({
  name: z
    .string({ message: 'リスト名は必須です' })
    .min(1, 'リスト名を入力してください')
    .max(50, 'リスト名は50文字以内で入力してください')
    .trim(),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .trim()
    .optional(),
  isPublic: z.boolean().default(false).optional(),
});

/**
 * リスト作成入力型
 */
export type CreateListInput = z.infer<typeof createListSchema>;

/**
 * リスト更新時のバリデーションスキーマ
 */
export const updateListSchema = z.object({
  name: z
    .string({ message: 'リスト名は必須です' })
    .min(1, 'リスト名を入力してください')
    .max(50, 'リスト名は50文字以内で入力してください')
    .trim()
    .optional(),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .trim()
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
});

/**
 * リスト更新入力型
 */
export type UpdateListInput = z.infer<typeof updateListSchema>;
