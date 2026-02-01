# エラーハンドリング設計

> **参照**: `backend-development` skill (ClaudeKit) + Next.js/Supabase/Anthropic公式ドキュメント

## 設計方針

### 原則（backend-development準拠）

1. **ユーザーフレンドリー**: 技術的詳細を隠し、分かりやすいメッセージ
2. **開発者フレンドリー**: 詳細なログでデバッグ容易
3. **セキュリティ**: シークレット・内部実装を露出しない
4. **一貫性**: 統一されたエラー形式
5. **観測可能性**: Sentryでエラー追跡

---

## エラー分類

### 1. クライアントエラー（4xx）

| コード | 名称 | 説明 | ユーザーメッセージ |
|--------|------|------|------------------|
| 400 | Bad Request | バリデーションエラー | 入力内容に誤りがあります |
| 401 | Unauthorized | 未認証 | ログインが必要です |
| 403 | Forbidden | 権限なし | この操作を行う権限がありません |
| 404 | Not Found | リソースなし | ページが見つかりません |
| 409 | Conflict | 重複・競合 | この項目は既に存在します |
| 422 | Unprocessable Entity | バリデーションエラー | 入力内容を確認してください |
| 429 | Too Many Requests | レート制限 | しばらく待ってから再試行してください |

### 2. サーバーエラー（5xx）

| コード | 名称 | 説明 | ユーザーメッセージ |
|--------|------|------|------------------|
| 500 | Internal Server Error | サーバー内部エラー | エラーが発生しました |
| 502 | Bad Gateway | 外部APIエラー | 一時的に利用できません |
| 503 | Service Unavailable | サービス停止中 | メンテナンス中です |
| 504 | Gateway Timeout | タイムアウト | 処理に時間がかかっています |

### 3. カスタムエラー（アプリケーション層）

| コード | 名称 | 説明 |
|--------|------|------|
| YOUTUBE_QUOTA_EXCEEDED | YouTube APIクォータ超過 | 1日のAPI制限に達しました |
| SUPABASE_RLS_VIOLATION | RLS違反 | アクセス権限がありません |
| VALIDATION_ERROR | バリデーションエラー | 入力検証失敗 |

---

## エラーハンドリング実装

### 1. カスタムエラークラス

**ファイル**: `lib/errors.ts`

```typescript
// ベースエラークラス
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public userMessage?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 認証エラー
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401, 'ログインが必要です');
  }
}

// 認可エラー
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403, 'この操作を行う権限がありません');
  }
}

// リソース未発見
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', message?: string) {
    super(
      'NOT_FOUND',
      message || `${resource} not found`,
      404,
      'ページが見つかりません'
    );
  }
}

// バリデーションエラー
export class ValidationError extends AppError {
  constructor(details?: unknown, message = 'Validation failed') {
    super(
      'VALIDATION_ERROR',
      message,
      422,
      '入力内容を確認してください',
      details
    );
  }
}

// 重複エラー
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super('CONFLICT', message, 409, 'この項目は既に存在します');
  }
}

// レート制限エラー
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(
      'RATE_LIMIT',
      message,
      429,
      'しばらく待ってから再試行してください'
    );
  }
}

// YouTube APIクォータ超過
export class YouTubeQuotaError extends AppError {
  constructor() {
    super(
      'YOUTUBE_QUOTA_EXCEEDED',
      'YouTube API daily quota exceeded',
      429,
      '1日のAPI制限に達しました。明日再度お試しください'
    );
  }
}
```

---

### 2. Server Actionsエラーハンドリング

**パターン**: 統一されたエラーレスポンス

```typescript
// app/_actions/review.ts
'use server';

import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import {
  AppError,
  AuthenticationError,
  ValidationError,
  ConflictError,
} from '@/lib/errors';

// レスポンス型
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; details?: unknown };

export async function createReview(
  input: CreateReviewInput
): Promise<ActionResult<Review>> {
  try {
    // 1. バリデーション
    const validated = createReviewSchema.parse(input);

    // 2. 認証チェック
    const user = await getUser();
    if (!user) {
      throw new AuthenticationError();
    }

    // 3. ビジネスロジック
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        channel_id: validated.channelId,
        rating: validated.rating,
        content: validated.content,
      })
      .select()
      .single();

    if (error) {
      // Supabaseエラー処理
      if (error.code === '23505') {
        // UNIQUE制約違反
        throw new ConflictError('You have already reviewed this channel');
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

// エラーハンドラー（共通）
function handleActionError(error: unknown): ActionResult<never> {
  // AppError（カスタムエラー）
  if (error instanceof AppError) {
    // Sentryに送信（5xxのみ）
    if (error.statusCode >= 500) {
      Sentry.captureException(error);
    }

    return {
      success: false,
      error: error.userMessage || error.message,
      code: error.code,
      details: error.details,
    };
  }

  // Zodバリデーションエラー
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: '入力内容を確認してください',
      code: 'VALIDATION_ERROR',
      details: error.errors,
    };
  }

  // 予期しないエラー
  console.error('Unexpected error:', error);
  Sentry.captureException(error);

  return {
    success: false,
    error: 'エラーが発生しました。しばらく待ってから再試行してください',
    code: 'INTERNAL_ERROR',
  };
}
```

---

### 3. クライアント側エラー表示

#### React Hook（エラー管理）

```typescript
// hooks/use-action.ts
import { useState } from 'react';
import { toast } from 'sonner'; // またはお好みのトースト

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; details?: unknown };

export function useAction<T, P>(
  action: (params: P) => Promise<ActionResult<T>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(params: P): Promise<T | null> {
    setLoading(true);
    setError(null);

    try {
      const result = await action(params);

      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        toast.error(result.error);
        return null;
      }
    } catch (err) {
      const message = 'エラーが発生しました';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error };
}
```

#### 使用例

```typescript
'use client';

import { useAction } from '@/hooks/use-action';
import { createReview } from '@/app/_actions/review';

export function ReviewForm({ channelId }: { channelId: string }) {
  const { execute, loading, error } = useAction(createReview);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await execute({
      channelId,
      rating: Number(formData.get('rating')),
      content: formData.get('content') as string,
    });

    if (result) {
      // 成功処理
      alert('Review posted!');
    }
    // エラーは useAction内で自動表示
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム要素 */}
      <button type="submit" disabled={loading}>
        {loading ? 'Posting...' : 'Post Review'}
      </button>
    </form>
  );
}
```

---

### 4. Next.js Error Boundary

#### Global Error（`app/error.tsx`）

```typescript
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentryに送信
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
      <p className="text-gray-600 mb-6">
        申し訳ございません。予期しないエラーが発生しました。
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        再試行
      </button>
    </div>
  );
}
```

#### Not Found（`app/not-found.tsx`）

```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-6xl font-bold mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-6">ページが見つかりません</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        トップページへ
      </Link>
    </div>
  );
}
```

---

### 5. API Routes エラーハンドリング

```typescript
// app/api/webhooks/supabase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    // Webhook処理
    const payload = await request.json();

    // ビジネスロジック
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

---

## 外部API エラーハンドリング

### 1. YouTube Data API

```typescript
// lib/youtube/api.ts
import { YouTubeQuotaError, AppError } from '@/lib/errors';

export async function fetchChannelDetails(channelId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
        new URLSearchParams({
          part: 'snippet,statistics',
          id: channelId,
          key: env.YOUTUBE_API_KEY,
        })
    );

    if (!response.ok) {
      // レート制限（403）
      if (response.status === 403) {
        const data = await response.json();
        if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
          throw new YouTubeQuotaError();
        }
      }

      throw new AppError(
        'YOUTUBE_API_ERROR',
        `YouTube API error: ${response.status}`,
        502,
        'チャンネル情報の取得に失敗しました'
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // ネットワークエラー等
    throw new AppError(
      'YOUTUBE_API_ERROR',
      'Failed to fetch YouTube data',
      502,
      'YouTube APIに接続できませんでした'
    );
  }
}
```

### 2. Supabase エラー

```typescript
// lib/supabase/errors.ts
import { PostgrestError } from '@supabase/supabase-js';
import { ConflictError, AuthorizationError, AppError } from '@/lib/errors';

export function handleSupabaseError(error: PostgrestError): never {
  // UNIQUE制約違反
  if (error.code === '23505') {
    throw new ConflictError(error.message);
  }

  // RLS違反
  if (error.code === '42501') {
    throw new AuthorizationError('Row Level Security policy violated');
  }

  // 汎用エラー
  throw new AppError(
    'SUPABASE_ERROR',
    error.message,
    500,
    'データベースエラーが発生しました'
  );
}
```

---

## Sentry統合

### 設定（`sentry.client.config.ts`）

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  // エラー送信率
  sampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

  // パフォーマンストレース
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // 無視するエラー
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // ユーザー起因のバリデーションエラーは送信しない
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
  ],

  // コンテキスト追加
  beforeSend(event, hint) {
    // AppErrorの場合、追加情報を送信
    const error = hint.originalException;
    if (error instanceof AppError) {
      event.contexts = {
        ...event.contexts,
        custom: {
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        },
      };

      // 4xxエラーは送信しない
      if (error.statusCode < 500) {
        return null;
      }
    }

    return event;
  },
});
```

### サーバー側設定（`sentry.server.config.ts`）

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  sampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
```

---

## ロギング戦略

### ログレベル

```typescript
// lib/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level =
      (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error, ...args);
      
      // Sentry送信
      if (error instanceof Error) {
        Sentry.captureException(error);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
```

### 使用例

```typescript
import { logger } from '@/lib/logger';

export async function createReview(input: CreateReviewInput) {
  logger.info('Creating review', { channelId: input.channelId });

  try {
    // ビジネスロジック
    // ...
    logger.info('Review created successfully', { reviewId: data.id });
  } catch (error) {
    logger.error('Failed to create review', error, { input });
    throw error;
  }
}
```

---

## エラーメッセージ多言語対応（将来）

```typescript
// lib/i18n/errors.ts
export const errorMessages = {
  ja: {
    UNAUTHORIZED: 'ログインが必要です',
    FORBIDDEN: 'この操作を行う権限がありません',
    NOT_FOUND: 'ページが見つかりません',
    VALIDATION_ERROR: '入力内容を確認してください',
    INTERNAL_ERROR: 'エラーが発生しました',
  },
  en: {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Insufficient permissions',
    NOT_FOUND: 'Page not found',
    VALIDATION_ERROR: 'Please check your input',
    INTERNAL_ERROR: 'An error occurred',
  },
};

export function getErrorMessage(code: string, locale = 'ja'): string {
  return errorMessages[locale][code] || errorMessages[locale].INTERNAL_ERROR;
}
```

---

## テスト戦略

### Unit Test（エラーハンドリング）

```typescript
// __tests__/lib/errors.test.ts
import { ValidationError, AuthenticationError } from '@/lib/errors';

describe('Custom Errors', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError({ field: 'email' });

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(422);
    expect(error.userMessage).toBe('入力内容を確認してください');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create AuthenticationError', () => {
    const error = new AuthenticationError();

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.statusCode).toBe(401);
  });
});
```

---

## セキュリティチェックリスト

### ✅ エラーメッセージ

- [ ] 本番環境でスタックトレースを露出しない
- [ ] データベースエラーの詳細を隠す
- [ ] シークレット・認証情報を含めない
- [ ] ユーザーフレンドリーなメッセージ

### ✅ ログ

- [ ] シークレットをログ出力しない
- [ ] 個人情報をマスキング
- [ ] 本番環境でDEBUGログを無効化

---

## 参考資料

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Supabase Error Handling](https://supabase.com/docs/reference/javascript/error-handling)
- [backend-development skill](https://github.com/mrgoonie/claudekit-skills) (ClaudeKit)
