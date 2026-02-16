# Architecture Patterns

このドキュメントは、TubeReview プロジェクトのアーキテクチャパターンの詳細を記載します。

## Server Actions

### 配置ルール

- **Location**: `app/_actions/{domain}.ts`
- **Naming**: `{verb}{Noun}` (例: `createReview`, `updateUserProfile`)
- **Export**: named export を使用

### 戻り値型

**必ず `ApiResponse<T>` を返す:**

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### パターンテンプレート

```typescript
import { ApiResponse } from "@/lib/types/api";
import { handleApiError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
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
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    // 4. revalidatePath
    revalidatePath("/channels/[id]");

    return { success: true, data: result };
  } catch (error) {
    return handleApiError(error);
  }
}
```

## API Routes

### 配置ルール

- **Location**: `app/api/{endpoint}/route.ts`
- **Export**: `GET`, `POST`, `PUT`, `DELETE` 関数を export

### パターンテンプレート

#### GET Example

```typescript
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    // バリデーション
    if (!query) {
      return NextResponse.json(
        { error: "query parameter is required" },
        { status: 400 }
      );
    }

    // 処理...
    const data = await fetchData(query);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
```

#### POST Example

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message },
        { status: 400 }
      );
    }

    // 処理...
    const data = await processData(result.data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
```

## Database Patterns

### Row Level Security (RLS)

#### User Data Policy

```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can access own data"
ON reviews
FOR ALL
USING (auth.uid() = user_id);
```

#### Public Data Policy

```sql
-- 公開データは誰でも閲覧可能
CREATE POLICY "Public reviews are viewable"
ON reviews
FOR SELECT
USING (deleted_at IS NULL);
```

### Soft Delete パターン

```typescript
// 論理削除
const { error } = await supabase
  .from("reviews")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", reviewId);

// 削除されていないデータのみ取得
const { data } = await supabase
  .from("reviews")
  .select("*")
  .is("deleted_at", null);
```

### Materialized Views

#### channel_stats_mv

チャンネル統計情報を高速に取得するためのマテリアライズドビュー:

```sql
CREATE MATERIALIZED VIEW channel_stats_mv AS
SELECT
  c.id,
  COUNT(r.id) as review_count,
  AVG(r.rating) as avg_rating
FROM channels c
LEFT JOIN reviews r ON c.id = r.channel_id
WHERE r.deleted_at IS NULL
GROUP BY c.id;
```

**リフレッシュ:**

- GitHub Actions (6h cron) で自動更新
- スクリプト: `scripts/refresh-materialized-views.ts`

## Client Components

### 使用タイミング

- インタラクティブな UI（ボタンクリック、フォーム入力）
- ブラウザAPI使用（localStorage, window など）
- React hooks 使用（useState, useEffect など）

### パターン例

```typescript
'use client'

import { useState } from 'react'
import { createReview } from '@/app/_actions/review-actions'

export function ReviewForm({ channelId }: { channelId: string }) {
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createReview({ channelId, rating })

    if (result.success) {
      // 成功処理
    } else {
      // エラー処理
      alert(result.error)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  )
}
```

## Cache Strategy

### YouTube API Cache (2-tier)

#### Memory Cache + Redis Cache

```typescript
import { getCachedData, setCachedData } from "@/lib/youtube/cache";

export async function getChannelDetails(channelId: string) {
  // 1. キャッシュチェック
  const cached = await getCachedData<ChannelDetails>(`channel:${channelId}`);
  if (cached) return cached;

  // 2. YouTube API呼び出し
  const data = await fetchFromYouTube(channelId);

  // 3. キャッシュ保存（24時間TTL）
  await setCachedData(`channel:${channelId}`, data, 24 * 60 * 60);

  return data;
}
```

**キャッシュ階層:**

1. メモリキャッシュ（高速、短期）
2. Redis キャッシュ（永続、長期）

## File Structure

```
app/
├── _actions/            # Server Actions
│   ├── review-actions.ts
│   ├── channel-actions.ts
│   └── user-actions.ts
├── _components/         # Shared components
│   ├── Header.tsx
│   └── Footer.tsx
├── api/                 # API Routes
│   ├── search/
│   │   └── route.ts
│   └── channels/
│       └── route.ts
└── (routes)/            # Page routes
    ├── page.tsx
    ├── channels/
    └── reviews/

components/              # Reusable UI components
├── ui/                  # shadcn/ui components
│   ├── button.tsx
│   └── input.tsx
└── ReviewCard.tsx

lib/                     # Utilities & libraries
├── api/                 # API helpers
│   ├── error.ts
│   └── response.ts
├── supabase/            # Supabase clients
│   ├── server.ts
│   └── client.ts
├── youtube/             # YouTube API client
│   ├── api.ts
│   └── cache.ts
├── types/               # Type definitions
│   └── api.ts
└── validation/          # Zod schemas
    └── review.ts
```

## Data Flow

### Server Component → Server Action

```
Server Component
  ↓ (import)
Server Action
  ↓ (database query)
Supabase
  ↓ (return data)
Server Action
  ↓ (return ApiResponse<T>)
Server Component (render)
```

### Client Component → Server Action

```
Client Component
  ↓ (user interaction)
Event Handler
  ↓ (call Server Action)
Server Action
  ↓ (database query)
Supabase
  ↓ (return data)
Server Action
  ↓ (return ApiResponse<T>)
Client Component (setState, render)
```

### External API Call

```
Server Action
  ↓ (check cache)
Cache (Redis)
  ↓ (miss)
YouTube API
  ↓ (fetch data)
Cache (save)
  ↓ (return)
Server Action
  ↓ (return ApiResponse<T>)
Component
```

## Error Handling Flow

```
Try Block
  ↓ (error occurs)
Catch Block
  ↓ (call handleApiError)
handleApiError()
  ↓ (analyze error type)
  ├─ ZodError → validation error message
  ├─ ApiError → custom error message
  ├─ PostgrestError → database error message
  └─ Unknown → generic error message
  ↓ (return)
ApiResponse<T> { success: false, error: string }
```

---

**Last Updated:** 2026-02-17
**Next Review:** 2026-08-17
**Update Triggers:**

- アーキテクチャパターン変更
- データベーススキーマ大幅変更
- 新しいキャッシュ戦略導入
