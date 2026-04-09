import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import type { NextRequest } from "next/server";

// Mock logger to prevent console output in tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock handleApiError
vi.mock("@/lib/api/error", () => ({
  handleApiError: vi.fn((error: unknown) => ({
    success: false,
    error: error instanceof Error ? error.message : "Internal server error",
  })),
}));

// Mock Supabase route handler client
const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/route-handler", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signInWithOtp: mockSignInWithOtp,
      },
    })
  ),
}));

// Mock Next.js Request
class MockNextRequest extends Request {
  constructor(body: Record<string, unknown>) {
    super("http://localhost:3000/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

describe("POST /api/auth/magic-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
  });

  it("有効なメールアドレスでMagic Linkを送信", async () => {
    const request = new MockNextRequest({
      email: "test@example.com",
    }) as unknown as NextRequest;
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("無効なメールアドレスでエラー", async () => {
    const request = new MockNextRequest({
      email: "invalid",
    }) as unknown as NextRequest;
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error).toContain("有効なメールアドレスを入力してください");
  });

  it("メールアドレスが空の場合エラー", async () => {
    const request = new MockNextRequest({
      email: "",
    }) as unknown as NextRequest;
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("bodyが空の場合エラー", async () => {
    const request = new MockNextRequest({}) as unknown as NextRequest;
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
