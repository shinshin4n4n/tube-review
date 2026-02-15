import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addChannelToListAction,
  removeChannelFromListAction,
} from "../list-channel";
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

describe("addChannelToListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await addChannelToListAction("list-id", "channel-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should add channel to list successfully", async () => {
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

    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    mockFrom.mockImplementation((table: string) => {
      if (table === "lists") {
        // List ownership check
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "list-id" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "list_channels") {
        // Check if channel already exists
        const selectMock = vi.fn(() => ({
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
        }));

        // Get max order_index
        const orderMock = vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { order_index: 5 },
                error: null,
              })
            ),
          })),
        }));

        return {
          select: vi.fn((columns: string) => {
            if (columns === "id") return selectMock();
            if (columns === "order_index")
              return { eq: vi.fn(() => ({ order: orderMock })) };
            return {};
          }),
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
    const result = await addChannelToListAction("list-id", "channel-id");

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject if user does not own the list", async () => {
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

    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    mockFrom.mockImplementation((table: string) => {
      if (table === "lists") {
        return {
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
        };
      }
      return {};
    });

    // Act
    const result = await addChannelToListAction("list-id", "channel-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このリストを編集する権限がありません");
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

    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    mockFrom.mockImplementation((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "list-id" },
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
                    data: { id: "existing-id" }, // Already exists
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
    const result = await addChannelToListAction("list-id", "channel-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このチャンネルは既にリストに追加されています");
    }
  });
});

describe("removeChannelFromListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await removeChannelFromListAction("list-id", "channel-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should remove channel from list successfully", async () => {
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

    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    mockFrom.mockImplementation((table: string) => {
      if (table === "lists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "list-id" },
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
    const result = await removeChannelFromListAction("list-id", "channel-id");

    // Assert
    expect(result.success).toBe(true);
  });
});
