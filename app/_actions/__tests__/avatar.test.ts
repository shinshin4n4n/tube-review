import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadAvatarAction, deleteAvatarAction } from "../avatar";
import { createMockUser } from "./helpers/mock-user";

// Supabase client mock
const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(),
}));

describe("uploadAvatarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload avatar successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const mockFile = new File(["test"], "avatar.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", mockFile);

    const mockPublicUrl =
      "https://example.com/storage/avatars/user-123/123.jpg";

    // Mock existing user query (no existing avatar)
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: null },
              error: null,
            })
          ),
        })),
      })),
    }));

    // Mock storage upload
    const mockUpload = vi.fn(() =>
      Promise.resolve({
        data: { path: "user-123/123.jpg" },
        error: null,
      })
    );

    const mockGetPublicUrl = vi.fn(() => ({
      data: { publicUrl: mockPublicUrl },
    }));

    mockSupabase.storage.from = vi.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: vi.fn(),
    }));

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe(mockPublicUrl);
    }
    expect(mockUpload).toHaveBeenCalled();
    expect(mockGetPublicUrl).toHaveBeenCalledWith("user-123/123.jpg");
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    const formData = new FormData();

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should return error when no file is provided", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const formData = new FormData();

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ファイルが選択されていません");
    }
  });

  it("should return error when file size exceeds 5MB", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    // Create a file larger than 5MB
    const largeFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      "large.jpg",
      {
        type: "image/jpeg",
      }
    );
    const formData = new FormData();
    formData.append("file", largeFile);

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ファイルサイズは5MB以下にしてください");
    }
  });

  it("should return error when file type is not allowed", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const invalidFile = new File(["test"], "document.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.append("file", invalidFile);

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "JPEG、PNG、GIF、WebP形式の画像のみアップロード可能です"
      );
    }
  });

  it("should allow all valid image types (jpeg, jpg, png, gif, webp)", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: null },
              error: null,
            })
          ),
        })),
      })),
    }));

    mockSupabase.storage.from = vi.fn(() => ({
      upload: vi.fn(() =>
        Promise.resolve({
          data: { path: "user-123/123.jpg" },
          error: null,
        })
      ),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: "https://example.com/avatar.jpg" },
      })),
      remove: vi.fn(),
    }));

    // Act & Assert
    for (const type of validTypes) {
      const file = new File(["test"], `avatar.${type.split("/")[1]}`, {
        type,
      });
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAvatarAction(formData);
      expect(result.success).toBe(true);
    }
  });

  it("should delete existing avatar before uploading new one", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const mockFile = new File(["test"], "avatar.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", mockFile);

    const existingAvatarUrl =
      "https://example.com/storage/v1/object/public/avatars/user-123/old.jpg";

    // Mock existing user query with existing avatar
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: existingAvatarUrl },
              error: null,
            })
          ),
        })),
      })),
    }));

    // Mock storage operations
    const mockRemove = vi.fn(() =>
      Promise.resolve({
        data: null,
        error: null,
      })
    );

    const mockUpload = vi.fn(() =>
      Promise.resolve({
        data: { path: "user-123/123.jpg" },
        error: null,
      })
    );

    mockSupabase.storage.from = vi.fn(() => ({
      upload: mockUpload,
      remove: mockRemove,
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: "https://example.com/new.jpg" },
      })),
    }));

    // Act
    await uploadAvatarAction(formData);

    // Assert
    expect(mockRemove).toHaveBeenCalledWith(["user-123/old.jpg"]);
    expect(mockUpload).toHaveBeenCalled();
  });

  it("should return error when storage upload fails", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const mockFile = new File(["test"], "avatar.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", mockFile);

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: null },
              error: null,
            })
          ),
        })),
      })),
    }));

    // Mock storage upload failure
    mockSupabase.storage.from = vi.fn(() => ({
      upload: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: { message: "Upload failed" },
        })
      ),
      remove: vi.fn(),
    }));

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("アップロードに失敗しました");
    }
  });

  it("should return error when getPublicUrl fails", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const mockFile = new File(["test"], "avatar.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", mockFile);

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: null },
              error: null,
            })
          ),
        })),
      })),
    }));

    // Mock storage operations
    mockSupabase.storage.from = vi.fn(() => ({
      upload: vi.fn(() =>
        Promise.resolve({
          data: { path: "user-123/123.jpg" },
          error: null,
        })
      ),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: null },
      })),
      remove: vi.fn(),
    }));

    // Act
    const result = await uploadAvatarAction(formData);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("画像URLの取得に失敗しました");
    }
  });
});

describe("deleteAvatarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete avatar successfully", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const existingAvatarUrl =
      "https://example.com/storage/v1/object/public/avatars/user-123/old.jpg";

    // Mock existing user query
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: { avatar_url: existingAvatarUrl },
            error: null,
          })
        ),
      })),
    }));

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() =>
        Promise.resolve({
          error: null,
        })
      ),
    }));

    mockSupabase.from = vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    }));

    // Mock storage operations
    const mockRemove = vi.fn(() =>
      Promise.resolve({
        data: null,
        error: null,
      })
    );

    mockSupabase.storage.from = vi.fn(() => ({
      remove: mockRemove,
    }));

    // Act
    const result = await deleteAvatarAction();

    // Assert
    expect(result.success).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith(["user-123/old.jpg"]);
    expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: null });
  });

  it("should return error when user is not authenticated", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const result = await deleteAvatarAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ログインが必要です");
    }
  });

  it("should succeed when no avatar exists", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    // Mock user with no avatar
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: null },
              error: null,
            })
          ),
        })),
      })),
    }));

    // Act
    const result = await deleteAvatarAction();

    // Assert
    expect(result.success).toBe(true);
  });

  it("should return error when storage deletion fails", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const existingAvatarUrl =
      "https://example.com/storage/v1/object/public/avatars/user-123/old.jpg";

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: existingAvatarUrl },
              error: null,
            })
          ),
        })),
      })),
    }));

    // Mock storage deletion failure
    mockSupabase.storage.from = vi.fn(() => ({
      remove: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: { message: "Delete failed" },
        })
      ),
    }));

    // Act
    const result = await deleteAvatarAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("画像の削除に失敗しました");
    }
  });

  it("should return error when database update fails", async () => {
    // Arrange
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(createMockUser({ id: "user-123" }));

    const existingAvatarUrl =
      "https://example.com/storage/v1/object/public/avatars/user-123/old.jpg";

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { avatar_url: existingAvatarUrl },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            error: { message: "Update failed" },
          })
        ),
      })),
    }));

    mockSupabase.storage.from = vi.fn(() => ({
      remove: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
    }));

    // Act
    const result = await deleteAvatarAction();

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("プロフィールの更新に失敗しました");
    }
  });
});
