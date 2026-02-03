import { z } from 'zod';
import type { ApiResponse, ApiErrorCode } from '@/lib/types/api';

/**
 * APIエラークラス
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * エラーをAPIレスポンスに変換
 */
export function handleApiError(error: unknown): ApiResponse<never> {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Validation error',
      details: error.issues,
    };
  }

  console.error('Unexpected error:', error);
  return {
    success: false,
    error: 'Internal server error',
  };
}
