import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchChannels, getChannelDetails } from '../api';
import { YouTubeErrorCode } from '../types';
import * as cache from '../cache';
import * as rateLimiter from '../rate-limiter';

// Mock modules
vi.mock('../cache');
vi.mock('../rate-limiter');

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    YOUTUBE_API_KEY: 'test-api-key',
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('YouTube API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchChannels', () => {
    it('should return cached data when available', async () => {
      // Arrange
      const query = 'test channel';
      const maxResults = 10;
      const cachedResults = [
        {
          youtubeChannelId: 'UC123',
          title: 'Test Channel',
          description: 'Test description',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
      ];

      vi.mocked(cache.generateCacheKey).mockReturnValue(
        'youtube:search:abc123'
      );
      vi.mocked(cache.getCachedData).mockResolvedValue(cachedResults);

      // Act
      const result = await searchChannels(query, maxResults);

      // Assert
      expect(result).toEqual(cachedResults);
      expect(cache.getCachedData).toHaveBeenCalled();
      expect(rateLimiter.youtubeRateLimiter.checkQuota).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache misses', async () => {
      // Arrange
      const query = 'test channel';
      const maxResults = 10;
      const apiResponse = {
        items: [
          {
            id: { channelId: 'UC123' },
            snippet: {
              title: 'Test Channel',
              description: 'Test description',
              thumbnails: {
                high: { url: 'https://example.com/thumb.jpg', width: 800, height: 800 },
                medium: { url: '', width: 0, height: 0 },
                default: { url: '', width: 0, height: 0 },
              },
            },
          },
        ],
      };

      vi.mocked(cache.generateCacheKey).mockReturnValue(
        'youtube:search:abc123'
      );
      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(cache.setCachedData).mockResolvedValue(undefined);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => apiResponse,
      } as Response);

      // Act
      const result = await searchChannels(query, maxResults);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].youtubeChannelId).toBe('UC123');
      expect(result[0].title).toBe('Test Channel');
      expect(rateLimiter.youtubeRateLimiter.checkQuota).toHaveBeenCalledWith(
        'search'
      );
      expect(cache.setCachedData).toHaveBeenCalled();
    });

    it('should throw RATE_LIMIT error on 403 quota response', async () => {
      // Arrange
      const query = 'test';
      const maxResults = 10;

      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: 'quotaExceeded' },
        }),
      } as Response);

      // Act & Assert
      try {
        await searchChannels(query, maxResults);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as any).code).toBe(YouTubeErrorCode.RATE_LIMIT);
      }
    });

    it('should throw NOT_FOUND error on 404 response', async () => {
      // Arrange
      const query = 'nonexistent';
      const maxResults = 10;

      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      // Act & Assert
      try {
        await searchChannels(query, maxResults);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as any).code).toBe(YouTubeErrorCode.NOT_FOUND);
      }
    });

    it('should handle network errors', async () => {
      // Arrange
      const query = 'test';
      const maxResults = 10;

      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      // Act & Assert
      try {
        await searchChannels(query, maxResults);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as any).code).toBe(YouTubeErrorCode.NETWORK_ERROR);
      }
    });

    it('should throw INVALID_API_KEY error on 403 non-quota response', async () => {
      // Arrange
      const query = 'test';
      const maxResults = 10;

      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      } as Response);

      // Act & Assert
      try {
        await searchChannels(query, maxResults);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as any).code).toBe(YouTubeErrorCode.INVALID_API_KEY);
      }
    });
  });

  describe('getChannelDetails', () => {
    it('should return cached data when available', async () => {
      // Arrange
      const youtubeChannelId = 'UC123';
      const cachedDetails = {
        youtubeChannelId,
        title: 'Test Channel',
        description: 'Test description',
        customUrl: '@testchannel',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        subscriberCount: 1000,
        videoCount: 50,
        viewCount: 10000,
      };

      vi.mocked(cache.generateCacheKey).mockReturnValue(
        'youtube:details:def456'
      );
      vi.mocked(cache.getCachedData).mockResolvedValue(cachedDetails);

      // Act
      const result = await getChannelDetails(youtubeChannelId);

      // Assert
      expect(result).toEqual(cachedDetails);
      expect(cache.getCachedData).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache misses', async () => {
      // Arrange
      const youtubeChannelId = 'UC123';
      const apiResponse = {
        items: [
          {
            id: 'UC123',
            snippet: {
              title: 'Test Channel',
              description: 'Test description',
              customUrl: '@testchannel',
              thumbnails: {
                high: { url: 'https://example.com/thumb.jpg', width: 800, height: 800 },
                medium: { url: '', width: 0, height: 0 },
                default: { url: '', width: 0, height: 0 },
              },
            },
            statistics: {
              subscriberCount: '1000',
              videoCount: '50',
              viewCount: '10000',
            },
          },
        ],
      };

      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(cache.setCachedData).mockResolvedValue(undefined);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => apiResponse,
      } as Response);

      // Act
      const result = await getChannelDetails(youtubeChannelId);

      // Assert
      expect(result.youtubeChannelId).toBe('UC123');
      expect(result.subscriberCount).toBe(1000);
      expect(result.videoCount).toBe(50);
      expect(result.viewCount).toBe(10000);
      expect(rateLimiter.youtubeRateLimiter.checkQuota).toHaveBeenCalledWith(
        'details'
      );
      expect(cache.setCachedData).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when channel does not exist', async () => {
      // Arrange
      const youtubeChannelId = 'UCnonexistent';

      vi.mocked(cache.getCachedData).mockResolvedValue(null);
      vi.mocked(rateLimiter.youtubeRateLimiter.checkQuota).mockResolvedValue(
        undefined
      );
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

      // Act & Assert
      try {
        await getChannelDetails(youtubeChannelId);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as any).code).toBe(YouTubeErrorCode.NOT_FOUND);
      }
    });
  });
});
