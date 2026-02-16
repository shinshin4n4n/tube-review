# Code Examples

TubeReview プロジェクトで頻繁に使用するコードパターンの実例集です。

## Server Actions - CRUD Operations

### Create (完全な実装例)

```typescript
import { ApiResponse } from "@/lib/types/api";
import { handleApiError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation/review";
import { revalidatePath } from "next/cache";

export async function createReview(
  data: ReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // 1. バリデーション
    const validated = reviewSchema.parse(data);

    // 2. 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        "ログインが必要です",
        401
      );
    }

    // 3. データベース操作
    const supabase = await createClient();
    const { data: result, error } = await supabase
      .from("reviews")
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // 4. キャッシュ無効化
    revalidatePath(`/channels/${validated.channelId}`);

    return { success: true, data: result };
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Read (Single)

```typescript
export async function getReview(
  reviewId: string
): Promise<ApiResponse<Review>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*, user:users(id, name, avatar_url)")
      .eq("id", reviewId)
      .is("deleted_at", null)
      .single();

    if (error) throw error;
    if (!data) {
      throw new ApiError(
        API_ERROR_CODES.NOT_FOUND,
        "レビューが見つかりません",
        404
      );
    }

    return { success: true, data };
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Read (List with Pagination)

```typescript
export async function getReviews(params: {
  channelId: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ reviews: Review[]; total: number }>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // 総数取得
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", params.channelId)
      .is("deleted_at", null);

    // データ取得
    const { data, error } = await supabase
      .from("reviews")
      .select("*, user:users(id, name, avatar_url)")
      .eq("channel_id", params.channelId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        reviews: data || [],
        total: count || 0,
      },
    };
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Update

```typescript
export async function updateReview(
  reviewId: string,
  data: Partial<ReviewInput>
): Promise<ApiResponse<Review>> {
  try {
    const validated = reviewSchema.partial().parse(data);

    const user = await requireAuth();

    const supabase = await createClient();
    const { data: result, error } = await supabase
      .from("reviews")
      .update(validated)
      .eq("id", reviewId)
      .eq("user_id", user.id) // 自分のデータのみ更新
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/reviews/${reviewId}`);

    return { success: true, data: result };
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Delete (Soft Delete)

```typescript
export async function deleteReview(
  reviewId: string
): Promise<ApiResponse<void>> {
  try {
    const user = await requireAuth();

    const supabase = await createClient();
    const { error } = await supabase
      .from("reviews")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/reviews");

    return { success: true, data: undefined };
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Client Components

### Form with Loading State (完全な実装例)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReview } from '@/app/_actions/review-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ReviewForm({ channelId }: { channelId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createReview({
      channelId,
      rating,
      comment,
    })

    setLoading(false)

    if (result.success) {
      router.push(`/channels/${channelId}`)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rating" className="block text-sm font-medium">
          評価
        </label>
        <Input
          id="rating"
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium">
          コメント
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          className="w-full rounded border p-2"
        />
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? '送信中...' : '送信'}
      </Button>
    </form>
  )
}
```

### Optimistic Updates

```typescript
'use client'

import { useState, useOptimistic } from 'react'
import { likeReview } from '@/app/_actions/review-actions'

export function LikeButton({ reviewId, initialLikes }: {
  reviewId: string
  initialLikes: number
}) {
  const [likes, setLikes] = useState(initialLikes)
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (state, amount: number) => state + amount
  )

  async function handleLike() {
    addOptimisticLike(1)

    const result = await likeReview(reviewId)

    if (result.success) {
      setLikes(result.data.likes)
    } else {
      // Revert optimistic update
      addOptimisticLike(-1)
    }
  }

  return (
    <button onClick={handleLike} className="flex items-center gap-2">
      <span>👍</span>
      <span>{optimisticLikes}</span>
    </button>
  )
}
```

## API Routes

### Search API with Cache

```typescript
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error";
import { searchChannels } from "@/lib/youtube/api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const limit = Number(searchParams.get("limit")) || 10;

    if (!query) {
      return NextResponse.json(
        { error: "query parameter is required" },
        { status: 400 }
      );
    }

    // YouTube API (キャッシュ付き)
    const channels = await searchChannels(query, limit);

    return NextResponse.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
```

## Supabase Queries

### Complex Filtering

```typescript
const { data } = await supabase
  .from("reviews")
  .select("*, user:users(id, name), channel:channels(id, title)")
  .eq("channel_id", channelId)
  .gte("rating", 4)
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(10);
```

### Aggregation

```typescript
const { data } = await supabase
  .from("reviews")
  .select("rating")
  .eq("channel_id", channelId)
  .is("deleted_at", null);

const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
```

### Full-Text Search

```typescript
const { data } = await supabase
  .from("channels")
  .select("*")
  .textSearch("title", query, { type: "websearch" })
  .limit(20);
```

## YouTube API

### Search Channels

```typescript
import { searchChannels } from "@/lib/youtube/api";

// キャッシュ + レート制限付き
const channels = await searchChannels("プログラミング", 10);
```

### Get Channel Details

```typescript
import { getChannelDetails } from "@/lib/youtube/api";

const details = await getChannelDetails("UCxxxxx");
```

## Validation Schemas

### Review Schema

```typescript
import { z } from "zod";

export const reviewSchema = z.object({
  channelId: z.string().min(1, "チャンネルIDは必須です"),
  rating: z.number().min(1).max(5, "評価は1-5の範囲です"),
  comment: z.string().max(500, "コメントは500文字以内です").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
```

### User Profile Schema

```typescript
export const userProfileSchema = z.object({
  name: z.string().min(1).max(50),
  bio: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
```

## Error Handling

### Custom API Error

```typescript
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 使用例
throw new ApiError(API_ERROR_CODES.NOT_FOUND, "レビューが見つかりません", 404);
```

### Handling Supabase Errors

```typescript
import { PostgrestError } from "@supabase/supabase-js";

export function handleApiError(error: unknown): ApiResponse<never> {
  // Zod validation error
  if (error instanceof ZodError) {
    return {
      success: false,
      error: error.issues[0]?.message || "バリデーションエラー",
    };
  }

  // Custom API error
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Supabase error
  if (typeof error === "object" && error !== null && "code" in error) {
    const dbError = error as PostgrestError;
    return {
      success: false,
      error: dbError.message || "データベースエラー",
    };
  }

  // Unknown error
  return {
    success: false,
    error: "予期しないエラーが発生しました",
  };
}
```

## Cache Patterns

### Simple Cache

```typescript
import { getCachedData, setCachedData } from "@/lib/youtube/cache";

export async function getChannelWithCache(channelId: string) {
  const key = `channel:${channelId}`;

  // キャッシュチェック
  const cached = await getCachedData<ChannelDetails>(key);
  if (cached) return cached;

  // データ取得
  const data = await fetchChannelDetails(channelId);

  // キャッシュ保存（24時間TTL）
  await setCachedData(key, data, 24 * 60 * 60);

  return data;
}
```

### Cache Invalidation

```typescript
import { redis } from "@/lib/redis";

export async function invalidateChannelCache(channelId: string) {
  await redis.del(`channel:${channelId}`);
}
```

## Testing Examples

### Unit Test for Server Action

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReview } from "../review-actions";

vi.mock("@/lib/supabase/server");
vi.mock("@/lib/auth");

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a review successfully", async () => {
    const input = {
      channelId: "UC123",
      rating: 5,
      comment: "Great!",
    };

    const result = await createReview(input);

    expect(result.success).toBe(true);
  });
});
```

### E2E Test

```typescript
import { test, expect } from "@playwright/test";

test("should submit a review", async ({ page }) => {
  await page.goto("/channels/UC123");
  await page.getByLabel("評価").fill("5");
  await page.getByLabel("コメント").fill("Great channel!");
  await page.getByRole("button", { name: "送信" }).click();

  await expect(page.getByText("レビューを投稿しました")).toBeVisible();
});
```

## Useful Utilities

### Date Formatting (date-fns)

```typescript
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const timeAgo = formatDistanceToNow(new Date(createdAt), {
  addSuffix: true,
  locale: ja,
});
// "3時間前"
```

### Number Formatting (Intl.NumberFormat)

```typescript
const formatter = new Intl.NumberFormat("ja-JP", {
  notation: "compact",
  maximumFractionDigits: 1,
});

formatter.format(1234567); // "123万"
formatter.format(12345); // "1.2万"
```

### Debounced Search

```typescript
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      // 検索実行
      searchChannels(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

---

**Last Updated:** 2026-02-17
**Next Review:** 2026-08-17
**Update Triggers:**

- API 変更
- 新パターン追加
- ベストプラクティス更新
