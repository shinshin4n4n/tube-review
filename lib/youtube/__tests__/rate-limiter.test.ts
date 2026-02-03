import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YouTubeRateLimiter } from '../rate-limiter';
import {
  DAILY_QUOTA_LIMIT,
  OPERATION_COSTS,
  OPERATION_LIMITS,
  YouTubeErrorCode,
} from '../types';

// Supabase client mock functions
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({
  single: mockSingle,
  select: vi.fn(() => ({
    single: mockSingle,
  })),
}));
const mockSelect = vi.fn(() => ({
  eq: mockEq,
  single: mockSingle,
}));
const mockInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockSingle,
  })),
}));
const mockUpdate = vi.fn(() => ({
  eq: mockEq,
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}));

const mockSupabase = {
  from: mockFrom,
};

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('YouTubeRateLimiter', () => {
  let rateLimiter: YouTubeRateLimiter;
  const today = '2026-02-05'; // UTC date string

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to return consistent date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
    rateLimiter = new YouTubeRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkQuota - 正常系', () => {
    it('should allow operation when quota is available', async () => {
      // Arrange
      const mockQuotaData = {
        date: today,
        used: 0,
        operations: { search: 0, details: 0 },
      };

      mockSingle
        .mockResolvedValueOnce({
          data: mockQuotaData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockQuotaData,
            used: OPERATION_COSTS.search,
            operations: { search: 1, details: 0 },
          },
          error: null,
        });

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('quota_usage');
    });

    it('should allow multiple operations within limits', async () => {
      // Arrange
      const mockQuotaData = {
        date: today,
        used: 500,
        operations: { search: 5, details: 100 },
      };

      mockSingle
        .mockResolvedValueOnce({
          data: mockQuotaData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockQuotaData,
            used: 501,
            operations: { search: 5, details: 101 },
          },
          error: null,
        });

      // Act & Assert
      await expect(rateLimiter.checkQuota('details')).resolves.toBeUndefined();
    });
  });

  describe('checkQuota - クォータ超過エラー', () => {
    it('should throw error when daily quota is exceeded', async () => {
      // Arrange
      const mockQuotaData = {
        date: today,
        used: DAILY_QUOTA_LIMIT,
        operations: { search: 80, details: 2000 },
      };

      mockSingle.mockResolvedValueOnce({
        data: mockQuotaData,
        error: null,
      });

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).rejects.toThrow(
        'Daily YouTube API quota exceeded'
      );
    });

    it('should throw error when operation-specific limit is exceeded', async () => {
      // Arrange
      const mockQuotaData = {
        date: today,
        used: 8000,
        operations: { search: OPERATION_LIMITS.search, details: 0 },
      };

      mockSingle.mockResolvedValueOnce({
        data: mockQuotaData,
        error: null,
      });

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).rejects.toThrow(
        'search operation limit exceeded'
      );
    });

    it('should throw QUOTA_EXCEEDED error code', async () => {
      // Arrange
      const mockQuotaData = {
        date: today,
        used: DAILY_QUOTA_LIMIT,
        operations: { search: 80, details: 2000 },
      };

      mockSingle.mockResolvedValueOnce({
        data: mockQuotaData,
        error: null,
      });

      // Act & Assert
      try {
        await rateLimiter.checkQuota('search');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe(YouTubeErrorCode.QUOTA_EXCEEDED);
      }
    });
  });

  describe('checkQuota - 日付リセット', () => {
    it('should create new quota entry for new day', async () => {
      // Arrange - No quota data exists for today
      mockSingle
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // Not found error
        })
        .mockResolvedValueOnce({
          data: {
            date: today,
            used: OPERATION_COSTS.search,
            operations: { search: 1, details: 0 },
          },
          error: null,
        });

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).resolves.toBeUndefined();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should reset quota when date changes', async () => {
      // Arrange - Old date data exists
      const oldDate = '2026-02-04';
      mockSingle
        .mockResolvedValueOnce({
          data: {
            date: oldDate,
            used: 9000,
            operations: { search: 70, details: 1000 },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            date: today,
            used: OPERATION_COSTS.search,
            operations: { search: 1, details: 0 },
          },
          error: null,
        });

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).resolves.toBeUndefined();
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('checkQuota - エラーハンドリング', () => {
    it('should handle Supabase connection errors', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
      });

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).rejects.toThrow(
        'Failed to check quota'
      );
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      mockSingle.mockRejectedValueOnce(new Error('Unexpected error'));

      // Act & Assert
      await expect(rateLimiter.checkQuota('search')).rejects.toThrow(
        'Failed to check quota'
      );
    });
  });
});
