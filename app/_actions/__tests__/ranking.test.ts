import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRankingChannels, getRecentReviews } from "../ranking";

// Supabase client mock
const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("getRankingChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ranking channels with default limit (10)", async () => {
    // Arrange
    const mockChannels = [
      {
        id: "ch1",
        youtube_channel_id: "UC123",
        title: "Top Channel",
        description: "Description",
        thumbnail_url: "https://example.com/thumb.jpg",
        subscriber_count: 100000,
        review_count: 50,
        average_rating: 4.8,
        recent_review_count: 20,
      },
    ];

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve({
                    data: mockChannels,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
      })),
    }));

    // Act
    const result = await getRankingChannels();

    // Assert
    expect(result).toEqual(mockChannels);
    expect(mockSupabase.from).toHaveBeenCalledWith("channels_with_stats");
  });

  it("should return ranking channels with custom limit", async () => {
    // Arrange
    const customLimit = 5;
    const mockChannels = Array(customLimit)
      .fill(null)
      .map((_, i) => ({
        id: `ch${i + 1}`,
        youtube_channel_id: `UC${i + 1}`,
        title: `Channel ${i + 1}`,
        description: `Description ${i + 1}`,
        thumbnail_url: `https://example.com/thumb${i + 1}.jpg`,
        subscriber_count: 10000 * (i + 1),
        review_count: 10 * (i + 1),
        average_rating: 4.0 + i * 0.1,
        recent_review_count: 5 * (i + 1),
      }));

    const mockLimit = vi.fn(() =>
      Promise.resolve({ data: mockChannels, error: null })
    );

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: mockLimit,
              })),
            })),
          })),
        })),
      })),
    }));

    // Act
    const result = await getRankingChannels(customLimit);

    // Assert
    expect(result).toEqual(mockChannels);
    expect(mockLimit).toHaveBeenCalledWith(customLimit);
  });

  it("should return empty array when no channels found", async () => {
    // Arrange
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve({ data: null, error: null })
                ),
              })),
            })),
          })),
        })),
      })),
    }));

    // Act
    const result = await getRankingChannels();

    // Assert
    expect(result).toEqual([]);
  });

  it("should throw error when database query fails", async () => {
    // Arrange
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: "Database error" },
                  })
                ),
              })),
            })),
          })),
        })),
      })),
    }));

    // Act & Assert
    await expect(getRankingChannels()).rejects.toThrow(
      "ランキングの取得に失敗しました"
    );
  });
});

/**
 * getRecentReviews テスト用ヘルパー
 *
 * 新しいクエリビルダーは動的にチェーンが構築されるため、
 * 全メソッドを self-returning にするフルイエントモックを使用
 */
function createFluentMock(resolveValue: {
  data: unknown;
  error: unknown;
  count?: number | null;
}) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  // fluent chain: 全メソッドが self を返し、最終的に Promise.resolve する
  const self = new Proxy(mock, {
    get: (_target, prop: string) => {
      if (prop === "then") {
        // Promise.resolve のために thenable として振る舞う
        return (resolve: (v: unknown) => void) => resolve(resolveValue);
      }
      if (!mock[prop]) {
        mock[prop] = vi.fn(() => self);
      }
      return mock[prop];
    },
  });

  return self;
}

function setupMockForReviews(options: {
  countResult?: number | null;
  dataResult?: unknown[] | null;
  dataError?: unknown;
  categoryChannels?: { id: string }[] | null;
  queryChannels?: { id: string }[] | null;
}) {
  const {
    countResult = 0,
    dataResult = [],
    dataError = null,
    categoryChannels,
    queryChannels,
  } = options;

  mockSupabase.from = vi.fn((table: string) => {
    if (table === "channels") {
      // カテゴリ or キーワードによるチャンネル検索
      const channelData =
        categoryChannels !== undefined
          ? categoryChannels
          : (queryChannels ?? []);
      let callCount = 0;
      return {
        select: vi.fn(() => {
          callCount++;
          // 1回目: category フィルタ、2回目: query フィルタ
          const data =
            categoryChannels !== undefined && queryChannels !== undefined
              ? callCount === 1
                ? categoryChannels
                : queryChannels
              : channelData;
          return createFluentMock({ data, error: null });
        }),
      };
    }

    // reviews テーブル
    const selectMock = vi.fn((_fields: string, opts?: unknown) => {
      if (opts && typeof opts === "object" && "count" in opts) {
        return createFluentMock({
          data: null,
          error: null,
          count: countResult,
        });
      }
      return createFluentMock({ data: dataResult, error: dataError });
    });

    return { select: selectMock };
  });
}

describe("getRecentReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return reviews with default pagination", async () => {
    // Arrange
    const mockReviews = [
      {
        id: "rev1",
        user_id: "user1",
        channel_id: "ch1",
        rating: 5,
        title: "Great channel",
        content: "Awesome content",
        is_spoiler: false,
        helpful_count: 10,
        created_at: "2024-01-01T00:00:00Z",
        user: {
          id: "user1",
          username: "testuser",
          display_name: "Test User",
          avatar_url: "https://example.com/avatar.jpg",
        },
        channel: {
          id: "ch1",
          youtube_channel_id: "UC123",
          title: "Test Channel",
          thumbnail_url: "https://example.com/thumb.jpg",
          category: "tech",
        },
      },
    ];

    setupMockForReviews({ countResult: 25, dataResult: mockReviews });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.reviews).toEqual(mockReviews);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 25,
      totalPages: 2,
    });
  });

  it("should return reviews with custom pagination", async () => {
    // Arrange
    setupMockForReviews({ countResult: 25, dataResult: [] });

    // Act
    const result = await getRecentReviews({ page: 2, limit: 10 });

    // Assert
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it("should handle array user and channel in JOIN results", async () => {
    // Arrange
    const mockReviewsWithArrays = [
      {
        id: "rev1",
        user_id: "user1",
        channel_id: "ch1",
        rating: 5,
        title: "Test",
        content: "Content",
        is_spoiler: false,
        helpful_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        user: [
          {
            id: "user1",
            username: "testuser",
            display_name: "Test User",
            avatar_url: null,
          },
        ],
        channel: [
          {
            id: "ch1",
            youtube_channel_id: "UC123",
            title: "Test Channel",
            thumbnail_url: null,
            category: null,
          },
        ],
      },
    ];

    setupMockForReviews({ countResult: 1, dataResult: mockReviewsWithArrays });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.reviews[0]?.user).toEqual(mockReviewsWithArrays[0]?.user[0]);
    expect(result.reviews[0]?.channel).toEqual(
      mockReviewsWithArrays[0]?.channel[0]
    );
  });

  it("should handle null count gracefully", async () => {
    // Arrange
    setupMockForReviews({ countResult: null, dataResult: [] });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("should throw error when data query fails", async () => {
    // Arrange
    setupMockForReviews({
      countResult: 10,
      dataResult: null,
      dataError: { message: "Database error" },
    });

    // Act & Assert
    await expect(getRecentReviews()).rejects.toThrow(
      "レビューの取得に失敗しました"
    );
  });

  it("should return empty reviews when count is 0", async () => {
    // Arrange
    setupMockForReviews({ countResult: 0, dataResult: [] });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.reviews).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  // --- 検索パラメータ関連テスト ---

  it("should filter by rating", async () => {
    // Arrange
    setupMockForReviews({ countResult: 5, dataResult: [] });

    // Act
    const result = await getRecentReviews({ rating: 5 });

    // Assert
    expect(result.pagination.total).toBe(5);
    expect(mockSupabase.from).toHaveBeenCalledWith("reviews");
  });

  it("should filter by keyword query", async () => {
    // Arrange
    setupMockForReviews({ countResult: 3, dataResult: [] });

    // Act
    const result = await getRecentReviews({ query: "面白い" });

    // Assert
    expect(result.pagination.total).toBe(3);
  });

  it("should filter by category", async () => {
    // Arrange
    setupMockForReviews({
      countResult: 2,
      dataResult: [],
      categoryChannels: [{ id: "ch1" }, { id: "ch2" }],
    });

    // Act
    const result = await getRecentReviews({ category: "gaming" });

    // Assert
    expect(result.pagination.total).toBe(2);
    expect(mockSupabase.from).toHaveBeenCalledWith("channels");
  });

  it("should return empty when category has no matching channels", async () => {
    // Arrange
    setupMockForReviews({
      countResult: 0,
      dataResult: [],
      categoryChannels: [],
    });

    // Act
    const result = await getRecentReviews({ category: "nonexistent" });

    // Assert
    expect(result.reviews).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("should handle combined query and category filter", async () => {
    // Arrange
    // from('channels') を2回呼ぶ: 1回目=category, 2回目=query
    let channelsCallCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        channelsCallCount++;
        const data =
          channelsCallCount === 1
            ? [{ id: "ch1" }, { id: "ch2" }, { id: "ch3" }] // category
            : [{ id: "ch2" }, { id: "ch4" }]; // query (ch2 is intersection)
        return {
          select: vi.fn(() => createFluentMock({ data, error: null })),
        };
      }
      // reviews
      const selectMock = vi.fn((_fields: string, opts?: unknown) => {
        if (opts && typeof opts === "object" && "count" in opts) {
          return createFluentMock({ data: null, error: null, count: 1 });
        }
        return createFluentMock({ data: [], error: null });
      });
      return { select: selectMock };
    });

    // Act
    const result = await getRecentReviews({ query: "test", category: "tech" });

    // Assert
    expect(result.pagination.total).toBe(1);
    // channels テーブルに2回アクセス（category + query）
    expect(channelsCallCount).toBe(2);
  });

  it("should handle helpful sort order", async () => {
    // Arrange
    setupMockForReviews({ countResult: 10, dataResult: [] });

    // Act
    const result = await getRecentReviews({ sort: "helpful" });

    // Assert
    expect(result.pagination.total).toBe(10);
  });

  it("should handle all filters combined", async () => {
    // Arrange
    let channelsCallCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        channelsCallCount++;
        const data =
          channelsCallCount === 1
            ? [{ id: "ch1" }] // category
            : [{ id: "ch1" }]; // query
        return {
          select: vi.fn(() => createFluentMock({ data, error: null })),
        };
      }
      const selectMock = vi.fn((_fields: string, opts?: unknown) => {
        if (opts && typeof opts === "object" && "count" in opts) {
          return createFluentMock({ data: null, error: null, count: 1 });
        }
        return createFluentMock({ data: [], error: null });
      });
      return { select: selectMock };
    });

    // Act
    const result = await getRecentReviews({
      page: 1,
      limit: 10,
      query: "awesome",
      sort: "helpful",
      category: "gaming",
      rating: 5,
    });

    // Assert
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });
});
