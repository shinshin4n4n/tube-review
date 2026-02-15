import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMyListAction,
  updateMyListAction,
  deleteMyListAction,
} from "../list";
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
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
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
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
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
                  id: "list-id",
                  title: "Updated List",
                },
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
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject update if user does not own the list", async () => {
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
    const result = await updateMyListAction("list-id", {
      title: "Updated List",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("このリストを編集する権限がありません");
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
  });
});
