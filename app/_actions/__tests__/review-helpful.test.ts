import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleHelpfulAction } from '../review';

// Supabase と auth をモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}));

describe('toggleHelpfulAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    const { getUser } = await import('@/lib/auth');
    vi.mocked(getUser).mockResolvedValue(null);

    const result = await toggleHelpfulAction('test-review-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('ログインが必要です');
  });

  it('should add vote when not voted yet', async () => {
    const { getUser } = await import('@/lib/auth');
    const { createClient } = await import('@/lib/supabase/server');

    const mockUser = { id: 'user-id', email: 'test@example.com' };
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({
                    data: null, // まだ投票していない
                    error: null,
                  })),
                })),
              })),
            })),
            insert: vi.fn(() => Promise.resolve({
              error: null,
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                count: 1,
                error: null,
              })),
            })),
          };
        } else if (table === 'reviews') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                error: null,
              })),
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    channel: { youtube_channel_id: 'test-channel-id' },
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>);

    const result = await toggleHelpfulAction('test-review-id');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isHelpful).toBe(true);
    }
  });

  it('should remove vote when already voted', async () => {
    const { getUser } = await import('@/lib/auth');
    const { createClient } = await import('@/lib/supabase/server');

    const mockUser = { id: 'user-id', email: 'test@example.com' };
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({
                    data: { review_id: 'test-review-id', user_id: 'user-id' }, // 既に投票済み
                    error: null,
                  })),
                })),
                head: vi.fn(() => Promise.resolve({
                  count: 0,
                  error: null,
                })),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({
                  error: null,
                })),
              })),
            })),
          };
        } else if (table === 'reviews') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                error: null,
              })),
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    channel: { youtube_channel_id: 'test-channel-id' },
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>);

    const result = await toggleHelpfulAction('test-review-id');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isHelpful).toBe(false);
    }
  });

  it('should handle database errors', async () => {
    const { getUser } = await import('@/lib/auth');
    const { createClient } = await import('@/lib/supabase/server');

    const mockUser = { id: 'user-id', email: 'test@example.com' };
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({
                data: null,
                error: { message: 'Database error', code: 'DB_ERROR' },
              })),
            })),
          })),
        })),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>);

    const result = await toggleHelpfulAction('test-review-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('投票状態の確認に失敗しました');
  });
});
