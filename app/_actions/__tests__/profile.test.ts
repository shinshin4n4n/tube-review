import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfileAction, getCurrentProfileAction } from "../profile";
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

describe("updateProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await updateProfileAction({
      displayName: "Test User",
      bio: "Test bio",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should update profile successfully", async () => {
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

    const mockUpdatedProfile = {
      id: "user-id",
      email: "test@example.com",
      username: "testuser",
      display_name: "Updated User",
      avatar_url: null,
      bio: "Updated bio",
      occupation: null,
      gender: null,
      birth_date: null,
      prefecture: null,
      website_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedProfile,
                error: null,
              })
            ),
          })),
        })),
      })),
    }));

    // Act
    const result = await updateProfileAction({
      displayName: "Updated User",
      bio: "Updated bio",
    });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockUpdatedProfile);
    }
  });

  it("should reject profile update with invalid data", async () => {
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

    // Act - displayName too long
    const result = await updateProfileAction({
      displayName: "A".repeat(51),
    });

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject profile update with invalid URL", async () => {
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
    const result = await updateProfileAction({
      displayName: "Test User",
      websiteUrl: "invalid-url",
    });

    // Assert
    expect(result.success).toBe(false);
  });

  it("should handle Supabase error (PGRST116 - permission denied)", async () => {
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
    const result = await updateProfileAction({
      displayName: "Test User",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("プロフィールを編集する権限がありません");
    }
  });
});

describe("getCurrentProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await getCurrentProfileAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should get current profile successfully", async () => {
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

    const mockProfile = {
      id: "user-id",
      email: "test@example.com",
      username: "testuser",
      display_name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
      bio: "Test bio",
      occupation: "Developer",
      gender: "prefer_not_to_say",
      birth_date: "1990-01-01",
      prefecture: "東京都",
      website_url: "https://example.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getCurrentProfileAction();

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockProfile);
    }
  });

  it("should handle Supabase error when getting profile", async () => {
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
              error: { message: "Database error" },
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await getCurrentProfileAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("プロフィールの取得に失敗しました");
    }
  });
});
