import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCategories,
  getChannelsByCategory,
  type CategoryWithCount,
  type CategoryChannel,
} from "../category";

// Supabase client mock
const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/constants/categories", async () => {
  const actual = await vi.importActual("@/lib/constants/categories");
  return {
    ...actual,
    CATEGORIES: [
      { slug: "tech", name: "テクノロジー", icon: "💻" },
      { slug: "gaming", name: "ゲーム", icon: "🎮" },
    ],
    getCategoryBySlug: (slug: string) => {
      if (slug === "tech")
        return { slug: "tech", name: "テクノロジー", icon: "💻" };
      if (slug === "gaming")
        return { slug: "gaming", name: "ゲーム", icon: "🎮" };
      return null;
    },
  };
});

describe("getCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all categories with channel counts and top channels", async () => {
    // Arrange
    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    // Mock channel count query
    mockFrom.mockImplementation((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                count: 10,
                error: null,
              })
            ),
          })),
        };
      }
      // Mock top channels query
      if (table === "channels_with_stats") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      {
                        id: "ch1",
                        youtube_channel_id: "UC123",
                        thumbnail_url: "https://example.com/thumb.jpg",
                      },
                    ],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    // Act
    const result = await getCategories();

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const firstCategory = result[0] as CategoryWithCount;
    expect(firstCategory).toHaveProperty("slug");
    expect(firstCategory).toHaveProperty("name");
    expect(firstCategory).toHaveProperty("channelCount");
    expect(firstCategory).toHaveProperty("topChannels");
    expect(Array.isArray(firstCategory.topChannels)).toBe(true);
  });
});

describe("getChannelsByCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return channels for valid category with default sort (popular)", async () => {
    // Arrange
    const mockChannels = [
      {
        id: "ch1",
        youtube_channel_id: "UC123",
        title: "Tech Channel",
        description: "A tech channel",
        thumbnail_url: "https://example.com/thumb.jpg",
        subscriber_count: 10000,
        review_count: 5,
        average_rating: 4.5,
        recent_review_count: 3,
      },
    ];

    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    mockFrom.mockImplementation((table: string) => {
      if (table === "channels_with_stats") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockChannels,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                count: 25,
                error: null,
              })
            ),
          })),
        };
      }
      return {};
    });

    // Act
    const result = await getChannelsByCategory("tech");

    // Assert
    expect(result).toBeDefined();
    expect(result.channels).toEqual(mockChannels);
    expect(result.totalCount).toBe(25);
    expect(result.category).toEqual({
      slug: "tech",
      name: "テクノロジー",
      icon: "💻",
    });
  });

  it("should return empty result for invalid category slug", async () => {
    // Act
    const result = await getChannelsByCategory("invalid-slug");

    // Assert
    expect(result.channels).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.category).toBeNull();
  });

  it("should support different sort options", async () => {
    // Arrange
    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    const mockOrderSpy = vi.fn(() => ({
      range: vi.fn(() =>
        Promise.resolve({
          data: [],
          error: null,
        })
      ),
    }));

    mockFrom.mockImplementation((table: string) => {
      if (table === "channels_with_stats") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: mockOrderSpy,
            })),
          })),
        };
      }
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                count: 0,
                error: null,
              })
            ),
          })),
        };
      }
      return {};
    });

    // Act - Test 'latest' sort
    await getChannelsByCategory("tech", "latest");

    // Assert
    expect(mockOrderSpy).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });

    // Act - Test 'subscribers' sort
    mockOrderSpy.mockClear();
    await getChannelsByCategory("tech", "subscribers");

    // Assert
    expect(mockOrderSpy).toHaveBeenCalledWith("subscriber_count", {
      ascending: false,
    });
  });

  it("should handle pagination correctly", async () => {
    // Arrange
    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    const mockRangeSpy = vi.fn(() =>
      Promise.resolve({
        data: [],
        error: null,
      })
    );

    mockFrom.mockImplementation((table: string) => {
      if (table === "channels_with_stats") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: mockRangeSpy,
              })),
            })),
          })),
        };
      }
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                count: 0,
                error: null,
              })
            ),
          })),
        };
      }
      return {};
    });

    // Act - Page 1, limit 20
    await getChannelsByCategory("tech", "popular", 1, 20);

    // Assert
    expect(mockRangeSpy).toHaveBeenCalledWith(0, 19);

    // Act - Page 2, limit 20
    mockRangeSpy.mockClear();
    await getChannelsByCategory("tech", "popular", 2, 20);

    // Assert
    expect(mockRangeSpy).toHaveBeenCalledWith(20, 39);
  });
});
