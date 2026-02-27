import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMyListAction,
  updateMyListAction,
  deleteMyListAction,
  getMyListsAction,
} from "../list";
import { createMockUser } from "./helpers/mock-user";

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

describe("createMyListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await createMyListAction({
      title: "Test List",
      description: "Test description",
      isPublic: true,
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should create list successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockList = {
      id: "list-id",
      title: "Test List",
      description: "Test description",
      is_public: true,
    };

    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockList,
              error: null,
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await createMyListAction({
      title: "Test List",
      description: "Test description",
      isPublic: true,
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockList);
    }
  });

  it("should reject list title longer than 50 characters", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    // Act
    const result = await createMyListAction({
      title: "A".repeat(51),
      description: "Test",
      isPublic: true,
    });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("updateMyListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await updateMyListAction("list-id", {
      title: "Updated List",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should update list successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockUpdatedList = {
      id: "list-id",
      user_id: "user-id",
      title: "Updated List",
      description: "Updated description",
      is_public: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedList,
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListAction("list-id", {
      title: "Updated List",
      description: "Updated description",
      isPublic: false,
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockUpdatedList);
    }
  });

  it("should reject update if user does not own the list (PGRST116)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
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
    const result = await updateMyListAction("list-id", {
      title: "Updated List",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このリストを編集する権限がありません");
    }
  });

  it("should handle general supabase error", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: {
                  code: "UNKNOWN",
                  message: "Database connection error",
                },
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListAction("list-id", {
      title: "Updated List",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("リストの更新に失敗しました");
    }
  });

  it("should update only title (partial update)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockUpdatedList = {
      id: "list-id",
      user_id: "user-id",
      title: "New Title Only",
      description: "Original description",
      is_public: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedList,
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListAction("list-id", {
      title: "New Title Only",
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("New Title Only");
    }
  });

  it("should update only description (partial update)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockUpdatedList = {
      id: "list-id",
      user_id: "user-id",
      title: "Original Title",
      description: "New Description Only",
      is_public: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedList,
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListAction("list-id", {
      description: "New Description Only",
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("New Description Only");
    }
  });

  it("should update only isPublic (partial update)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockUpdatedList = {
      id: "list-id",
      user_id: "user-id",
      title: "Original Title",
      description: "Original description",
      is_public: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedList,
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateMyListAction("list-id", {
      isPublic: false,
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_public).toBe(false);
    }
  });
});

describe("deleteMyListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await deleteMyListAction("list-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should delete list successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    mockSupabase.from = vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            error: null,
          })
        ),
      })),
    }));

    // Act
    const result = await deleteMyListAction("list-id");

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("should handle delete error", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    mockSupabase.from = vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            error: { code: "UNKNOWN", message: "Delete failed" },
          })
        ),
      })),
    }));

    // Act
    const result = await deleteMyListAction("list-id");

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("リストの削除に失敗しました");
    }
  });
});

describe("getMyListsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await getMyListsAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should get lists with pagination successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockLists = [
      {
        id: "list-1",
        user_id: "user-id",
        title: "List 1",
        description: "Description 1",
        is_public: true,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      },
      {
        id: "list-2",
        user_id: "user-id",
        title: "List 2",
        description: null,
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    // Mock for the data query (chained: select -> eq -> order -> range)
    const mockRange = vi.fn(() =>
      Promise.resolve({ data: mockLists, error: null })
    );
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    const mockEqData = vi.fn(() => ({ order: mockOrder }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    // Mock for the count query (chained: select -> eq)
    const mockEqCount = vi.fn(() => Promise.resolve({ count: 2, error: null }));
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    let callCount = 0;
    mockSupabase.from = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectData };
      }
      return { select: mockSelectCount };
    });

    // Act
    const result = await getMyListsAction(1, 20);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lists).toEqual(mockLists);
      expect(result.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    }
  });

  it("should handle custom page and limit parameters", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockLists = [
      {
        id: "list-3",
        user_id: "user-id",
        title: "List 3",
        description: null,
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    const mockRange = vi.fn(() =>
      Promise.resolve({ data: mockLists, error: null })
    );
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    const mockEqData = vi.fn(() => ({ order: mockOrder }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    const mockEqCount = vi.fn(() => Promise.resolve({ count: 5, error: null }));
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    let callCount = 0;
    mockSupabase.from = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectData };
      }
      return { select: mockSelectCount };
    });

    // Act
    const result = await getMyListsAction(3, 2);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pagination).toEqual({
        page: 3,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    }
  });

  it("should handle supabase error on data query", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockRange = vi.fn(() =>
      Promise.resolve({
        data: null,
        error: { code: "UNKNOWN", message: "Query failed" },
      })
    );
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    const mockEqData = vi.fn(() => ({ order: mockOrder }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    const mockEqCount = vi.fn(() => Promise.resolve({ count: 0, error: null }));
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    let callCount = 0;
    mockSupabase.from = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectData };
      }
      return { select: mockSelectCount };
    });

    // Act
    const result = await getMyListsAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("リストの取得に失敗しました");
    }
  });

  it("should handle supabase error on count query", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    const mockEqData = vi.fn(() => ({ order: mockOrder }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    const mockEqCount = vi.fn(() =>
      Promise.resolve({
        count: null,
        error: { code: "UNKNOWN", message: "Count failed" },
      })
    );
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    let callCount = 0;
    mockSupabase.from = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectData };
      }
      return { select: mockSelectCount };
    });

    // Act
    const result = await getMyListsAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("リストの取得に失敗しました");
    }
  });

  it("should return empty list when user has no lists", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    const mockUser = createMockUser({ id: "user-id" });
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    const mockEqData = vi.fn(() => ({ order: mockOrder }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    const mockEqCount = vi.fn(() => Promise.resolve({ count: 0, error: null }));
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    let callCount = 0;
    mockSupabase.from = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectData };
      }
      return { select: mockSelectCount };
    });

    // Act
    const result = await getMyListsAction();

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lists).toEqual([]);
      expect(result.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    }
  });
});
