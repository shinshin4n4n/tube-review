import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCachedData,
  setCachedData,
  generateCacheKey,
} from '../cache';
import { CACHE_TTL_SECONDS } from '../types';

// Supabase client mock functions
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({
  single: mockSingle,
}));
const mockSelect = vi.fn(() => ({
  eq: mockEq,
}));
const mockUpsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockSingle,
  })),
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}));

const mockSupabase = {
  from: mockFrom,
};

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('YouTube Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCachedData', () => {
    it('should return cached data when cache is valid', async () => {
      // Arrange
      const cacheKey = 'youtube:search:abc123';
      const cachedData = { results: ['channel1', 'channel2'] };
      const expiresAt = new Date(
        Date.now() + CACHE_TTL_SECONDS * 1000
      ).toISOString();

      mockSingle.mockResolvedValueOnce({
        data: {
          cache_key: cacheKey,
          data: cachedData,
          expires_at: expiresAt,
        },
        error: null,
      });

      // Act
      const result = await getCachedData<{ results: string[] }>(cacheKey);

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockFrom).toHaveBeenCalledWith('youtube_cache');
    });

    it('should return null when cache is expired', async () => {
      // Arrange
      const cacheKey = 'youtube:search:abc123';
      const cachedData = { results: ['channel1', 'channel2'] };
      const expiresAt = new Date(Date.now() - 1000).toISOString(); // Expired 1 second ago

      mockSingle.mockResolvedValueOnce({
        data: {
          cache_key: cacheKey,
          data: cachedData,
          expires_at: expiresAt,
        },
        error: null,
      });

      // Act
      const result = await getCachedData(cacheKey);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when cache does not exist', async () => {
      // Arrange
      const cacheKey = 'youtube:search:nonexistent';

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Act
      const result = await getCachedData(cacheKey);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on Supabase errors', async () => {
      // Arrange
      const cacheKey = 'youtube:search:error';

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
      });

      // Act
      const result = await getCachedData(cacheKey);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('setCachedData', () => {
    it('should store data in cache with correct TTL', async () => {
      // Arrange
      const cacheKey = 'youtube:search:abc123';
      const data = { results: ['channel1', 'channel2'] };
      const expectedExpiresAt = new Date(
        Date.now() + CACHE_TTL_SECONDS * 1000
      ).toISOString();

      mockSingle.mockResolvedValueOnce({
        data: {
          cache_key: cacheKey,
          data,
          expires_at: expectedExpiresAt,
        },
        error: null,
      });

      // Act
      await setCachedData(cacheKey, data);

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          cache_key: cacheKey,
          data,
          expires_at: expectedExpiresAt,
        })
      );
    });

    it('should handle upsert errors gracefully', async () => {
      // Arrange
      const cacheKey = 'youtube:search:error';
      const data = { results: [] };

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upsert failed', code: 'ERROR' },
      });

      // Act & Assert - Should not throw
      await expect(setCachedData(cacheKey, data)).resolves.toBeUndefined();
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys for same inputs', () => {
      // Arrange
      const operation = 'search';
      const params = { query: 'test', maxResults: 10 };

      // Act
      const key1 = generateCacheKey(operation, params);
      const key2 = generateCacheKey(operation, params);

      // Assert
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^youtube:search:[a-f0-9]{64}$/);
    });

    it('should generate different keys for different operations', () => {
      // Arrange
      const params = { id: 'UC123' };

      // Act
      const searchKey = generateCacheKey('search', params);
      const detailsKey = generateCacheKey('details', params);

      // Assert
      expect(searchKey).not.toBe(detailsKey);
    });

    it('should generate different keys for different params', () => {
      // Arrange
      const operation = 'search';

      // Act
      const key1 = generateCacheKey(operation, { query: 'test1' });
      const key2 = generateCacheKey(operation, { query: 'test2' });

      // Assert
      expect(key1).not.toBe(key2);
    });
  });
});
