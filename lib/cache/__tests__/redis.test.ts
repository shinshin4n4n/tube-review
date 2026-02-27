import { describe, it, expect, vi, beforeEach } from "vitest";

// Reset modules before each test to ensure clean singleton state
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("getRedisClient", () => {
  it("should return null when env vars are not set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { getRedisClient } = await import("../redis");
    const client = getRedisClient();
    expect(client).toBeNull();
  });

  it("should return null when URL is missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");

    const { getRedisClient } = await import("../redis");
    const client = getRedisClient();
    expect(client).toBeNull();
  });

  it("should return null when TOKEN is missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { getRedisClient } = await import("../redis");
    const client = getRedisClient();
    expect(client).toBeNull();
  });

  it("should return Redis client when env vars are set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token-value");

    const { getRedisClient } = await import("../redis");
    const client = getRedisClient();
    expect(client).not.toBeNull();
  });

  it("should return same instance on subsequent calls (singleton)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token-value");

    const { getRedisClient } = await import("../redis");
    const client1 = getRedisClient();
    const client2 = getRedisClient();
    expect(client1).toBe(client2);
  });
});

describe("isCacheEnabled", () => {
  it("should return false when env vars are not set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { isCacheEnabled } = await import("../redis");
    expect(isCacheEnabled()).toBe(false);
  });

  it("should return true when env vars are set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token-value");

    const { isCacheEnabled } = await import("../redis");
    expect(isCacheEnabled()).toBe(true);
  });
});

describe("CACHE_KEYS", () => {
  it("should have expected cache key constants", async () => {
    const { CACHE_KEYS } = await import("../redis");
    expect(CACHE_KEYS.CHANNEL_INFO).toBe("channel:info");
    expect(CACHE_KEYS.CHANNEL_STATS).toBe("channel:stats");
    expect(CACHE_KEYS.RANKING_TOTAL).toBe("ranking:total");
    expect(CACHE_KEYS.RANKING_CATEGORY).toBe("ranking:category");
    expect(CACHE_KEYS.REVIEW_STATS).toBe("review:stats");
  });
});

describe("CACHE_TTL", () => {
  it("should have expected TTL values in seconds", async () => {
    const { CACHE_TTL } = await import("../redis");
    expect(CACHE_TTL.CHANNEL_INFO).toBe(60 * 60 * 24); // 24 hours
    expect(CACHE_TTL.CHANNEL_STATS).toBe(60 * 60); // 1 hour
    expect(CACHE_TTL.RANKING).toBe(60 * 15); // 15 minutes
    expect(CACHE_TTL.REVIEW_STATS).toBe(60 * 5); // 5 minutes
  });
});
