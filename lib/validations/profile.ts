import { z } from 'zod';
import { PREFECTURES } from '@/lib/constants/prefectures';

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

/**
 * プロフィール更新時のバリデーションスキーマ
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名は必須です')
    .max(50, '表示名は50文字以内で入力してください')
    .optional(),
  avatarUrl: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional(),
  occupation: z
    .string()
    .max(100, '職業は100文字以内で入力してください')
    .optional(),
  gender: z
    .enum(GENDER_OPTIONS, {
      message: '有効な性別を選択してください',
    })
    .optional(),
  birthDate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      },
      { message: '有効な生年月日を入力してください' }
    )
    .optional(),
  prefecture: z
    .string()
    .refine((val) => !val || PREFECTURES.includes(val), {
      message: '有効な都道府県を選択してください',
    })
    .optional(),
  websiteUrl: z
    .string()
    .url('有効なURLを入力してください')
    .max(500, 'URLは500文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

/**
 * プロフィール更新入力型
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
