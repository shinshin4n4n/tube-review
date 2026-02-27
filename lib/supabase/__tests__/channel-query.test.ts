import { describe, it, expect, vi, beforeEach } from "vitest";
import { findChannelDbId } from "../channel-query";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase mock を作成するヘルパー
function createMockSupabase(overrides?: {
  selectData?: { id: string } | null;
  selectError?: { message: string } | null;
}): SupabaseClient {
  const { selectData = null, selectError = null } = overrides || {};

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: selectData,
              error: selectError,
            })
          ),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

describe("findChannelDbId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should find channel by UUID", async () => {
    const channelId = "550e8400-e29b-41d4-a716-446655440000";
    const mockSupabase = createMockSupabase({
      selectData: { id: channelId },
    });

    const result = await findChannelDbId(mockSupabase, channelId);

    expect(result).toEqual({ found: true, channelDbId: channelId });
    expect(mockSupabase.from).toHaveBeenCalledWith("channels");
  });

  it("should find channel by YouTube ID", async () => {
    const youtubeChannelId = "UCXuqSBlHAE6Xw-yeJA0Tunw";
    const dbId = "550e8400-e29b-41d4-a716-446655440000";
    const mockSupabase = createMockSupabase({
      selectData: { id: dbId },
    });

    const result = await findChannelDbId(mockSupabase, youtubeChannelId);

    expect(result).toEqual({ found: true, channelDbId: dbId });
    expect(mockSupabase.from).toHaveBeenCalledWith("channels");
  });

  it("should return found:false when UUID channel not found", async () => {
    const channelId = "550e8400-e29b-41d4-a716-446655440000";
    const mockSupabase = createMockSupabase({
      selectData: null,
      selectError: { message: "Not found" },
    });

    const result = await findChannelDbId(mockSupabase, channelId);

    expect(result).toEqual({ found: false });
  });

  it("should return found:false when YouTube ID channel not found", async () => {
    const youtubeChannelId = "UCNonExistent";
    const mockSupabase = createMockSupabase({
      selectData: null,
      selectError: { message: "Not found" },
    });

    const result = await findChannelDbId(mockSupabase, youtubeChannelId);

    expect(result).toEqual({ found: false });
  });

  it("should query by id column for UUID format", async () => {
    const channelId = "550e8400-e29b-41d4-a716-446655440000";

    const mockEq = vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: channelId },
          error: null,
        })
      ),
    }));

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: mockEq,
        })),
      })),
    } as unknown as SupabaseClient;

    await findChannelDbId(mockSupabase, channelId);

    expect(mockEq).toHaveBeenCalledWith("id", channelId);
  });

  it("should query by youtube_channel_id column for non-UUID format", async () => {
    const youtubeChannelId = "UCXuqSBlHAE6Xw-yeJA0Tunw";

    const mockEq = vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "some-uuid" },
          error: null,
        })
      ),
    }));

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: mockEq,
        })),
      })),
    } as unknown as SupabaseClient;

    await findChannelDbId(mockSupabase, youtubeChannelId);

    expect(mockEq).toHaveBeenCalledWith("youtube_channel_id", youtubeChannelId);
  });
});
