# TubeReview - AI Development Guide

このドキュメントは、AIアシスタント（Claude）がこのプロジェクトを理解し、一貫性のあるコード提案を行うためのガイドです。

## Tech Stack

- **Frontend**: Next.js 16.1.6 App Router + React 19.2.3
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Auth**: Magic Link + Google OAuth (Supabase Auth)
- **Cache**: Upstash Redis
- **Validation**: Zod 4.3.6
- **External API**: YouTube Data API v3
- **AI**: Anthropic Claude API (チャンネル自動分類)
- **Styling**: Tailwind CSS 4 + lucide-react
- **Testing**: Vitest 4 (Unit) + Playwright 1.58 (E2E)
- **Analytics**: Vercel Analytics + Speed Insights

## Architecture Patterns

### Server Actions

- **配置**: `app/_actions/{domain}.ts`
- **戻り値**: 必ず `ApiResponse<T>` を返す
- **エラーハンドリング**: `lib/api/error.ts` の `handleApiError()` を使用

例:

```typescript
import { ApiResponse } from "@/lib/types/api";
import { handleApiError } from "@/lib/api/error";

export async function createReview(
  data: ReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // バリデーション
    const validated = reviewSchema.parse(data);

    // 認証チェック
    const user = await getUser();
    if (!user) {
      throw new ApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        "ログインが必要です",
        401
      );
    }

    // 処理
    const supabase = await createClient();
    const { data: result, error } = await supabase
      .from("reviews")
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/channels/[id]");
    return { success: true, data: result };
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Database

- **RLS (Row Level Security)**: 全テーブルで有効化
  - ユーザーは自分のデータのみアクセス可能
  - 公開データは誰でも閲覧可能
- **Soft Delete**: `deleted_at IS NULL` パターン使用
  - レビュー、リストなどは論理削除
- **Materialized Views**: GitHub Actions (6h cron) でリフレッシュ
  - `channel_stats_mv`: チャンネル統計情報
  - `scripts/refresh-materialized-views.ts` で更新

### API Routes

- **配置**: `app/api/{endpoint}/route.ts`
- **命名**: POST, GET, PUT, DELETE を export
- **バリデーション**: Zod スキーマで検証
- **エラー**: 必ず `handleApiError()` を使用

例:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error";

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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
```

### Client Components

- **'use client'** ディレクティブを明示的に使用
- **状態管理**: React hooks (useState, useEffect)
- **データ取得**: Server Actions を呼び出し
- **フォーム**: Controlled Components パターン

## Security Rules

### エラーハンドリング

- ❌ エラーレスポンスに `details`, `stack` を含めない
- ❌ ユーザーのメールアドレスや個人情報をログに出力しない
- ✅ 全エラーは `lib/api/error.ts` の `handleApiError()` で処理
- ✅ API エラーコードは `lib/types/api.ts` の定数を使用

### ログ出力

- 本番環境では `console.log` を使わない
- `console.error`, `console.warn` のみ使用
- `next.config.ts` で自動削除設定済み
- デバッグログには `[Debug]` プレフィックスを付ける

### 認証

- **Magic Link**: メールアドレスのみで認証
- **Google OAuth**: Supabase の設定済みプロバイダー
- **セッション**: Supabase が自動管理
- **認証チェック**: `lib/auth.ts` の `getUser()`, `requireAuth()` を使用

## Testing

### ユニットテスト

- **ツール**: Vitest + Testing Library
- **カバレッジ**: 80%以上必須
- **実行**: `npm run test:unit`
- **配置**: `{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`

例:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('functionName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = { ... };

    // Act
    const result = await functionName(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
    }
  });
});
```

### E2Eテスト

- **ツール**: Playwright
- **デバイス**: Desktop Chrome, Pixel 5, iPad Pro
- **実行**: `npm run test:e2e`
- **配置**: `tests/e2e/{feature}.spec.ts`

例:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should perform action", async ({ page }) => {
    await page.goto("/path");
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });
});
```

### CI

- 全テスト通過が必須
- `continue-on-error` は使わない
- TypeScript 型チェックも必須
- Pre-commit hooks で自動 lint/format

## Code Style

### TypeScript

- **strict mode** 有効
- `any` 型は禁止（型ガードを使用）
- `as unknown as` は最小限に
- Optional chaining (`?.`) を活用

### Commits

- **Conventional Commits** 形式
  - `feat:` 新機能
  - `fix:` バグ修正
  - `refactor:` リファクタリング
  - `test:` テスト追加/修正
  - `docs:` ドキュメント更新
  - `chore:` ビルド/設定変更

### Lint & Format

- **ESLint + Prettier** (pre-commit 強制)
- **Import 順**:
  1. React
  2. Next.js
  3. 外部ライブラリ
  4. 内部モジュール (`@/...`)
  5. 型定義

例:

```typescript
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
```

### ファイル命名

- **コンポーネント**: PascalCase (`UserProfile.tsx`)
- **ユーティリティ**: kebab-case (`format-date.ts`)
- **テスト**: `{name}.test.ts` または `{name}.spec.ts`
- **Server Actions**: kebab-case (`review-actions.ts`)

## Project Structure

```
tube-review/
├── app/                      # Next.js App Router
│   ├── _actions/            # Server Actions
│   ├── _components/         # Shared components
│   ├── api/                 # API Routes
│   ├── (routes)/            # Page routes
│   └── layout.tsx           # Root layout
├── components/              # Reusable UI components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utilities & libraries
│   ├── api/                 # API helpers
│   ├── supabase/            # Supabase clients
│   ├── youtube/             # YouTube API client
│   ├── types/               # Type definitions
│   └── validation/          # Zod schemas
├── scripts/                 # Maintenance scripts
├── tests/                   # E2E tests
└── __tests__/               # Unit tests (co-located)
```

## Common Patterns

### Supabase Client

```typescript
// Server Component
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```

```typescript
// Client Component
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

### YouTube API

```typescript
import { searchChannels, getChannelDetails } from "@/lib/youtube/api";

// キャッシュ + レート制限付き
const channels = await searchChannels("keyword", 10);
const details = await getChannelDetails("UCxxxxx");
```

### Cache (Upstash Redis)

```typescript
import { getCachedData, setCachedData } from "@/lib/youtube/cache";

const cached = await getCachedData<ChannelDetails>(key);
if (cached) return cached;

// ... fetch data ...
await setCachedData(key, data, ttl);
```

## Environment Variables

必要な環境変数（`.env.local`）:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# YouTube
YOUTUBE_API_KEY=xxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Anthropic (Optional - for AI classification)
ANTHROPIC_API_KEY=sk-ant-xxx

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx (for auth)
NEXTAUTH_URL=http://localhost:3000
```

## Scripts

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run test:unit` - ユニットテスト実行
- `npm run test:e2e` - E2Eテスト実行
- `npm run lint` - Lint チェック
- `npm run generate-demo-data` - デモデータ生成
- `npm run classify-channels` - AI によるチャンネル分類
- `npm run refresh-stats` - Materialized Views 更新

## Best Practices

1. **Server Components First**: デフォルトは Server Component、必要な場合のみ Client Component
2. **Type Safety**: 型定義を明示的に。`ApiResponse<T>` で統一
3. **Error Handling**: 必ず `try-catch` + `handleApiError()`
4. **Validation**: Zod で入力バリデーション
5. **Caching**: YouTube API は高コスト → 必ずキャッシュ利用
6. **RLS**: データベースアクセスは RLS で保護
7. **Revalidation**: データ更新後は `revalidatePath()` を呼ぶ
8. **Testing**: 新機能には必ずテストを追加

## 避けるべきパターン

❌ `any` 型の使用
❌ クライアント側での直接的な Supabase クエリ（Server Actions を使用）
❌ エラーを握りつぶす（必ず適切にハンドリング）
❌ `console.log` の本番コードへの残留
❌ ハードコードされた文字列（定数化する）
❌ 巨大なコンポーネント（適切に分割）
❌ グローバル状態の乱用（必要最小限に）

## Notes for AI

- このプロジェクトは **Supabase Auth** を使用（NextAuth や better-auth は使用していません）
- **Zod 4** を使用（v3 ではない）
- **React 19** と **Next.js 16** の最新機能を活用
- **Server Actions** を優先的に使用
- コミット前に **pre-commit hooks** が自動実行されます
