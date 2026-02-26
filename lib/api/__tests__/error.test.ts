import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { ApiError, handleApiError } from "../error";

describe("handleApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle ApiError and return error message", () => {
    // Arrange
    const error = new ApiError("UNAUTHORIZED", "ログインが必要です", 401);

    // Act
    const result = handleApiError(error);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
      expect(result).not.toHaveProperty("details");
    }
  });

  it("should handle ZodError without exposing details", () => {
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
      // ZodError の最初の issue メッセージのみが返される
      expect(result.error).toBe("名前は必須です");
      // details が含まれていないこと（セキュリティ要件）
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
      // issues 配列が直接レスポンスに含まれていないこと
      expect(JSON.stringify(result)).not.toContain("issues");
      expect(result).not.toHaveProperty("details");
    }
  });

  it("should return first issue message for ZodError with multiple issues", () => {
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
      expect(result.error).toBe("first error");
    }
  });

  it("should handle unexpected errors and return generic message", () => {
    // Arrange
    const error = new Error("Something went wrong");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = handleApiError(error);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Internal server error");
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
      expect(result.error).toBe("Internal server error");
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
