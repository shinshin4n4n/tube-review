import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { ApiError, handleApiError } from "../error";

describe("handleApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle ApiError and return error message with code", () => {
    // Arrange
    const error = new ApiError("UNAUTHORIZED", "ログインが必要です", 401);

    // Act
    const result = handleApiError(error);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
      expect(result.code).toBe("UNAUTHORIZED");
      expect(result).not.toHaveProperty("details");
    }
  });

  it("should handle ZodError with fixed message and VALIDATION_ERROR code", () => {
    // Arrange
    const schema = z.object({
      name: z.string().min(1, "名前は必須です"),
      age: z.number().min(0, "年齢は0以上です"),
    });

    let zodError: z.ZodError | undefined;
    try {
      schema.parse({ name: "", age: -1 });
    } catch (e) {
      if (e instanceof z.ZodError) {
        zodError = e;
      }
    }

    expect(zodError).toBeDefined();

    // Act
    const result = handleApiError(zodError!);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("入力内容を確認してください。");
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result).not.toHaveProperty("details");
    }
  });

  it("should not expose ZodError issues array to client", () => {
    // Arrange
    const schema = z.object({
      email: z.string().email("メールアドレスが不正です"),
    });

    let zodError: z.ZodError | undefined;
    try {
      schema.parse({ email: "invalid" });
    } catch (e) {
      if (e instanceof z.ZodError) {
        zodError = e;
      }
    }

    // Act
    const result = handleApiError(zodError!);

    // Assert
    if (!result.success) {
      expect(JSON.stringify(result)).not.toContain("issues");
      expect(result).not.toHaveProperty("details");
      expect(result.error).toBe("入力内容を確認してください。");
      expect(result.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should return fixed message for ZodError with multiple issues", () => {
    // Arrange
    const schema = z.object({
      name: z.string().min(1, "first error"),
      email: z.string().email("second error"),
    });

    let zodError: z.ZodError | undefined;
    try {
      schema.parse({ name: "", email: "bad" });
    } catch (e) {
      if (e instanceof z.ZodError) {
        zodError = e;
      }
    }

    // Act
    const result = handleApiError(zodError!);

    // Assert
    if (!result.success) {
      expect(result.error).toBe("入力内容を確認してください。");
      expect(result.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should handle ZodError-like objects via fallback check", () => {
    // Arrange - an object that looks like a ZodError but isn't instanceof
    const fakeZodError = {
      name: "ZodError",
      issues: [{ message: "fake issue" }],
    };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = handleApiError(fakeZodError);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("入力内容を確認してください。");
      expect(result.code).toBe("VALIDATION_ERROR");
    }

    consoleSpy.mockRestore();
  });

  describe("Supabase error handling", () => {
    it("should handle RLS violation (42501) with FORBIDDEN code", () => {
      // Arrange
      const supabaseError = {
        code: "42501",
        message: "new row violates row-level security policy",
        details: "some internal details",
      };

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = handleApiError(supabaseError);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("この操作を行う権限がありません。");
        expect(result.code).toBe("FORBIDDEN");
        expect(result).not.toHaveProperty("details");
      }

      consoleSpy.mockRestore();
    });

    it("should handle duplicate key violation (23505) with DUPLICATE code", () => {
      // Arrange
      const supabaseError = {
        code: "23505",
        message: "duplicate key value violates unique constraint",
        details: "Key (email)=(test@example.com) already exists.",
      };

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = handleApiError(supabaseError);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("この項目は既に存在します。");
        expect(result.code).toBe("DUPLICATE");
        expect(result).not.toHaveProperty("details");
      }

      consoleSpy.mockRestore();
    });

    it("should handle generic Supabase error with INTERNAL_ERROR code", () => {
      // Arrange
      const supabaseError = {
        code: "42P01",
        message: "relation does not exist",
        details: "some details",
      };

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = handleApiError(supabaseError);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("データベースエラーが発生しました。");
        expect(result.code).toBe("INTERNAL_ERROR");
        expect(result).not.toHaveProperty("details");
      }

      consoleSpy.mockRestore();
    });
  });

  it("should handle unexpected errors with generic message and INTERNAL_ERROR code", () => {
    // Arrange
    const error = new Error("Something went wrong");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = handleApiError(error);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("予期しないエラーが発生しました。");
      expect(result.code).toBe("INTERNAL_ERROR");
      expect(result).not.toHaveProperty("details");
    }
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should handle non-Error objects gracefully", () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = handleApiError("string error");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("予期しないエラーが発生しました。");
      expect(result.code).toBe("INTERNAL_ERROR");
    }

    consoleSpy.mockRestore();
  });
});

describe("ApiError", () => {
  it("should create an ApiError with correct properties", () => {
    // Act
    const error = new ApiError("NOT_FOUND", "リソースが見つかりません", 404);

    // Assert
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("リソースが見つかりません");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("ApiError");
    expect(error).toBeInstanceOf(Error);
  });

  it("should default to 500 status code", () => {
    // Act
    const error = new ApiError("INTERNAL_ERROR", "サーバーエラー");

    // Assert
    expect(error.statusCode).toBe(500);
  });
});
