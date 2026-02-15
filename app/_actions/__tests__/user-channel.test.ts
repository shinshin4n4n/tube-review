import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addToMyListAction,
  updateMyListStatusAction,
  removeFromMyListAction,
  getMyChannelStatusAction,
  getMyListAction,
} from "../user-channel";
import type { User } from "@supabase/supabase-js";

// Mock dependencies
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

vi.mock("@/lib/types/guards", () => ({
  extractYoutubeChannelId: vi.fn((channel) => {
    if (channel?.youtube_channel_id) return channel.youtube_channel_id;
    return "UCxxxxx";
  }),
}));

describe("addToMyListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await addToMyListAction({
      channelId: "UCxxxxx",
      status: "watching",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should add channel to my list successfully (YouTube ID)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    let callCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        // Channel lookup by youtube_channel_id
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: "channel-db-id" },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "user_channels") {
        callCount++;
        if (callCount === 1) {
          // First call: check existing entry
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null, // Not exists
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        } else {
          // Second call: insert new entry
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "user-channel-id",
                      user_id: "user-id",
                      channel_id: "channel-db-id",
                      status: "watching",
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
      }
      return {};
    });

    // Act
    const result = await addToMyListAction({
      channelId: "UCxxxxx",
      status: "watching",
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it("should add channel to my list successfully (UUID)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const channelUUID = "123e4567-e89b-12d3-a456-426614174000";
    let callCount = 0;

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: channelUUID },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "user_channels") {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        } else {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "user-channel-id",
                      user_id: "user-id",
                      channel_id: channelUUID,
                      status: "watching",
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
      }
      return {};
    });

    // Act
    const result = await addToMyListAction({
      channelId: channelUUID,
      status: "watching",
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject if channel not found", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

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
    const result = await addToMyListAction({
      channelId: "UCxxxxx",
      status: "watching",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("チャンネルが見つかりません");
    }
  });

  it("should reject duplicate channel addition", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    let callCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: "channel-db-id" },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "user_channels") {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "existing-id" }, // Already exists
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
      }
      return {};
    });

    // Act
    const result = await addToMyListAction({
      channelId: "UCxxxxx",
      status: "watching",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "このチャンネルは既にマイリストに追加されています"
      );
    }
  });
});

describe("updateMyListStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await updateMyListStatusAction("user-channel-id", {
      status: "watched",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should update status successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: "user-channel-id",
                  status: "watched",
                  channel: { youtube_channel_id: "UCxxxxx" },
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListStatusAction("user-channel-id", {
      status: "watched",
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject if user does not own the record", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { code: "PGRST116", message: "Not found" },
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListStatusAction("user-channel-id", {
      status: "watched",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このデータを編集する権限がありません");
    }
  });
});

describe("removeFromMyListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await removeFromMyListAction("user-channel-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should remove channel from my list successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    let callCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "user_channels") {
        callCount++;
        if (callCount === 1) {
          // First call: fetch for youtube_channel_id
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        channel: { youtube_channel_id: "UCxxxxx" },
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        } else {
          // Second call: delete
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  error: null,
                })
              ),
            })),
          };
        }
      }
      return {};
    });

    // Act
    const result = await removeFromMyListAction("user-channel-id");

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject if user does not own the record", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

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
    const result = await removeFromMyListAction("user-channel-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このデータを削除する権限がありません");
    }
  });
});

describe("getMyChannelStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await getMyChannelStatusAction("UCxxxxx");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return user channel status (YouTube ID)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    let callCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: "channel-db-id" },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "user_channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "user-channel-id",
                      status: "watching",
                    },
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
    const result = await getMyChannelStatusAction("UCxxxxx");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        id: "user-channel-id",
        status: "watching",
      });
    }
  });

  it("should return null if channel not found", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

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
    const result = await getMyChannelStatusAction("UCxxxxx");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return null if user has not added the channel", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    let callCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "channels") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: "channel-db-id" },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      if (table === "user_channels") {
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
      return {};
    });

    // Act
    const result = await getMyChannelStatusAction("UCxxxxx");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });
});

describe("getMyListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await getMyListAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should get all channels in my list", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockData = [
      {
        id: "uc1",
        user_id: "user-id",
        channel_id: "ch1",
        status: "watching",
        channel: {
          id: "ch1",
          youtube_channel_id: "UCxxxxx",
          title: "Channel 1",
        },
      },
      {
        id: "uc2",
        user_id: "user-id",
        channel_id: "ch2",
        status: "watched",
        channel: {
          id: "ch2",
          youtube_channel_id: "UCyyyyy",
          title: "Channel 2",
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
    const result = await getMyListAction();

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it("should filter by status", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockData = [
      {
        id: "uc1",
        user_id: "user-id",
        channel_id: "ch1",
        status: "watching",
        channel: {
          id: "ch1",
          youtube_channel_id: "UCxxxxx",
          title: "Channel 1",
        },
      },
    ];

    // Create a fully chainable query mock
    const createQueryChain = () => {
      const chain: any = {
        then: (resolve: any) => resolve({ data: mockData, error: null }),
      };
      chain.eq = vi.fn(() => chain);
      chain.order = vi.fn(() => chain);
      return chain;
    };

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => createQueryChain()),
        })),
      })),
    }));

    // Act
    const result = await getMyListAction("watching");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.status).toBe("watching");
    }
  });
});
