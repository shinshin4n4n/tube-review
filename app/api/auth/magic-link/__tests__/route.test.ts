import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

// Mock Next.js Request
class MockNextRequest extends Request {
  constructor(body: any) {
    super('http://localhost:3000/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}

describe('POST /api/auth/magic-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有効なメールアドレスでMagic Linkを送信', async () => {
    const request = new MockNextRequest({ email: 'test@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('無効なメールアドレスでエラー', async () => {
    const request = new MockNextRequest({ email: 'invalid' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('有効なメールアドレスを入力してください');
  });

  it('メールアドレスが空の場合エラー', async () => {
    const request = new MockNextRequest({ email: '' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('bodyが空の場合エラー', async () => {
    const request = new MockNextRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
