import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchUserHelpfulVotes,
  transformReviewsWithUser,
} from "../review-helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("fetchUserHelpfulVotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty set for empty reviewIds", async () => {
    const mockSupabase = {} as SupabaseClient;

    const result = await fetchUserHelpfulVotes(mockSupabase, "user-1", []);

    expect(result).toEqual(new Set());
  });

  it("should return set of voted review IDs", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [{ review_id: "rev-1" }, { review_id: "rev-3" }],
                error: null,
              })
            ),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await fetchUserHelpfulVotes(mockSupabase, "user-1", [
      "rev-1",
      "rev-2",
      "rev-3",
    ]);

    expect(result).toEqual(new Set(["rev-1", "rev-3"]));
    expect(result.has("rev-1")).toBe(true);
    expect(result.has("rev-2")).toBe(false);
    expect(result.has("rev-3")).toBe(true);
  });

  it("should return empty set when helpfulData is null", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: "Error" },
              })
            ),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await fetchUserHelpfulVotes(mockSupabase, "user-1", [
      "rev-1",
    ]);

    expect(result).toEqual(new Set());
  });

  it("should query review_helpful table with correct parameters", async () => {
    const mockEq = vi.fn(() =>
      Promise.resolve({
        data: [],
        error: null,
      })
    );

    const mockIn = vi.fn(() => ({
      eq: mockEq,
    }));

    const mockSelect = vi.fn(() => ({
      in: mockIn,
    }));

    const mockSupabase = {
      from: vi.fn(() => ({
        select: mockSelect,
      })),
    } as unknown as SupabaseClient;

    await fetchUserHelpfulVotes(mockSupabase, "user-123", ["rev-1", "rev-2"]);

    expect(mockSupabase.from).toHaveBeenCalledWith("review_helpful");
    expect(mockSelect).toHaveBeenCalledWith("review_id");
    expect(mockIn).toHaveBeenCalledWith("review_id", ["rev-1", "rev-2"]);
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
  });
});

describe("transformReviewsWithUser", () => {
  it("should transform reviews with single user object", () => {
    const reviews = [
      {
        id: "rev-1",
        user_id: "user-1",
        channel_id: "ch-1",
        rating: 5,
        title: "Great",
        content: "Excellent",
        is_spoiler: false,
        helpful_count: 10,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        user: {
          id: "user-1",
          username: "testuser",
          display_name: "Test User",
          avatar_url: "https://example.com/avatar.jpg",
        },
      },
    ];

    const result = transformReviewsWithUser(reviews, new Set(["rev-1"]));

    expect(result).toHaveLength(1);
    expect(result[0]?.user.username).toBe("testuser");
    expect(result[0]?.is_helpful).toBe(true);
  });

  it("should transform reviews with array user (Supabase JOIN result)", () => {
    const reviews = [
      {
        id: "rev-1",
        user_id: "user-1",
        channel_id: "ch-1",
        rating: 4,
        title: null,
        content: "Good",
        is_spoiler: false,
        helpful_count: 5,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        user: [
          {
            id: "user-1",
            username: "arrayuser",
            display_name: "Array User",
            avatar_url: null,
          },
        ],
      },
    ];

    const result = transformReviewsWithUser(reviews, new Set());

    expect(result).toHaveLength(1);
    expect(result[0]?.user.username).toBe("arrayuser");
    expect(result[0]?.is_helpful).toBe(false);
  });

  it("should set is_helpful based on userHelpfulVotes", () => {
    const reviews = [
      {
        id: "rev-1",
        user: { id: "u1", username: "a", display_name: null, avatar_url: null },
      },
      {
        id: "rev-2",
        user: { id: "u2", username: "b", display_name: null, avatar_url: null },
      },
      {
        id: "rev-3",
        user: { id: "u3", username: "c", display_name: null, avatar_url: null },
      },
    ] as Array<{
      id: string;
      user: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      };
    }>;

    const votes = new Set(["rev-1", "rev-3"]);
    const result = transformReviewsWithUser(reviews, votes);

    expect(result[0]?.is_helpful).toBe(true);
    expect(result[1]?.is_helpful).toBe(false);
    expect(result[2]?.is_helpful).toBe(true);
  });

  it("should return empty array for empty reviews", () => {
    const result = transformReviewsWithUser([], new Set());
    expect(result).toEqual([]);
  });
});
