import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addChannelToListAction,
  removeChannelFromListAction,
  getListChannelsAction,
  searchChannelsForListAction,
} from "../list-channel";
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

vi.mock("@/lib/youtube/api", () => ({
  searchChannels: vi.fn(),
  getChannelDetails: vi.fn(),
}));

// ---------- addChannelToListAction ----------

describe("addChannelToListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add channel to list successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const listId = "list-001";
    const channelId = "channel-001";

    let fromCallCount = 0;

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: listId },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        fromCallCount++;
        // First call: duplicate check
        if (fromCallCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: { code: "PGRST116" },
                    })
                  ),
                })),
              })),
            })),
          };
        }
        // Second call: max order_index
        if (fromCallCount === 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn(() =>
                      Promise.resolve({
                        data: { order_index: 3 },
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            })),
          };
        }
        // Third call: insert
        return {
          insert: vi.fn(() =>
            Promise.resolve({
              error: null,
            })
          ),
        };
      }
      return {};
    });

    // Act
    const result = await addChannelToListAction(listId, channelId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await addChannelToListAction("list-001", "channel-001");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should return error when list not found or user lacks permission", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { code: "PGRST116", message: "Not found" },
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
    const result = await addChannelToListAction("list-999", "channel-001");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このリストを編集する権限がありません");
    }
  });

  it("should return error when channel is already in list (duplicate)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const listId = "list-001";
    const channelId = "channel-001";

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: listId },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "existing-entry" },
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
    const result = await addChannelToListAction(listId, channelId);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このチャンネルは既にリストに追加されています");
    }
  });

  it("should return error when insert fails", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const listId = "list-001";
    const channelId = "channel-001";

    let fromCallCount = 0;

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: listId },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        fromCallCount++;
        // First call: duplicate check - no existing
        if (fromCallCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: { code: "PGRST116" },
                    })
                  ),
                })),
              })),
            })),
          };
        }
        // Second call: max order_index
        if (fromCallCount === 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn(() =>
                      Promise.resolve({
                        data: null,
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            })),
          };
        }
        // Third call: insert fails
        return {
          insert: vi.fn(() =>
            Promise.resolve({
              error: { message: "Insert failed", code: "23503" },
            })
          ),
        };
      }
      return {};
    });

    // Act
    const result = await addChannelToListAction(listId, channelId);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("チャンネルの追加に失敗しました");
    }
  });

  it("should use order_index 1 when no existing channels in list", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const listId = "list-001";
    const channelId = "channel-001";

    let fromCallCount = 0;
    const mockInsert = vi.fn(() =>
      Promise.resolve({
        error: null,
      })
    );

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: listId },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        fromCallCount++;
        // First call: duplicate check - no existing
        if (fromCallCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: { code: "PGRST116" },
                    })
                  ),
                })),
              })),
            })),
          };
        }
        // Second call: max order_index - empty list returns null
        if (fromCallCount === 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn(() =>
                      Promise.resolve({
                        data: null,
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            })),
          };
        }
        // Third call: insert with order_index = 1
        return {
          insert: mockInsert,
        };
      }
      return {};
    });

    // Act
    const result = await addChannelToListAction(listId, channelId);

    // Assert
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        list_id: listId,
        channel_id: channelId,
        order_index: 1,
      })
    );
  });
});

// ---------- removeChannelFromListAction ----------

describe("removeChannelFromListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove channel from list successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const listId = "list-001";
    const channelId = "channel-001";

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: listId },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
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
    const result = await removeChannelFromListAction(listId, channelId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await removeChannelFromListAction("list-001", "channel-001");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should return error when list not found or user lacks permission", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { code: "PGRST116", message: "Not found" },
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
    const result = await removeChannelFromListAction("list-999", "channel-001");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このリストを編集する権限がありません");
    }
  });

  it("should return error when delete operation fails", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const listId = "list-001";
    const channelId = "channel-001";

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: listId },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  error: { message: "Delete failed" },
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    // Act
    const result = await removeChannelFromListAction(listId, channelId);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("チャンネルの削除に失敗しました");
    }
  });
});

// ---------- getListChannelsAction ----------

describe("getListChannelsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get list channels successfully with data", async () => {
    // Arrange
    const listId = "list-001";
    const mockData = [
      {
        id: "lc-001",
        order_index: 1,
        created_at: "2024-01-01T00:00:00Z",
        channel: {
          id: "ch-001",
          youtube_channel_id: "UC123",
          title: "Test Channel",
          description: "A test channel",
          thumbnail_url: "https://example.com/thumb.jpg",
          subscriber_count: 10000,
          video_count: 100,
        },
      },
      {
        id: "lc-002",
        order_index: 2,
        created_at: "2024-01-02T00:00:00Z",
        channel: {
          id: "ch-002",
          youtube_channel_id: "UC456",
          title: "Another Channel",
          description: null,
          thumbnail_url: "https://example.com/thumb2.jpg",
          subscriber_count: 5000,
          video_count: 50,
        },
      },
    ];

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: mockData,
              error: null,
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getListChannelsAction(listId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.channel.title).toBe("Test Channel");
      expect(result.data[1]?.channel.title).toBe("Another Channel");
    }
  });

  it("should return empty array when list has no channels", async () => {
    // Arrange
    const listId = "list-001";

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getListChannelsAction(listId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("should return error when query fails", async () => {
    // Arrange
    const listId = "list-001";

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Query failed" },
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getListChannelsAction(listId);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("チャンネル一覧の取得に失敗しました");
    }
  });

  it("should handle array channel in JOIN results", async () => {
    // Arrange
    const listId = "list-001";
    const mockData = [
      {
        id: "lc-001",
        order_index: 1,
        created_at: "2024-01-01T00:00:00Z",
        channel: [
          {
            id: "ch-001",
            youtube_channel_id: "UC123",
            title: "Array Channel",
            description: "desc",
            thumbnail_url: "https://example.com/thumb.jpg",
            subscriber_count: 10000,
            video_count: 100,
          },
        ],
      },
    ];

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: mockData,
              error: null,
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getListChannelsAction(listId);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.channel.title).toBe("Array Channel");
      expect(Array.isArray(result.data[0]?.channel)).toBe(false);
    }
  });
});

// ---------- searchChannelsForListAction ----------

describe("searchChannelsForListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should search channels and upsert to database successfully", async () => {
    // Arrange
    const { searchChannels, getChannelDetails } =
      await import("@/lib/youtube/api");

    const mockYoutubeResults = [
      {
        youtubeChannelId: "UC111",
        title: "Channel One",
        description: "First channel",
        thumbnailUrl: "https://example.com/thumb1.jpg",
      },
      {
        youtubeChannelId: "UC222",
        title: "Channel Two",
        description: "Second channel",
        thumbnailUrl: "https://example.com/thumb2.jpg",
      },
    ];

    vi.mocked(searchChannels).mockResolvedValue(mockYoutubeResults);

    vi.mocked(getChannelDetails)
      .mockResolvedValueOnce({
        youtubeChannelId: "UC111",
        title: "Channel One",
        description: "First channel",
        thumbnailUrl: "https://example.com/thumb1.jpg",
        subscriberCount: 50000,
        videoCount: 200,
        viewCount: 1000000,
      })
      .mockResolvedValueOnce({
        youtubeChannelId: "UC222",
        title: "Channel Two",
        description: "Second channel",
        thumbnailUrl: "https://example.com/thumb2.jpg",
        subscriberCount: 30000,
        videoCount: 100,
        viewCount: 500000,
      });

    const upsertedChannels = [
      {
        id: "db-ch-001",
        youtube_channel_id: "UC111",
        title: "Channel One",
        thumbnail_url: "https://example.com/thumb1.jpg",
        subscriber_count: 50000,
      },
      {
        id: "db-ch-002",
        youtube_channel_id: "UC222",
        title: "Channel Two",
        thumbnail_url: "https://example.com/thumb2.jpg",
        subscriber_count: 30000,
      },
    ];

    let upsertCallCount = 0;

    mockSupabase.from = vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            const channel = upsertedChannels[upsertCallCount];
            upsertCallCount++;
            return Promise.resolve({
              data: channel,
              error: null,
            });
          }),
        })),
      })),
    }));

    // Act
    const result = await searchChannelsForListAction("test query");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.youtube_channel_id).toBe("UC111");
      expect(result.data[1]?.youtube_channel_id).toBe("UC222");
    }
    expect(searchChannels).toHaveBeenCalledWith("test query", 10);
  });

  it("should return empty array when no YouTube results found", async () => {
    // Arrange
    const { searchChannels } = await import("@/lib/youtube/api");
    vi.mocked(searchChannels).mockResolvedValue([]);

    // Act
    const result = await searchChannelsForListAction("nonexistent channel xyz");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("should skip individual channels on upsert error and continue", async () => {
    // Arrange
    const { searchChannels, getChannelDetails } =
      await import("@/lib/youtube/api");

    const mockYoutubeResults = [
      {
        youtubeChannelId: "UC111",
        title: "Channel One",
        description: "First",
        thumbnailUrl: "https://example.com/thumb1.jpg",
      },
      {
        youtubeChannelId: "UC222",
        title: "Channel Two",
        description: "Second",
        thumbnailUrl: "https://example.com/thumb2.jpg",
      },
      {
        youtubeChannelId: "UC333",
        title: "Channel Three",
        description: "Third",
        thumbnailUrl: "https://example.com/thumb3.jpg",
      },
    ];

    vi.mocked(searchChannels).mockResolvedValue(mockYoutubeResults);

    vi.mocked(getChannelDetails)
      .mockResolvedValueOnce({
        youtubeChannelId: "UC111",
        title: "Channel One",
        description: "First",
        thumbnailUrl: "https://example.com/thumb1.jpg",
        subscriberCount: 50000,
        videoCount: 200,
        viewCount: 1000000,
      })
      .mockResolvedValueOnce({
        youtubeChannelId: "UC222",
        title: "Channel Two",
        description: "Second",
        thumbnailUrl: "https://example.com/thumb2.jpg",
        subscriberCount: 30000,
        videoCount: 100,
        viewCount: 500000,
      })
      .mockResolvedValueOnce({
        youtubeChannelId: "UC333",
        title: "Channel Three",
        description: "Third",
        thumbnailUrl: "https://example.com/thumb3.jpg",
        subscriberCount: 20000,
        videoCount: 50,
        viewCount: 250000,
      });

    let upsertCallCount = 0;

    mockSupabase.from = vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            upsertCallCount++;
            // Second channel upsert fails
            if (upsertCallCount === 2) {
              return Promise.resolve({
                data: null,
                error: { message: "Upsert failed", code: "23505" },
              });
            }
            if (upsertCallCount === 1) {
              return Promise.resolve({
                data: {
                  id: "db-ch-001",
                  youtube_channel_id: "UC111",
                  title: "Channel One",
                  thumbnail_url: "https://example.com/thumb1.jpg",
                  subscriber_count: 50000,
                },
                error: null,
              });
            }
            // Third succeeds
            return Promise.resolve({
              data: {
                id: "db-ch-003",
                youtube_channel_id: "UC333",
                title: "Channel Three",
                thumbnail_url: "https://example.com/thumb3.jpg",
                subscriber_count: 20000,
              },
              error: null,
            });
          }),
        })),
      })),
    }));

    // Act
    const result = await searchChannelsForListAction("test query");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.youtube_channel_id).toBe("UC111");
      expect(result.data[1]?.youtube_channel_id).toBe("UC333");
    }
  });

  it("should return quota exceeded error when YouTube API quota is exhausted", async () => {
    // Arrange
    const { searchChannels } = await import("@/lib/youtube/api");
    vi.mocked(searchChannels).mockRejectedValue({ code: "QUOTA_EXCEEDED" });

    // Act
    const result = await searchChannelsForListAction("test query");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "YouTube APIのクォータを超過しました。しばらくしてから再度お試しください。"
      );
    }
  });

  it("should return rate limit error when too many requests", async () => {
    // Arrange
    const { searchChannels } = await import("@/lib/youtube/api");
    vi.mocked(searchChannels).mockRejectedValue({ code: "RATE_LIMIT" });

    // Act
    const result = await searchChannelsForListAction("test query");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "リクエスト制限に達しました。しばらくしてから再度お試しください。"
      );
    }
  });
});
