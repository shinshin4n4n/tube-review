# レート制限戦略

> **参照Skill**: `backend-development` (ClaudeKit) - レート制限、Token Bucket、Leaky Bucket

## 設計方針

### 目的

1. **YouTube API クォータ保護**: 10,000ユニット/日の制限
2. **DDoS対策**: 悪意あるリクエスト防止
3. **公平性**: 全ユーザーへの公平なリソース配分
4. **UX**: 正当なユーザーを阻害しない

### アルゴリズム選択（backend-development準拠）

| アルゴリズム | 用途 | 採用 |
|------------|------|------|
| **Token Bucket** | バースト許容、API保護 | ✅ YouTube API |
| **Sliding Window** | 正確な制限 | ✅ ユーザーリクエスト |
| **Fixed Window** | シンプル、粗い制限 | △ 補助 |
| **Leaky Bucket** | 一定レート強制 | △ 将来検討 |

---

## レート制限の階層

```
┌──────────────────────┐
│  1. CDN/Edge         │  ← Vercel Edge (地理的分散)
│  (Vercel)            │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  2. Middleware       │  ← IPベース制限（100req/min）
│  (Next.js)           │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  3. Application      │  ← ユーザーベース制限
│  (Server Actions)    │     - 認証済み: 60req/min
└──────────┬───────────┘     - 未認証: 20req/min
           │
┌──────────▼───────────┐
│  4. YouTube API      │  ← クォータ管理（10,000/day）
│  (外部API)           │     - 検索: 100ユニット
└──────────────────────┘     - 詳細: 1ユニット
```

---

## 1. YouTube API レート制限

### クォータ配分戦略

**1日の制限**: 10,000ユニット

| 操作 | コスト | 1日の上限 | 備考 |
|------|--------|----------|------|
| チャンネル検索 | 100 | 80回 | 8,000ユニット使用 |
| チャンネル詳細 | 1 | 2,000回 | 2,000ユニット使用 |
| バッファ | - | - | 残り予約 |

### 実装: Token Bucket

**ファイル**: `lib/youtube/rate-limiter.ts`

```typescript
import { AppError } from '@/lib/errors';

interface QuotaUsage {
  date: string; // YYYY-MM-DD
  used: number;
  operations: {
    search: number;
    details: number;
  };
}

class YouTubeRateLimiter {
  private static instance: YouTubeRateLimiter;
  private dailyLimit = 10000;
  private quotaUsage: QuotaUsage;

  private constructor() {
    this.quotaUsage = this.loadQuotaUsage();
  }

  static getInstance(): YouTubeRateLimiter {
    if (!YouTubeRateLimiter.instance) {
      YouTubeRateLimiter.instance = new YouTubeRateLimiter();
    }
    return YouTubeRateLimiter.instance;
  }

  private loadQuotaUsage(): QuotaUsage {
    const today = new Date().toISOString().split('T')[0];

    // Vercel KVまたはSupabaseから取得
    // 簡易版: メモリ内管理（プロダクションではRedis推奨）
    const stored = this.getFromStorage();

    if (stored && stored.date === today) {
      return stored;
    }

    // 新しい日付
    return {
      date: today,
      used: 0,
      operations: { search: 0, details: 0 },
    };
  }

  async checkQuota(operation: 'search' | 'details'): Promise<void> {
    const cost = operation === 'search' ? 100 : 1;
    const today = new Date().toISOString().split('T')[0];

    // 日付チェック
    if (this.quotaUsage.date !== today) {
      this.quotaUsage = {
        date: today,
        used: 0,
        operations: { search: 0, details: 0 },
      };
    }

    // クォータチェック
    if (this.quotaUsage.used + cost > this.dailyLimit) {
      throw new AppError(
        'YOUTUBE_QUOTA_EXCEEDED',
        'YouTube API daily quota exceeded',
        429,
        '1日のAPI制限に達しました。明日再度お試しください'
      );
    }

    // 操作ごとの上限チェック
    if (operation === 'search' && this.quotaUsage.operations.search >= 80) {
      throw new AppError(
        'YOUTUBE_SEARCH_LIMIT',
        'Daily search limit exceeded',
        429,
        '検索回数の上限に達しました'
      );
    }

    // 使用量を増やす
    this.quotaUsage.used += cost;
    this.quotaUsage.operations[operation]++;

    // 永続化
    await this.saveToStorage();
  }

  getRemainingQuota(): number {
    return this.dailyLimit - this.quotaUsage.used;
  }

  getQuotaStatus(): QuotaUsage {
    return { ...this.quotaUsage };
  }

  private getFromStorage(): QuotaUsage | null {
    // 実装: Vercel KV / Supabase / Redis
    // 簡易版: メモリ（開発時のみ）
    return null;
  }

  private async saveToStorage(): Promise<void> {
    // 実装: Vercel KV / Supabase / Redis
    // TODO: 永続化
  }
}

export const youtubeRateLimiter = YouTubeRateLimiter.getInstance();
```

### 使用例

```typescript
// lib/youtube/api.ts
import { youtubeRateLimiter } from './rate-limiter';

export async function searchChannels(query: string) {
  // クォータチェック
  await youtubeRateLimiter.checkQuota('search');

  // API呼び出し
  const response = await fetch(/* ... */);
  return response.json();
}

export async function fetchChannelDetails(channelId: string) {
  // クォータチェック
  await youtubeRateLimiter.checkQuota('details');

  // API呼び出し
  const response = await fetch(/* ... */);
  return response.json();
}
```

---

## 2. ユーザーリクエスト制限（Middleware）

### Vercel Edge Middleware + Upstash Redis

**ファイル**: `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redis（推奨）
const redis = Redis.fromEnv();

// Sliding Window: 100リクエスト/分
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'tubereview',
});

export async function middleware(request: NextRequest) {
  // 静的ファイルはスキップ
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // IPアドレス取得
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';

  // レート制限チェック
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `ip:${ip}`
  );

  const response = success
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'Too many requests',
          message: 'しばらく待ってから再試行してください',
        },
        { status: 429 }
      );

  // レート制限ヘッダー追加
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 3. Server Actions レート制限

### ユーザーベース制限

```typescript
// lib/rate-limit/user.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { AppError } from '@/lib/errors';

const redis = Redis.fromEnv();

// 認証済みユーザー: 60リクエスト/分
const authenticatedLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'user',
});

// 未認証: 20リクエスト/分
const anonymousLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'anon',
});

export async function checkUserRateLimit(userId?: string): Promise<void> {
  const limiter = userId ? authenticatedLimit : anonymousLimit;
  const identifier = userId || 'anonymous';

  const { success, remaining } = await limiter.limit(identifier);

  if (!success) {
    throw new AppError(
      'RATE_LIMIT',
      'Rate limit exceeded',
      429,
      `しばらく待ってから再試行してください（残り: ${remaining}）`
    );
  }
}
```

### Server Actionsでの使用

```typescript
// app/_actions/review.ts
import { checkUserRateLimit } from '@/lib/rate-limit/user';

export async function createReview(input: CreateReviewInput) {
  // 認証チェック
  const user = await getUser();

  // レート制限チェック
  await checkUserRateLimit(user?.id);

  // ビジネスロジック
  // ...
}
```

---

## 4. キャッシュ戦略（レート制限の補完）

### YouTube APIレスポンスのキャッシュ

```typescript
// lib/youtube/cache.ts
import { createClient } from '@/lib/supabase/server';

interface CachedChannel {
  youtube_channel_id: string;
  data: unknown;
  cached_at: string;
  expires_at: string;
}

export async function getCachedChannel(
  youtubeChannelId: string
): Promise<unknown | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from('cached_channels')
    .select('data, expires_at')
    .eq('youtube_channel_id', youtubeChannelId)
    .single();

  if (!data) return null;

  // 有効期限チェック
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data.data;
}

export async function setCachedChannel(
  youtubeChannelId: string,
  data: unknown,
  ttl = 86400 // 1日
): Promise<void> {
  const supabase = createClient();

  await supabase.from('cached_channels').upsert({
    youtube_channel_id: youtubeChannelId,
    data,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
  });
}
```

### 使用例（キャッシュファースト）

```typescript
// lib/youtube/api.ts
export async function getChannelDetails(youtubeChannelId: string) {
  // 1. キャッシュチェック
  const cached = await getCachedChannel(youtubeChannelId);
  if (cached) {
    return cached;
  }

  // 2. YouTube API呼び出し（レート制限あり）
  await youtubeRateLimiter.checkQuota('details');
  const data = await fetchFromYouTubeAPI(youtubeChannelId);

  // 3. キャッシュ保存
  await setCachedChannel(youtubeChannelId, data);

  return data;
}
```

---

## 5. レート制限のモニタリング

### クォータ使用状況API

```typescript
// app/api/quota/route.ts
import { NextResponse } from 'next/server';
import { youtubeRateLimiter } from '@/lib/youtube/rate-limiter';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  // 管理者のみアクセス可
  const user = await requireAuth();
  // TODO: 管理者チェック

  const status = youtubeRateLimiter.getQuotaStatus();

  return NextResponse.json({
    date: status.date,
    used: status.used,
    remaining: youtubeRateLimiter.getRemainingQuota(),
    limit: 10000,
    operations: status.operations,
    percentage: (status.used / 10000) * 100,
  });
}
```

### ダッシュボード表示

```typescript
// app/admin/quota/page.tsx
export default async function QuotaPage() {
  const response = await fetch('/api/quota');
  const quota = await response.json();

  return (
    <div>
      <h1>YouTube API Quota</h1>
      <p>使用量: {quota.used} / {quota.limit}</p>
      <p>残り: {quota.remaining}</p>
      <p>使用率: {quota.percentage.toFixed(2)}%</p>

      <h2>操作別</h2>
      <ul>
        <li>検索: {quota.operations.search} 回</li>
        <li>詳細: {quota.operations.details} 回</li>
      </ul>
    </div>
  );
}
```

---

## 6. アラート設定

### Vercel Cron（日次チェック）

```typescript
// app/api/cron/quota-check/route.ts
import { NextResponse } from 'next/server';
import { youtubeRateLimiter } from '@/lib/youtube/rate-limiter';

export async function GET(request: Request) {
  // Vercel Cronからのみ許可
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = youtubeRateLimiter.getQuotaStatus();
  const percentage = (status.used / 10000) * 100;

  // 80%以上でアラート
  if (percentage >= 80) {
    // Slack/Email通知
    await sendAlert({
      message: `YouTube API quota at ${percentage.toFixed(2)}%`,
      used: status.used,
      remaining: youtubeRateLimiter.getRemainingQuota(),
    });
  }

  return NextResponse.json({ status: 'ok', percentage });
}

async function sendAlert(data: unknown) {
  // Slack Webhook等
  // TODO: 実装
}
```

**Vercel Cron設定**（`vercel.json`）:
```json
{
  "crons": [
    {
      "path": "/api/cron/quota-check",
      "schedule": "0 0,12 * * *"
    }
  ]
}
```

---

## 7. クライアント側のエラー表示

### レート制限エラー処理

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function SearchForm() {
  const [loading, setLoading] = useState(false);

  async function handleSearch(query: string) {
    setLoading(true);

    try {
      const result = await searchChannels(query);

      if (!result.success) {
        if (result.code === 'YOUTUBE_QUOTA_EXCEEDED') {
          toast.error('1日のAPI制限に達しました', {
            description: '明日再度お試しください',
            duration: 5000,
          });
        } else if (result.code === 'RATE_LIMIT') {
          toast.error('リクエストが多すぎます', {
            description: 'しばらく待ってから再試行してください',
            duration: 3000,
          });
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (/* ... */);
}
```

---

## 8. 段階的な制限強化

### 警告 → ソフト制限 → ハード制限

```typescript
// lib/rate-limit/progressive.ts
export async function checkProgressiveLimit(userId: string) {
  const usage = await getUserUsage(userId);

  // 80%: 警告
  if (usage.percentage >= 80 && usage.percentage < 95) {
    return {
      allowed: true,
      warning: '制限に近づいています',
      remaining: usage.remaining,
    };
  }

  // 95%: ソフト制限（CAPTCHA）
  if (usage.percentage >= 95 && usage.percentage < 100) {
    return {
      allowed: true,
      requiresCaptcha: true,
      warning: 'まもなく制限に達します',
    };
  }

  // 100%: ハード制限
  if (usage.percentage >= 100) {
    throw new AppError(
      'RATE_LIMIT',
      'Daily limit reached',
      429,
      '1日の制限に達しました'
    );
  }

  return { allowed: true };
}
```

---

## セキュリティチェックリスト

### ✅ レート制限

- [ ] IPベース制限実装（Middleware）
- [ ] ユーザーベース制限実装（Server Actions）
- [ ] YouTube APIクォータ管理実装
- [ ] レート制限ヘッダー返却
- [ ] エラーメッセージにリトライ時間を含める

### ✅ モニタリング

- [ ] クォータ使用状況ダッシュボード
- [ ] 80%使用時のアラート
- [ ] 日次レポート

---

## 参考資料

- [YouTube Data API Quota](https://developers.google.com/youtube/v3/getting-started#quota)
- [Upstash Ratelimit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware)
- [backend-development skill](https://github.com/mrgoonie/claudekit-skills) (ClaudeKit)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
