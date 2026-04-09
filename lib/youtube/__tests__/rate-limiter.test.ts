import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { YouTubeRateLimiter } from "../rate-limiter";

// Mock @/lib/supabase/service (the actual import used by rate-limiter.ts)
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    })),
  })),
}));

describe("YouTubeRateLimiter", () => {
  let rateLimiter: YouTubeRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05T12:00:00Z"));
    rateLimiter = new YouTubeRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // NOTE: checkQuota is currently disabled (early return) due to RLS permissions.
  // When quota checking is re-enabled, restore detailed quota tests
  // (daily limit, operation limit, date reset, error handling).

  describe("checkQuota - 現在の動作（一時的に無効化）", () => {
    it("should resolve without error when quota check is disabled", async () => {
      await expect(rateLimiter.checkQuota("search")).resolves.toBeUndefined();
    });

    it("should resolve for details operation when quota check is disabled", async () => {
      await expect(rateLimiter.checkQuota("details")).resolves.toBeUndefined();
    });

    it("should not call Supabase when quota check is disabled", async () => {
      const { createServiceClient } = await import("@/lib/supabase/service");
      await rateLimiter.checkQuota("search");
      expect(createServiceClient).not.toHaveBeenCalled();
    });
  });
});
