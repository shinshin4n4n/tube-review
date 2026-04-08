import { z } from "zod";
import type { ApiResponse, ApiErrorCode } from "@/lib/types/api";

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
    this.name = "ApiError";
  }
}

/**
 * ZodError 型ガード（instanceof + fallback check）
 */
function isZodError(error: unknown): boolean {
  if (error instanceof z.ZodError) return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: unknown }).name === "ZodError" &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  ) {
    return true;
  }
  return false;
}

interface SupabaseErrorLike {
  code: string;
  message: string;
}

/**
 * Supabase エラー型ガード
 */
function isSupabaseError(error: unknown): error is SupabaseErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    !isZodError(error) &&
    !(error instanceof ApiError)
  );
}

/**
 * エラーをAPIレスポンスに変換
 */
export function handleApiError(error: unknown): ApiResponse<never> {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }

  if (isZodError(error)) {
    return {
      success: false,
      error: "入力内容を確認してください。",
      code: "VALIDATION_ERROR",
    };
  }

  if (isSupabaseError(error)) {
    console.error("Supabase error:", error.code, error.message);
    switch (error.code) {
      case "42501":
        return {
          success: false,
          error: "この操作を行う権限がありません。",
          code: "FORBIDDEN",
        };
      case "23505":
        return {
          success: false,
          error: "この項目は既に存在します。",
          code: "DUPLICATE",
        };
      default:
        return {
          success: false,
          error: "データベースエラーが発生しました。",
          code: "INTERNAL_ERROR",
        };
    }
  }

  console.error("Unexpected error:", error);
  return {
    success: false,
    error: "予期しないエラーが発生しました。",
    code: "INTERNAL_ERROR",
  };
}
