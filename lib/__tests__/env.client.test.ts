import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env.client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should parse valid client environment variables", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    // Act
    const { clientEnv } = await import("../env.client");

    // Assert
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://example.supabase.co"
    );
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
  });

  it("should throw when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    // Act & Assert
    await expect(import("../env.client")).rejects.toThrow(
      "Client environment validation failed"
    );
  });

  it("should throw when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Act & Assert
    await expect(import("../env.client")).rejects.toThrow(
      "Client environment validation failed"
    );
  });

  it("should throw when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    // Act & Assert
    await expect(import("../env.client")).rejects.toThrow(
      "Client environment validation failed"
    );
  });
});
