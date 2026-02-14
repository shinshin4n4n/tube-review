# API設計

> **参照Skill**: `backend-development` (ClaudeKit) - REST API設計、認証、セキュリティ

## 設計方針

### アーキテクチャ選択

ちゅぶれびゅ！は**Next.js App Router**を採用するため、従来のREST API Routesではなく**Server Actions**を主軸とします。

| アプローチ | 用途 | 採用 |
|-----------|------|------|
| **Server Actions** | データ変更（POST, PUT, DELETE） | ✅ 主軸 |
| **Server Components** | データ取得（GET） | ✅ 主軸 |
| **API Routes** | 外部Webhook、公開API | △ 最小限 |
| **GraphQL** | - | ❌ 不採用 |

### 設計原則（backend-development準拠）

1. **型安全性**: TypeScript + Zodでランタイム検証
2. **セキュリティファースト**: 認証・認可を全エンドポイントで実施
3. **エラーハンドリング**: 統一されたエラーレスポンス
4. **レート制限**: YouTube API保護、DDoS対策
5. **キャッシュ戦略**: 適切なデータフェッチング最適化

---

## データフェッチング戦略

### 1. Server Components（GET操作）

**用途**: データ読み取り専用

```typescript
// app/channels/[id]/page.tsx
export default async function ChannelPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // サーバー側で直接Supabaseにアクセス
  const { data: channel } = await supabase
    .from('channels')
    .select(`
      *,
      stats:channel_stats(*)
    `)
    .eq('id', params.id)
    .single();
  
  if (!channel) notFound();
  
  return <ChannelDetail channel={channel} />;
}
```

**メリット**:
- サーバー側で実行（セキュア）
- RLSポリシー適用
- SEO対応
- API Routes不要

---

### 2. Server Actions（POST/PUT/DELETE操作）

**用途**: データ変更操作

#### ファイル構成

```
app/
└── _actions/
    ├── channel.ts      # チャンネル関連
    ├── review.ts       # レビュー関連
    ├── user.ts         # ユーザー関連
    └── list.ts         # リスト関連
```

#### 実装例: レビュー投稿

**ファイル**: `app/_actions/review.ts`

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

// バリデーションスキーマ
const createReviewSchema = z.object({
  channelId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(10).max(5000),
  isSpoiler: z.boolean().default(false),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export async function createReview(input: CreateReviewInput) {
  try {
    // 1. バリデーション
    const validated = createReviewSchema.parse(input);
    
    // 2. 認証チェック
    const user = await getUser();
    if (!user) {
      return { 
        success: false, 
        error: 'Unauthorized' 
      };
    }
    
    // 3. Supabase操作
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        channel_id: validated.channelId,
        rating: validated.rating,
        title: validated.title,
        content: validated.content,
        is_spoiler: validated.isSpoiler,
      })
      .select()
      .single();
    
    if (error) {
      // 重複チェック（UNIQUE制約違反）
      if (error.code === '23505') {
        return {
          success: false,
          error: 'You have already reviewed this channel',
        };
      }
      
      throw error;
    }
    
    // 4. キャッシュ無効化
    revalidatePath(`/channels/${validated.channelId}`);
    revalidatePath('/my-list');
    
    return { 
      success: true, 
      data 
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        details: error.errors,
      };
    }
    
    console.error('createReview error:', error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}
```

#### クライアント側での使用

```typescript
'use client';

import { createReview } from '@/app/_actions/review';
import { useState } from 'react';

export function ReviewForm({ channelId }: { channelId: string }) {
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    
    const result = await createReview({
      channelId,
      rating: Number(formData.get('rating')),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      isSpoiler: formData.get('isSpoiler') === 'on',
    });
    
    if (result.success) {
      // 成功処理
      alert('Review posted!');
    } else {
      // エラー処理
      alert(result.error);
    }
    
    setLoading(false);
  }
  
  return (
    <form action={handleSubmit}>
      {/* フォーム要素 */}
    </form>
  );
}
```

---

### 3. API Routes（最小限）

**用途**: 外部Webhook、公開API（将来的）

#### Webhook例: Supabase Database Webhook

**ファイル**: `app/api/webhooks/supabase/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  // 1. Webhook検証（署名チェック）
  const headersList = headers();
  const signature = headersList.get('x-supabase-signature');
  
  // TODO: 署名検証実装
  
  // 2. ペイロード取得
  const payload = await request.json();
  
  // 3. 処理（例: チャンネル統計更新）
  // ...
  
  return NextResponse.json({ success: true });
}
```

---

## Server Actions一覧

### チャンネル関連 (`app/_actions/channel.ts`)

```typescript
// チャンネル情報をキャッシュに保存
export async function cacheChannelData(youtubeChannelId: string)

// チャンネル統計を更新
export async function updateChannelStats(channelId: string)
```

### レビュー関連 (`app/_actions/review.ts`)

```typescript
// レビュー投稿
export async function createReview(input: CreateReviewInput)

// レビュー編集
export async function updateReview(reviewId: string, input: UpdateReviewInput)

// レビュー削除（ソフトデリート）
export async function deleteReview(reviewId: string)

// 「参考になった」ボタン
export async function toggleHelpful(reviewId: string)
```

### ユーザーチャンネル関連 (`app/_actions/user-channel.ts`)

```typescript
// マイリストに追加（見たい/見ている/見た）
export async function addToMyList(input: AddToMyListInput)

// ステータス変更
export async function updateStatus(channelId: string, status: 'want' | 'watching' | 'watched')

// マイリストから削除
export async function removeFromMyList(channelId: string)
```

### リスト関連 (`app/_actions/list.ts`)

```typescript
// リスト作成
export async function createList(input: CreateListInput)

// リスト編集
export async function updateList(listId: string, input: UpdateListInput)

// リスト削除
export async function deleteList(listId: string)

// リストにチャンネル追加
export async function addChannelToList(listId: string, channelId: string)

// リストからチャンネル削除
export async function removeChannelFromList(listId: string, channelId: string)

// 「いいね」ボタン
export async function toggleListLike(listId: string)
```

### YouTube API関連 (`app/_actions/youtube.ts`)

```typescript
// チャンネル検索
export async function searchChannels(query: string)

// チャンネル詳細取得（YouTube APIから）
export async function fetchChannelDetails(youtubeChannelId: string)
```

---

## エラーレスポンス統一

### レスポンス型定義

```typescript
// lib/types/api.ts
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
```

### エラーコード

| コード | 意味 | HTTPステータス |
|--------|------|---------------|
| `UNAUTHORIZED` | 未認証 | 401 |
| `FORBIDDEN` | 権限なし | 403 |
| `NOT_FOUND` | リソースなし | 404 |
| `VALIDATION_ERROR` | バリデーションエラー | 400 |
| `DUPLICATE` | 重複 | 409 |
| `RATE_LIMIT` | レート制限 | 429 |
| `INTERNAL_ERROR` | サーバーエラー | 500 |

### エラーハンドリングヘルパー

```typescript
// lib/api/error.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): ApiResponse<never> {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
    };
  }
  
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Validation error',
      details: error.errors,
    };
  }
  
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: 'Internal server error',
  };
}
```

---

## 認証・認可

### 認証チェック

```typescript
// lib/auth.ts
import { createClient } from '@/lib/supabase/server';

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return user;
}
```

### 認可チェック（リソース所有者）

```typescript
// app/_actions/review.ts
export async function updateReview(reviewId: string, input: UpdateReviewInput) {
  const user = await requireAuth();
  
  // リソース取得
  const { data: review } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();
  
  if (!review) {
    throw new ApiError('NOT_FOUND', 'Review not found', 404);
  }
  
  // 所有者チェック
  if (review.user_id !== user.id) {
    throw new ApiError('FORBIDDEN', 'You can only edit your own reviews', 403);
  }
  
  // 更新処理
  // ...
}
```

---

## レート制限

### Vercel Edge Middleware

**ファイル**: `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redisでレート制限（オプション）
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100リクエスト/分
});

export async function middleware(request: NextRequest) {
  // API Routesのみレート制限
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### YouTube API レート制限（アプリケーション層）

```typescript
// lib/youtube/rate-limit.ts
class YouTubeRateLimiter {
  private dailyQuota = 10000;
  private usedQuota = 0;
  private lastReset = new Date().setHours(0, 0, 0, 0);
  
  async checkQuota(cost: number): Promise<boolean> {
    // 日付が変わったらリセット
    const today = new Date().setHours(0, 0, 0, 0);
    if (today > this.lastReset) {
      this.usedQuota = 0;
      this.lastReset = today;
    }
    
    // クォータチェック
    if (this.usedQuota + cost > this.dailyQuota) {
      throw new ApiError(
        'RATE_LIMIT',
        'YouTube API quota exceeded',
        429
      );
    }
    
    this.usedQuota += cost;
    return true;
  }
}

export const youtubeRateLimiter = new YouTubeRateLimiter();
```

---

## キャッシュ戦略

### データフェッチングのキャッシュ

```typescript
// Server Components
export const revalidate = 3600; // 1時間

export default async function Page() {
  // 自動的にキャッシュされる
  const data = await getData();
  return <div>{data}</div>;
}
```

### Server Actionsのキャッシュ無効化

```typescript
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createReview(input: CreateReviewInput) {
  // データ更新
  // ...
  
  // キャッシュ無効化
  revalidatePath(`/channels/${input.channelId}`);
  revalidatePath('/my-list');
  
  // または タグベース
  revalidateTag('reviews');
}
```

---

## セキュリティチェックリスト

### ✅ Server Actions

- [ ] 全てのServer Actionsで認証チェック
- [ ] バリデーション（Zod）実装
- [ ] SQL Injection対策（Supabase Client使用）
- [ ] XSS対策（DOMPurify使用）
- [ ] CSRF対策（Next.js自動対応）
- [ ] レート制限実装

### ✅ API Routes

- [ ] Webhook署名検証
- [ ] CORS設定
- [ ] レート制限（middleware）

---

## テスト戦略

### Unit Test（Server Actions）

```typescript
// __tests__/actions/review.test.ts
import { createReview } from '@/app/_actions/review';

describe('createReview', () => {
  it('should create review with valid data', async () => {
    const result = await createReview({
      channelId: 'valid-uuid',
      rating: 5,
      content: 'Great channel!',
    });
    
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid rating', async () => {
    const result = await createReview({
      channelId: 'valid-uuid',
      rating: 6, // 無効
      content: 'Great channel!',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid input');
  });
});
```

---

## 参考資料

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side)
- [Zod Validation](https://zod.dev/)
- [backend-development skill](https://github.com/mrgoonie/claudekit-skills) (ClaudeKit)
