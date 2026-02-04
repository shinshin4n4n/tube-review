'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { ApiError, handleApiError } from '@/lib/api/error';
import { API_ERROR_CODES, type ApiResponse } from '@/lib/types/api';
import {
  createReviewSchema,
  type CreateReviewInput,
} from '@/lib/validations/review';
import type { Review } from '@/lib/types/review';

/**
 * レビューを作成
 */
export async function createReviewAction(
  input: CreateReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // バリデーション
    const validated = createReviewSchema.parse(input);

    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        'ログインが必要です',
        401
      );
    }

    // Supabaseクライアント作成
    const supabase = await createClient();

    // レビューを挿入
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        channel_id: validated.channelId,
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content,
        is_spoiler: validated.isSpoiler || false,
      })
      .select()
      .single();

    if (error) {
      // 重複エラーチェック（UNIQUE制約違反）
      if (error.code === '23505') {
        throw new ApiError(
          API_ERROR_CODES.DUPLICATE,
          'このチャンネルにはすでにレビューを投稿しています',
          409
        );
      }

      console.error('Supabase error:', error);
      throw new ApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        'レビューの投稿に失敗しました',
        500
      );
    }

    // チャンネル詳細ページを再検証
    revalidatePath(`/channels/${validated.channelId}`);

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleApiError(err);
  }
}
