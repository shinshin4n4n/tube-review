import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchChannelsAction,
  getChannelDetailsAction,
  getChannelDetailsByDbIdAction,
} from "../youtube";
import { YouTubeApiError, YouTubeErrorCode } from "@/lib/youtube/types";
import type { ChannelSearchResult, ChannelDetails } from "@/lib/youtube/types";

// Mock YouTube API
const mockSearchChannels = vi.fn();
const mockGetChannelDetails = vi.fn();

vi.mock("@/lib/youtube/api", () => ({
  searchChannels: (...args: unknown[]) => mockSearchChannels(...args),
  getChannelDetails: (...args: unknown[]) => mockGetChannelDetails(...args),
}));

// Mock Supabase client
const mockUpsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
const mockSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  select: mockSelect,
}));

const mockSupabase = {
  from: mockFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("searchChannelsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockReset();
    mockSingle.mockReset();
    mockEq.mockReset();
    mockSelect.mockReset();
    mockFrom.mockReset();
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      select: mockSelect,
    });
  });

  it("should successfully search channels with valid query", async () => {
    // Arrange
    const mockResults: ChannelSearchResult[] = [
      {
        youtubeChannelId: "UCXuqSBlHAE6Xw-yeJA0Tunw",
        title: "Test Channel",
        description: "Test Description",
        thumbnailUrl: "https://example.com/thumb.jpg",
        subscriberCount: 1000,
      },
    ];
    mockSearchChannels.mockResolvedValue(mockResults);

    // Act
    const result = await searchChannelsAction("test query", 10);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockResults);
    }
    expect(mockSearchChannels).toHaveBeenCalledWith("test query", 10);
  });

  it("should return validation error for empty query", async () => {
    // Act
    const result = await searchChannelsAction("", 10);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockSearchChannels).not.toHaveBeenCalled();
  });

  it("should return validation error for invalid maxResults", async () => {
    // Act
    const result = await searchChannelsAction("test", 0);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockSearchChannels).not.toHaveBeenCalled();
  });

  it("should handle YouTube API quota exceeded error", async () => {
    // Arrange
    const error = new YouTubeApiError(
      "Quota exceeded",
      YouTubeErrorCode.QUOTA_EXCEEDED,
      {}
    );
    mockSearchChannels.mockRejectedValue(error);

    // Act
    const result = await searchChannelsAction("test query", 10);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      // YouTube API errors are caught and return generic message or specific based on error code
      expect(result.error).toBeDefined();
    }
  });

  it("should handle YouTube API rate limit error", async () => {
    // Arrange
    const error = new YouTubeApiError(
      "Rate limit",
      YouTubeErrorCode.RATE_LIMIT,
      {}
    );
    mockSearchChannels.mockRejectedValue(error);

    // Act
    const result = await searchChannelsAction("test query", 10);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("should handle unexpected errors gracefully", async () => {
    // Arrange
    mockSearchChannels.mockRejectedValue(new Error("Unexpected error"));

    // Act
    const result = await searchChannelsAction("test query", 10);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("unexpected error");
    }
  });

  it("should use default maxResults when not provided", async () => {
    // Arrange
    const mockResults: ChannelSearchResult[] = [];
    mockSearchChannels.mockResolvedValue(mockResults);

    // Act
    await searchChannelsAction("test query");

    // Assert
    expect(mockSearchChannels).toHaveBeenCalledWith("test query", 10);
  });
});

describe("getChannelDetailsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockReset();
    mockSingle.mockReset();
    mockEq.mockReset();
    mockSelect.mockReset();
    mockFrom.mockReset();
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      select: mockSelect,
    });
  });

  it("should successfully get channel details and save to DB", async () => {
    // Arrange
    const mockDetails: ChannelDetails = {
      youtubeChannelId: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel",
      description: "Test Description",
      thumbnailUrl: "https://example.com/thumb.jpg",
      subscriberCount: 1000,
      videoCount: 100,
      viewCount: 10000,
      publishedAt: "2020-01-01T00:00:00Z",
      customUrl: "@testchannel",
    };
    mockGetChannelDetails.mockResolvedValue(mockDetails);
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

    // Act
    const result = await getChannelDetailsAction("UCXuqSBlHAE6Xw-yeJA0Tunw");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockDetails);
    }
    expect(mockGetChannelDetails).toHaveBeenCalledWith(
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        youtube_channel_id: "UCXuqSBlHAE6Xw-yeJA0Tunw",
        title: "Test Channel",
        subscriber_count: 1000,
      }),
      expect.any(Object)
    );
  });

  it("should return YouTube data even if DB save fails", async () => {
    // Arrange
    const mockDetails: ChannelDetails = {
      youtubeChannelId: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel",
      description: "Test Description",
      thumbnailUrl: "https://example.com/thumb.jpg",
      subscriberCount: 1000,
      videoCount: 100,
      viewCount: 10000,
      publishedAt: "2020-01-01T00:00:00Z",
      customUrl: "@testchannel",
    };
    mockGetChannelDetails.mockResolvedValue(mockDetails);
    mockUpsert.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error", code: "500" },
    });

    // Act
    const result = await getChannelDetailsAction("UCXuqSBlHAE6Xw-yeJA0Tunw");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockDetails);
    }
  });

  it("should return validation error for empty channel ID", async () => {
    // Act
    const result = await getChannelDetailsAction("");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockGetChannelDetails).not.toHaveBeenCalled();
  });

  it("should handle YouTube API not found error", async () => {
    // Arrange
    const error = new YouTubeApiError(
      "Not found",
      YouTubeErrorCode.NOT_FOUND,
      {}
    );
    mockGetChannelDetails.mockRejectedValue(error);

    // Act
    const result = await getChannelDetailsAction("UCXuqSBlHAE6Xw-yeJA0Tunw");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("should handle YouTube API invalid key error", async () => {
    // Arrange
    const error = new YouTubeApiError(
      "Invalid key",
      YouTubeErrorCode.INVALID_API_KEY,
      {}
    );
    mockGetChannelDetails.mockRejectedValue(error);

    // Act
    const result = await getChannelDetailsAction("UCXuqSBlHAE6Xw-yeJA0Tunw");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("should handle network errors", async () => {
    // Arrange
    mockGetChannelDetails.mockRejectedValue(
      new YouTubeApiError("Network error", YouTubeErrorCode.NETWORK_ERROR, {})
    );

    // Act
    const result = await getChannelDetailsAction("UCXuqSBlHAE6Xw-yeJA0Tunw");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("error");
    }
  });

  it("should handle DB exception gracefully and still return YouTube data", async () => {
    // Arrange
    const mockDetails: ChannelDetails = {
      youtubeChannelId: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel",
      description: "Test Description",
      thumbnailUrl: "https://example.com/thumb.jpg",
      subscriberCount: 1000,
      videoCount: 100,
      viewCount: 10000,
      publishedAt: "2020-01-01T00:00:00Z",
      customUrl: "@testchannel",
    };
    mockGetChannelDetails.mockResolvedValue(mockDetails);
    mockFrom.mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    // Act
    const result = await getChannelDetailsAction("UCXuqSBlHAE6Xw-yeJA0Tunw");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockDetails);
    }
  });
});

describe("getChannelDetailsByDbIdAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockReset();
    mockSingle.mockReset();
    mockEq.mockReset();
    mockSelect.mockReset();
    mockFrom.mockReset();
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      select: mockSelect,
    });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it("should successfully get channel details from DB using UUID", async () => {
    // Arrange
    const mockDbChannel = {
      youtube_channel_id: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel",
      description: "Test Description",
      thumbnail_url: "https://example.com/thumb.jpg",
      subscriber_count: 1000,
      video_count: 100,
      view_count: 10000,
      published_at: "2020-01-01T00:00:00Z",
    };

    mockSingle.mockResolvedValueOnce({ data: mockDbChannel, error: null });

    // Act
    const result = await getChannelDetailsByDbIdAction(
      "550e8400-e29b-41d4-a716-446655440000"
    );

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.youtubeChannelId).toBe("UCXuqSBlHAE6Xw-yeJA0Tunw");
      expect(result.data.title).toBe("Test Channel");
    }
    expect(mockEq).toHaveBeenCalledWith(
      "id",
      "550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("should successfully get channel details from DB using YouTube ID", async () => {
    // Arrange
    const mockDbChannel = {
      youtube_channel_id: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel",
      description: "Test Description",
      thumbnail_url: "https://example.com/thumb.jpg",
      subscriber_count: 1000,
      video_count: 100,
      view_count: 10000,
      published_at: "2020-01-01T00:00:00Z",
    };

    mockSingle.mockResolvedValueOnce({ data: mockDbChannel, error: null });

    // Act
    const result = await getChannelDetailsByDbIdAction(
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.youtubeChannelId).toBe("UCXuqSBlHAE6Xw-yeJA0Tunw");
    }
    expect(mockEq).toHaveBeenCalledWith(
      "youtube_channel_id",
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );
  });

  it("should fallback to YouTube API if channel not found in DB (YouTube ID)", async () => {
    // Arrange
    const mockDetails: ChannelDetails = {
      youtubeChannelId: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel from API",
      description: "Test Description",
      thumbnailUrl: "https://example.com/thumb.jpg",
      subscriberCount: 1000,
      videoCount: 100,
      viewCount: 10000,
      publishedAt: "2020-01-01T00:00:00Z",
      customUrl: "@testchannel",
    };
    mockGetChannelDetails.mockResolvedValue(mockDetails);

    // DB query returns not found
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });
    // Then upsert succeeds
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

    // Act
    const result = await getChannelDetailsByDbIdAction(
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test Channel from API");
    }
    expect(mockGetChannelDetails).toHaveBeenCalledWith(
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );
  });

  it("should return error if UUID not found and cannot fallback", async () => {
    // Arrange
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    // Act
    const result = await getChannelDetailsByDbIdAction(
      "550e8400-e29b-41d4-a716-446655440000"
    );

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockGetChannelDetails).not.toHaveBeenCalled();
  });

  it("should handle DB errors gracefully", async () => {
    // Arrange
    mockFrom.mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    // Act
    const result = await getChannelDetailsByDbIdAction(
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("取得に失敗しました");
    }
  });

  it("should handle null description correctly", async () => {
    // Arrange
    const mockDbChannel = {
      youtube_channel_id: "UCXuqSBlHAE6Xw-yeJA0Tunw",
      title: "Test Channel",
      description: null,
      thumbnail_url: "https://example.com/thumb.jpg",
      subscriber_count: 1000,
      video_count: 100,
      view_count: 10000,
      published_at: "2020-01-01T00:00:00Z",
    };

    mockSingle.mockResolvedValueOnce({ data: mockDbChannel, error: null });

    // Act
    const result = await getChannelDetailsByDbIdAction(
      "UCXuqSBlHAE6Xw-yeJA0Tunw"
    );

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
});
