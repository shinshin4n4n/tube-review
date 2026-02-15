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
      {
        id: "ch2",
        youtube_channel_id: "UC456",
        title: "Second Channel",
        description: "Description 2",
        thumbnail_url: "https://example.com/thumb2.jpg",
        subscriber_count: 50000,
        review_count: 30,
        average_rating: 4.5,
        recent_review_count: 15,
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
      Promise.resolve({
        data: mockChannels,
        error: null,
      })
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

  it("should filter channels with recent_review_count >= 1", async () => {
    // Arrange
    const mockGte = vi.fn(() => ({
      order: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
    }));

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: mockGte,
        })),
      })),
    }));

    // Act
    await getRankingChannels();

    // Assert
    expect(mockGte).toHaveBeenCalledWith("recent_review_count", 1);
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
                  Promise.resolve({
                    data: null,
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
    expect(result).toEqual([]);
  });

  it("should throw error when database query fails", async () => {
    // Arrange
    const mockError = { message: "Database error", code: "ERROR" };

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: mockError,
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

describe("getRecentReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return recent reviews with default pagination", async () => {
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
        },
      },
    ];

    const mockCount = 25;

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: mockCount,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockReviews,
                    error: null,
                  })
                ),
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.reviews).toEqual(mockReviews);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: mockCount,
      totalPages: 2,
    });
  });

  it("should return recent reviews with custom pagination", async () => {
    // Arrange
    const customPage = 2;
    const customLimit = 10;
    const mockCount = 25;
    const expectedOffset = (customPage - 1) * customLimit;

    const mockRange = vi.fn(() =>
      Promise.resolve({
        data: [],
        error: null,
      })
    );

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: mockCount,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: mockRange,
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    await getRecentReviews(customPage, customLimit);

    // Assert
    expect(mockRange).toHaveBeenCalledWith(
      expectedOffset,
      expectedOffset + customLimit - 1
    );
  });

  it("should filter out deleted reviews (deleted_at IS NULL)", async () => {
    // Arrange
    const mockIs = vi.fn(() => ({
      order: vi.fn(() => ({
        range: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      })),
    }));

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: 0,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: mockIs,
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    await getRecentReviews();

    // Assert
    expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
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
        created_at: "2024-01-01T00:00:00Z",
        user: [
          {
            id: "user1",
            username: "testuser",
            display_name: "Test User",
            avatar_url: "https://example.com/avatar.jpg",
          },
        ],
        channel: [
          {
            id: "ch1",
            youtube_channel_id: "UC123",
            title: "Test Channel",
            thumbnail_url: "https://example.com/thumb.jpg",
          },
        ],
      },
    ];

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: 1,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockReviewsWithArrays,
                    error: null,
                  })
                ),
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.reviews[0]?.user).toEqual(mockReviewsWithArrays[0]?.user[0]);
    expect(result.reviews[0]?.channel).toEqual(
      mockReviewsWithArrays[0]?.channel[0]
    );
  });

  it("should calculate pagination correctly", async () => {
    // Arrange
    const mockCount = 47;
    const limit = 20;
    const expectedTotalPages = Math.ceil(mockCount / limit); // 3

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: mockCount,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    const result = await getRecentReviews(1, limit);

    // Assert
    expect(result.pagination.totalPages).toBe(expectedTotalPages);
  });

  it("should handle null count gracefully", async () => {
    // Arrange
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query returns null
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: null, // Count is null but no error
                  error: null,
                })
              ),
            };
          }
          // Data query succeeds
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.pagination.total).toBe(0); // null count is treated as 0
  });

  it("should throw error when data query fails", async () => {
    // Arrange
    const mockError = { message: "Database error", code: "ERROR" };

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: 10,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: mockError,
                  })
                ),
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act & Assert
    await expect(getRecentReviews()).rejects.toThrow(
      "新着レビューの取得に失敗しました"
    );
  });

  it("should return empty reviews array when count is 0", async () => {
    // Arrange
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              is: vi.fn(() =>
                Promise.resolve({
                  count: 0,
                  error: null,
                })
              ),
            };
          }
          // Data query
          return {
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      return {};
    });

    // Act
    const result = await getRecentReviews();

    // Assert
    expect(result.reviews).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});
