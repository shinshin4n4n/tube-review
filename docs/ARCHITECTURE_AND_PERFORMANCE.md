# ちゅぶれびゅ！ アーキテクチャ & パフォーマンス設計

## アーキテクチャ原則

### 設計哲学
1. **Server-First**: デフォルトはServer Components、必要な場合のみClient Components
2. **Progressive Enhancement**: JavaScriptなしでも基本機能が動作
3. **Edge-Optimized**: Vercel Edgeで高速配信
4. **Type-Safe**: TypeScript Strict Mode + Zodでランタイム検証
5. **Defense-in-Depth**: 多層防御でセキュリティ担保

---

## システムアーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────┐
│              Vercel Edge Network                │
│  (CDN, Edge Functions, Security Headers)        │
└────────────────┬────────────────────────────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
┌──────▼──────┐    ┌──────▼──────┐
│  Static     │    │  Dynamic    │
│  Pages      │    │  Pages      │
│  (SSG/ISR)  │    │  (SSR/CSR)  │
└──────┬──────┘    └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │   Next.js App     │
       │   (Server Actions)│
       └─────────┬─────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
┌──────▼──────┐    ┌──────▼──────┐
│  Supabase   │    │  YouTube    │
│  (PostgreSQL│    │  Data API   │
│   + Auth +  │    │             │
│   Storage)  │    │             │
└─────────────┘    └─────────────┘
```

---

## レンダリング戦略詳細

### 1. Static Site Generation (SSG)

**対象ページ**:
- トップページ (`/`)
- 利用規約 (`/terms`)
- プライバシーポリシー (`/privacy`)

**実装**:
```typescript
// app/page.tsx
export const dynamic = 'force-static';
export const revalidate = 3600; // 1時間ごとに再生成

export default async function Home() {
  // ビルド時に実行
  const featuredChannels = await getFeaturedChannels();
  const rankings = await getDailyRankings();
  
  return (
    <main>
      <FeaturedSection channels={featuredChannels} />
      <RankingSection rankings={rankings} />
    </main>
  );
}
```

**メリット**:
- 最速の初期表示（CDNから配信）
- サーバー負荷ゼロ
- SEO最適化

**デメリット**:
- リアルタイム性は低い
- ビルド時間が長くなる可能性

---

### 2. Incremental Static Regeneration (ISR)

**対象ページ**:
- ランキングページ (`/ranking`)
- 新着チャンネルページ (`/new-channels`)
- カテゴリ別ページ (`/category/[slug]`)

**実装**:
```typescript
// app/ranking/page.tsx
export const revalidate = 600; // 10分ごとに再検証

export default async function RankingPage() {
  const rankings = await getRankings({
    timeRange: 'daily',
    limit: 50
  });
  
  return <RankingList rankings={rankings} />;
}
```

**メリット**:
- SSGの速度 + 定期更新
- スケーラブル（同時アクセス多数でもOK）

**デメリット**:
- 最新データまで最大10分のラグ
- キャッシュ無効化の仕組みが必要

---

### 3. Server Side Rendering (SSR)

**対象ページ**:
- チャンネル詳細 (`/channels/[id]`)
- ユーザープロフィール（公開） (`/users/[username]`)

**実装**:
```typescript
// app/channels/[id]/page.tsx
export const dynamic = 'force-dynamic'; // 常に最新データ

export default async function ChannelPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // リクエストごとに実行
  const channel = await getChannelById(params.id);
  const reviews = await getReviewsByChannel(params.id);
  const stats = await getChannelStats(params.id);
  
  return (
    <>
      <ChannelHeader channel={channel} stats={stats} />
      <ReviewList reviews={reviews} />
    </>
  );
}

// メタデータも動的生成（SEO）
export async function generateMetadata({ params }: { params: { id: string } }) {
  const channel = await getChannelById(params.id);
  
  return {
    title: `${channel.title} のレビュー | ちゅぶれびゅ！`,
    description: channel.description,
    openGraph: {
      images: [channel.thumbnail],
    },
  };
}
```

**メリット**:
- 常に最新データ
- SEO対応（メタタグ動的生成）
- 初期表示でデータ揃う

**デメリット**:
- TTFB（Time To First Byte）が長い
- サーバー負荷高い

---

### 4. Client Side Rendering (CSR)

**対象ページ**:
- マイリストページ (`/my-list`)
- 設定ページ (`/settings`)
- レビュー投稿フォーム

**実装**:
```typescript
// app/(dashboard)/my-list/page.tsx
'use client';

import useSWR from 'swr';

export default function MyListPage() {
  const { data: userChannels, isLoading } = useSWR(
    '/api/user-channels',
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // 30秒ごと
    }
  );
  
  if (isLoading) return <Loading />;
  
  return (
    <Tabs>
      <TabPanel value="want">
        <ChannelGrid channels={userChannels.want} />
      </TabPanel>
      {/* ... */}
    </Tabs>
  );
}
```

**メリット**:
- インタラクティブ
- サーバー負荷低い
- リアルタイム更新

**デメリット**:
- 初期表示が遅い
- SEO不要なページ限定

---

## データフェッチング戦略

### Server Components（推奨）

```typescript
// ✅ 良い例: Server Component
async function ChannelList() {
  // サーバー側で実行、クライアントにJavaScript不要
  const channels = await supabase
    .from('channels')
    .select('*')
    .limit(20);
  
  return (
    <div>
      {channels.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
```

### Client Components（必要な場合のみ）

```typescript
// ✅ 良い例: SWRでキャッシュ + リアルタイム更新
'use client';

function ChannelStats({ channelId }: { channelId: string }) {
  const { data, mutate } = useSWR(
    `/api/channels/${channelId}/stats`,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 60000, // 1分ごと
    }
  );
  
  return <StatsDisplay stats={data} onRefresh={() => mutate()} />;
}
```

### Parallel Data Fetching

```typescript
// ✅ 良い例: 並列フェッチで高速化
async function ChannelDetailPage({ id }: { id: string }) {
  // Promise.all で並列実行
  const [channel, reviews, stats] = await Promise.all([
    getChannel(id),
    getReviews(id),
    getStats(id),
  ]);
  
  return (
    <>
      <ChannelHeader channel={channel} stats={stats} />
      <ReviewList reviews={reviews} />
    </>
  );
}
```

### Streaming with Suspense

```typescript
// ✅ 良い例: Suspenseでストリーミング
export default function ChannelPage({ id }: { id: string }) {
  return (
    <>
      <ChannelHeader id={id} /> {/* 高速表示 */}
      
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews id={id} /> {/* 遅延ロード */}
      </Suspense>
      
      <Suspense fallback={<StatsSkeleton />}>
        <Stats id={id} /> {/* 遅延ロード */}
      </Suspense>
    </>
  );
}
```

---

## キャッシュ戦略（4層）

### Layer 1: CDN Cache (Vercel Edge)

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/api/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};
```

### Layer 2: Client Cache (SWR)

```typescript
// lib/swr-config.ts
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  
  // ページ種別ごとの設定
  channels: {
    refreshInterval: 300000, // 5分
  },
  reviews: {
    refreshInterval: 60000, // 1分
  },
  stats: {
    refreshInterval: 600000, // 10分
  },
};
```

### Layer 3: Application Cache (Supabase)

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedChannel = unstable_cache(
  async (id: string) => {
    return await supabase
      .from('channels')
      .select('*')
      .eq('id', id)
      .single();
  },
  ['channel'], // キャッシュキー
  {
    revalidate: 86400, // 1日
    tags: ['channels'],
  }
);

// キャッシュ無効化
import { revalidateTag } from 'next/cache';
revalidateTag('channels');
```

### Layer 4: Database Cache (Materialized View)

```sql
-- 1時間ごとに更新されるチャンネル統計
CREATE MATERIALIZED VIEW channel_stats_cached AS
SELECT 
  channel_id,
  COUNT(DISTINCT reviews.id) AS review_count,
  AVG(reviews.rating) AS average_rating,
  COUNT(DISTINCT CASE WHEN user_channels.status = 'want' THEN user_channels.user_id END) AS want_count
FROM channels
LEFT JOIN reviews ON channels.id = reviews.channel_id
LEFT JOIN user_channels ON channels.id = user_channels.channel_id
GROUP BY channel_id;

CREATE UNIQUE INDEX ON channel_stats_cached(channel_id);

-- 定期更新（cron job）
REFRESH MATERIALIZED VIEW CONCURRENTLY channel_stats_cached;
```

---

## パフォーマンス最適化

### 画像最適化

```typescript
import Image from 'next/image';

// ✅ 良い例: Next.js Image で自動最適化
<Image
  src={channel.thumbnail}
  alt={channel.title}
  width={320}
  height={180}
  loading="lazy"
  placeholder="blur"
  blurDataURL={channel.thumbnailBlur}
/>
```

**効果**:
- WebP/AVIF 自動変換
- レスポンシブ画像配信
- 遅延ロード
- 累積レイアウトシフト（CLS）防止

### コード分割

```typescript
// ✅ 良い例: Dynamic Import
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // クライアントのみ
});

export default function StatsPage() {
  return (
    <>
      <LightweightSummary />
      <HeavyChart data={chartData} />
    </>
  );
}
```

### フォント最適化

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**効果**:
- サブセット化（ファイルサイズ削減）
- フォント表示最適化（swap）
- FOUT/FOIT防止

---

## データベースパフォーマンス

### インデックス戦略

```sql
-- 頻繁に検索されるカラムにインデックス
CREATE INDEX idx_channels_category ON channels(category);
CREATE INDEX idx_channels_subscriber ON channels(subscriber_count DESC);
CREATE INDEX idx_reviews_channel ON reviews(channel_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- 複合インデックス（よく一緒に使われる条件）
CREATE INDEX idx_user_channels_user_status ON user_channels(user_id, status);

-- 全文検索インデックス（日本語対応）
CREATE INDEX idx_channels_title_trgm ON channels USING gin(title gin_trgm_ops);
```

### クエリ最適化

```typescript
// ❌ 悪い例: N+1問題
const channels = await supabase.from('channels').select('*');
for (const channel of channels) {
  const stats = await supabase
    .from('channel_stats')
    .select('*')
    .eq('channel_id', channel.id)
    .single();
}

// ✅ 良い例: JOIN で1クエリ
const channels = await supabase
  .from('channels')
  .select(`
    *,
    stats:channel_stats(*)
  `);
```

### ページネーション

```typescript
// ❌ 悪い例: OFFSET（遅い）
const { data } = await supabase
  .from('channels')
  .select('*')
  .range(1000, 1019); // ページ50: 遅い

// ✅ 良い例: カーソルベース（速い）
const { data } = await supabase
  .from('channels')
  .select('*')
  .gt('created_at', lastSeenCreatedAt)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## セキュリティヘッダー

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://www.googleapis.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

---

## モニタリング & ログ

### パフォーマンスモニタリング

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

### エラートラッキング

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10%をトレース
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});

// Server Actionでのエラーハンドリング
export async function createReview(data: ReviewData) {
  try {
    return await supabase.from('reviews').insert(data);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { action: 'createReview' },
      extra: { data },
    });
    throw error;
  }
}
```

---

## スケーラビリティ対策

### 想定トラフィック

- **初期**: 1,000 DAU（Daily Active Users）
- **1年後**: 10,000 DAU
- **3年後**: 100,000 DAU

### ボトルネック対策

| ボトルネック | 対策 | 実装タイミング |
|-------------|------|--------------|
| DB接続数 | Supabase Pooler | 初期 |
| API レート制限 | YouTube APIキャッシュ | 初期 |
| 静的ファイル配信 | Vercel CDN | 初期 |
| DBクエリ遅延 | Materialized View | 1万DAU時 |
| 同時書き込み | Optimistic Lock | 1万DAU時 |
| 全文検索 | Algolia移行 | 10万DAU時 |

---

## 参考資料

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)
- [Web Vitals](https://web.dev/vitals/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
