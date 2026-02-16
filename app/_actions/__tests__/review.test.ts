import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createReviewAction,
  getChannelReviewsAction,
  updateReviewAction,
  deleteReviewAction,
  getMyReviewsAction,
} from "../review";
import { createMockUser } from "./helpers/mock-user";

// Supabase client mock
const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create review successfully with UUID channel ID", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const input = {
      channelId: "550e8400-e29b-41d4-a716-446655440000",
      rating: 5,
      title: "Great channel",
      content:
        "Excellent content with detailed analysis and comprehensive review of the channel quality",
      isSpoiler: false,
    };

    const mockReview = {
      id: "review-123",
      user_id: "user-123",
      channel_id: input.channelId,
      rating: 5,
      title: "Great channel",
      content: "Excellent content",
      is_spoiler: false,
    };

    // Mock channel existence check
    const mockChannelCheck = vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: input.channelId },
          error: null,
        })
      ),
    }));

    // Mock review insert
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: mockReview,
            error: null,
          })
        ),
      })),
    }));

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: mockChannelCheck,
          })),
        };
      }
      if (table === "reviews") {
        return {
          insert: mockInsert,
        };
      }
      return {};
    });

    // Act
    const result = await createReviewAction(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockReview);
    }
  });

  it("should create review successfully with YouTube channel ID", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const input = {
      channelId: "UC123456789",
      rating: 4,
      title: "Good channel",
      content:
        "Nice videos with great production quality and engaging content that keeps viewers interested",
      isSpoiler: false,
    };

    const dbChannelId = "550e8400-e29b-41d4-a716-446655440000";

    // Mock YouTube channel ID lookup
    const mockYouTubeChannelLookup = vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: dbChannelId },
          error: null,
        })
      ),
    }));

    // Mock review insert
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "review-123",
              user_id: "user-123",
              channel_id: dbChannelId,
              rating: 4,
              title: "Good channel",
              content:
                "Nice videos with great production quality and engaging content that keeps viewers interested",
              is_spoiler: false,
            },
            error: null,
          })
        ),
      })),
    }));

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: mockYouTubeChannelLookup,
          })),
        };
      }
      if (table === "reviews") {
        return {
          insert: mockInsert,
        };
      }
      return {};
    });

    // Act
    const result = await createReviewAction(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    const input = {
      channelId: "UC123",
      rating: 5,
      content:
        "Test content with at least fifty characters required for validation to pass successfully",
    };

    // Act
    const result = await createReviewAction(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should return error when channel not found", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const input = {
      channelId: "UC_NONEXISTENT",
      rating: 5,
      content:
        "Test content with at least fifty characters required for validation to pass successfully",
    };

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Not found" },
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await createReviewAction(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("チャンネルが見つかりません");
    }
  });

  it("should return error when duplicate review (UNIQUE violation)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const input = {
      channelId: "550e8400-e29b-41d4-a716-446655440000",
      rating: 5,
      content:
        "Test content with at least fifty characters required for validation to pass successfully",
    };

    // Mock channel check success
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: input.channelId },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "reviews") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { code: "23505" }, // UNIQUE_VIOLATION
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    // Act
    const result = await createReviewAction(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "このチャンネルにはすでにレビューを投稿しています"
      );
    }
  });

  it("should validate input with Zod schema", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const invalidInput = {
      channelId: "UC123",
      rating: 6, // Invalid: max is 5
      content: "Test",
    };

    // Act
    const result = await createReviewAction(invalidInput as never);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("getChannelReviewsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get channel reviews with pagination", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const channelId = "550e8400-e29b-41d4-a716-446655440000";
    const mockReviews = [
      {
        id: "rev1",
        user_id: "user1",
        channel_id: channelId,
        rating: 5,
        title: "Great",
        content: "Content",
        is_spoiler: false,
        helpful_count: 10,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        user: {
          id: "user1",
          username: "testuser",
          display_name: "Test User",
          avatar_url: "https://example.com/avatar.jpg",
        },
      },
    ];

    const mockCount = 25;

    // Mock channel check
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: channelId },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          // Count query
          if (options && typeof options === "object" && "count" in options) {
            return {
              eq: vi.fn(() => ({
                is: vi.fn(() =>
                  Promise.resolve({
                    count: mockCount,
                    error: null,
                  })
                ),
              })),
            };
          }
          // Data query
          return {
            eq: vi.fn(() => ({
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
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      if (table === "review_helpful") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [],
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    // Act
    const result = await getChannelReviewsAction(channelId, 1, 10);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviews).toHaveLength(1);
      expect(result.data.pagination.total).toBe(mockCount);
    }
  });

  it("should return empty array when channel not found", async () => {
    // Arrange
    const channelId = "UC_NONEXISTENT";

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Not found" },
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getChannelReviewsAction(channelId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviews).toEqual([]);
      expect(result.data.pagination.total).toBe(0);
    }
  });

  it("should filter out deleted reviews (deleted_at IS NULL)", async () => {
    // Arrange
    const channelId = "550e8400-e29b-41d4-a716-446655440000";

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
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: channelId },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          if (options && typeof options === "object" && "count" in options) {
            return {
              eq: vi.fn(() => ({
                is: vi.fn(() =>
                  Promise.resolve({
                    count: 0,
                    error: null,
                  })
                ),
              })),
            };
          }
          return {
            eq: vi.fn(() => ({
              is: mockIs,
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
    await getChannelReviewsAction(channelId);

    // Assert
    expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
  });

  it("should include user helpful votes when authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const channelId = "550e8400-e29b-41d4-a716-446655440000";
    const mockReviews = [
      {
        id: "rev1",
        user_id: "user1",
        channel_id: channelId,
        rating: 5,
        title: null,
        content: "Content",
        is_spoiler: false,
        helpful_count: 10,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        user: {
          id: "user1",
          username: "testuser",
          display_name: "Test User",
          avatar_url: null,
        },
      },
    ];

    const mockHelpfulVotes = [{ review_id: "rev1" }];

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: channelId },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string, options?: unknown) => {
          if (options && typeof options === "object" && "count" in options) {
            return {
              eq: vi.fn(() => ({
                is: vi.fn(() =>
                  Promise.resolve({
                    count: 1,
                    error: null,
                  })
                ),
              })),
            };
          }
          return {
            eq: vi.fn(() => ({
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
            })),
          };
        });

        return {
          select: selectMock,
        };
      }
      if (table === "review_helpful") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: mockHelpfulVotes,
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    // Act
    const result = await getChannelReviewsAction(channelId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviews[0]?.is_helpful).toBe(true);
    }
  });
});

describe("updateReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update review successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const reviewId = "review-123";
    const input = {
      rating: 4,
      title: "Updated title",
      content:
        "Updated content with at least fifty characters required for validation to pass successfully",
      isSpoiler: true,
    };

    const mockUpdatedReview = {
      id: reviewId,
      user_id: "user-123",
      channel_id: "channel-123",
      rating: 4,
      title: "Updated title",
      content: "Updated content",
      is_spoiler: true,
      updated_at: new Date().toISOString(),
      channel: {
        youtube_channel_id: "UC123",
      },
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedReview,
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateReviewAction(reviewId, input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rating).toBe(4);
      expect(result.data.title).toBe("Updated title");
    }
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    const input = {
      rating: 4,
      content:
        "Updated content with at least fifty characters required for validation to pass successfully",
    };

    // Act
    const result = await updateReviewAction("review-123", input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should return error when user lacks permission (RLS)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const input = {
      rating: 4,
      content:
        "Updated content with at least fifty characters required for validation to pass successfully",
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { code: "PGRST116" }, // Not found (RLS blocked)
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateReviewAction("review-123", input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このレビューを編集する権限がありません");
    }
  });
});

describe("deleteReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete review successfully (soft delete)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const reviewId = "review-123";

    // Mock review fetch
    const mockReview = {
      channel: {
        youtube_channel_id: "UC123",
      },
    };

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() =>
        Promise.resolve({
          error: null,
        })
      ),
    }));

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "reviews") {
        const selectMock = vi.fn((fields: string) => {
          if (fields.includes("channel")) {
            return {
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: mockReview,
                      error: null,
                    })
                  ),
                })),
              })),
            };
          }
          return {};
        });

        return {
          select: selectMock,
          update: mockUpdate,
        };
      }
      return {};
    });

    // Act
    const result = await deleteReviewAction(reviewId);

    // Assert
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      })
    );
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await deleteReviewAction("review-123");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should return error when user lacks permission", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: "Not found" },
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await deleteReviewAction("review-123");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このレビューを削除する権限がありません");
    }
  });
});

describe("getMyReviewsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get user's reviews with pagination", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const mockReviews = [
      {
        id: "rev1",
        user_id: "user-123",
        channel_id: "ch1",
        rating: 5,
        title: "My review",
        content: "Content",
        is_spoiler: false,
        created_at: "2024-01-01T00:00:00Z",
        user: {
          id: "user-123",
          username: "me",
          display_name: "Me",
          avatar_url: null,
        },
        channel: {
          id: "ch1",
          youtube_channel_id: "UC123",
          title: "Test Channel",
          thumbnail_url: "https://example.com/thumb.jpg",
        },
      },
    ];

    const mockCount = 10;

    mockSupabase.from = vi.fn(() => {
      const selectMock = vi.fn((fields: string, options?: unknown) => {
        // Count query
        if (options && typeof options === "object" && "count" in options) {
          return {
            eq: vi.fn(() =>
              Promise.resolve({
                count: mockCount,
                error: null,
              })
            ),
          };
        }
        // Data query
        return {
          eq: vi.fn(() => ({
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
    });

    // Act
    const result = await getMyReviewsAction(1, 20);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviews).toHaveLength(1);
      expect(result.data.pagination.total).toBe(mockCount);
    }
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await getMyReviewsAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should handle array user and channel in JOIN results", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const mockReviewsWithArrays = [
      {
        id: "rev1",
        user: [{ id: "user-123", username: "me" }],
        channel: [{ id: "ch1", youtube_channel_id: "UC123" }],
      },
    ];

    mockSupabase.from = vi.fn(() => {
      const selectMock = vi.fn((fields: string, options?: unknown) => {
        if (options && typeof options === "object" && "count" in options) {
          return {
            eq: vi.fn(() =>
              Promise.resolve({
                count: 1,
                error: null,
              })
            ),
          };
        }
        return {
          eq: vi.fn(() => ({
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
    });

    // Act
    const result = await getMyReviewsAction();

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviews[0]?.user).toEqual(
        mockReviewsWithArrays[0]?.user[0]
      );
      expect(result.data.reviews[0]?.channel).toEqual(
        mockReviewsWithArrays[0]?.channel[0]
      );
    }
  });
});
