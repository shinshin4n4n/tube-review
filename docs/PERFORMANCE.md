# パフォーマンス最適化ガイド

TubeReviewプロジェクトのパフォーマンス最適化手法と測定方法です。

## 📋 目次

- [パフォーマンス戦略](#パフォーマンス戦略)
- [画像最適化](#画像最適化)
- [バンドル最適化](#バンドル最適化)
- [キャッシュ戦略](#キャッシュ戦略)
- [Core Web Vitals](#core-web-vitals)
- [測定方法](#測定方法)
- [最適化チェックリスト](#最適化チェックリスト)

## 🎯 パフォーマンス戦略

### 目標

| メトリクス | 目標値 | 現状 |
|-----------|--------|------|
| **Lighthouse Performance** | 90+ | 測定中 |
| **First Load JS** | < 200KB | 測定中 |
| **LCP (Largest Contentful Paint)** | < 2.5s | 測定中 |
| **FID (First Input Delay)** | < 100ms | 測定中 |
| **CLS (Cumulative Layout Shift)** | < 0.1 | 測定中 |

### 最適化の優先順位

1. **画像最適化** (影響: 高)
2. **バンドルサイズ削減** (影響: 高)
3. **キャッシュ戦略** (影響: 中)
4. **レンダリング最適化** (影響: 中)

## 🖼️ 画像最適化

### Next.js Image コンポーネント

TubeReviewでは、全ての画像でNext.js `<Image>`コンポーネントを使用しています。

#### 利点

- ✅ 自動WebP/AVIF変換
- ✅ 遅延読み込み（Lazy Loading）
- ✅ レスポンシブ画像
- ✅ Cumulative Layout Shift (CLS) 防止
- ✅ Vercel自動最適化

#### 実装例

```typescript
import Image from 'next/image';

// チャンネルサムネイル
<Image
  src={channel.thumbnail_url}
  alt={channel.title}
  width={240}
  height={240}
  className="rounded-full"
  loading="lazy"
  unoptimized={channel.thumbnail_url.includes('youtube')}  // 外部画像
/>

// アバター画像
<Image
  src={user.avatar_url}
  alt={user.display_name}
  width={40}
  height={40}
  className="rounded-full"
/>
```

### 画像サイズ設定

**`next.config.ts`**:
```typescript
images: {
  // 画像フォーマット優先順位
  formats: ['image/avif', 'image/webp'],

  // デバイスサイズ（ブレークポイント）
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

  // 画像サイズ
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### リモート画像パターン

外部ドメインの画像を使用する場合、`remotePatterns`を設定:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'yt3.googleusercontent.com' },  // YouTube
    { protocol: 'https', hostname: 'hhpvymgwuonvzqbflfqz.supabase.co' },  // Supabase Storage
  ],
}
```

### 画像最適化のベストプラクティス

1. **適切なサイズ指定**
   ```typescript
   // ✅ Good: 実際の表示サイズを指定
   <Image width={240} height={240} />

   // ❌ Bad: 過剰に大きいサイズ
   <Image width={2000} height={2000} style={{width: '240px'}} />
   ```

2. **遅延読み込み**
   ```typescript
   // ✅ Good: Above the fold以外は lazy
   <Image loading="lazy" />

   // ⚠️ Above the foldは eager
   <Image loading="eager" priority />
   ```

3. **Alt属性**
   ```typescript
   // ✅ Good: 説明的なalt
   <Image alt="ヒカキンのチャンネルサムネイル" />

   // ❌ Bad: 空または無意味
   <Image alt="" />
   <Image alt="image" />
   ```

## 📦 バンドル最適化

### Bundle Analyzer

バンドルサイズを分析し、肥大化している部分を特定します。

#### 実行方法

```bash
# バンドル分析
npm run analyze

# 結果確認（ブラウザで開く）
open bundle-analysis/client.html
```

#### 分析結果の見方

- **大きな依存関係**: 100KB以上のパッケージを特定
- **重複コード**: 複数のチャンクに含まれているモジュール
- **未使用コード**: Tree-shakingされていないコード

### 動的インポート

大きなコンポーネントや頻繁に使用されないコンポーネントは動的にインポート:

```typescript
import dynamic from 'next/dynamic';

// Client Componentの遅延読み込み
const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <p>Loading...</p>,
  ssr: false,  // SSRを無効化（クライアントのみ）
});

// 特定の条件でのみ読み込み
export default function Page() {
  const [show, setShow] = useState(false);

  return (
    <>
      <button onClick={() => setShow(true)}>Show</button>
      {show && <HeavyComponent />}
    </>
  );
}
```

### Server Components活用

可能な限りServer Componentsを使用してバンドルサイズを削減:

```typescript
// ✅ Good: Server Component（デフォルト）
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ⚠️ Client Componentは必要な場合のみ
'use client';
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

### 依存関係の最適化

#### 軽量な代替ライブラリ

| 従来のライブラリ | 軽量な代替 | サイズ削減 |
|----------------|-----------|----------|
| `moment` | `date-fns` | ~70KB |
| `lodash` | `lodash-es` (tree-shakable) | ~50KB |
| `axios` | `fetch` (native) | ~15KB |

#### Tree-Shaking

```typescript
// ✅ Good: 名前付きインポート
import { format } from 'date-fns';

// ❌ Bad: デフォルトインポート
import dateFns from 'date-fns';
```

### コンパイラ最適化

**`next.config.ts`**:
```typescript
compiler: {
  // 本番環境でconsole削除（error, warnは残す）
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
}
```

## 🗄️ キャッシュ戦略

### ISR (Incremental Static Regeneration)

静的生成 + 定期的な再生成で、パフォーマンスと鮮度を両立:

#### チャンネル詳細ページ

**`app/channels/[id]/page.tsx`**:
```typescript
// 24時間ごとに再生成
export const revalidate = 86400;  // 24 hours

export default async function ChannelDetailPage({ params }) {
  const channel = await getChannelDetails(params.id);
  return <ChannelDetail channel={channel} />;
}
```

#### 設定値の選び方

| ページタイプ | revalidate | 理由 |
|-------------|-----------|------|
| **トップページ** | 3600 (1時間) | ランキングが頻繁に変わる |
| **チャンネル詳細** | 86400 (24時間) | チャンネル情報は安定 |
| **レビュー一覧** | 7200 (2時間) | 新規レビューがある |
| **静的ページ** | false (無期限) | Aboutページなど |

### fetch キャッシュ

Next.js 16では、`fetch`が自動的にキャッシュされます:

```typescript
// キャッシュ（デフォルト）
const data = await fetch('https://api.example.com/data');

// キャッシュしない
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
});

// 再検証
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }  // 1時間
});
```

### React Cache

同じリクエスト内で重複する関数呼び出しをメモ化:

```typescript
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  return data;
});

// 同じリクエスト内で複数回呼ばれても、1回だけ実行される
const user1 = await getUser('123');
const user2 = await getUser('123');  // キャッシュから取得
```

### CDNキャッシュ（Vercel）

Vercelでは、静的アセットとページが自動的にCDNでキャッシュされます:

- **静的ファイル** (`/public`): 永続キャッシュ
- **ISRページ**: `revalidate`設定に従う
- **動的ページ**: キャッシュなし

## ⚡ Core Web Vitals

### LCP (Largest Contentful Paint)

**目標**: < 2.5秒

**最適化方法**:
1. 画像最適化（Next.js Image）
2. Above the fold画像を`priority`で優先読み込み
3. フォントの最適化（next/font）
4. Server Componentsでサーバー側レンダリング

```typescript
// Above the fold画像
<Image
  src="/hero-image.png"
  alt="Hero"
  priority  // LCP改善
  width={1200}
  height={600}
/>
```

### FID (First Input Delay)

**目標**: < 100ms

**最適化方法**:
1. JavaScriptバンドルサイズ削減
2. 動的インポートで初期読み込みを軽量化
3. Server Componentsでクライアント側JSを削減

### CLS (Cumulative Layout Shift)

**目標**: < 0.1

**最適化方法**:
1. 画像に`width`と`height`を指定
2. フォントの`font-display: swap`
3. 動的コンテンツに固定サイズを確保

```typescript
// ✅ Good: サイズ指定でCLS防止
<Image width={240} height={240} />

// ❌ Bad: サイズ未指定
<Image src="..." className="w-60 h-60" />
```

## 📊 測定方法

### Lighthouse

#### ローカル測定

```bash
# Lighthouseインストール
npm install -g @lhci/cli

# 測定実行
lhci autorun --url=http://localhost:3000

# 本番環境測定
lhci autorun --url=https://tube-review.vercel.app
```

#### Chrome DevTools

1. Chrome DevToolsを開く（F12）
2. **Lighthouse**タブを選択
3. **Analyze page load**をクリック
4. レポートを確認

### PageSpeed Insights

1. [PageSpeed Insights](https://pagespeed.web.dev/)にアクセス
2. URLを入力: `https://tube-review.vercel.app`
3. **分析**をクリック
4. モバイル/デスクトップの結果を確認

### WebPageTest

1. [WebPageTest](https://www.webpagetest.org/)にアクセス
2. URLと設定を入力
3. **Start Test**
4. 詳細なウォーターフォールチャートを確認

### Vercel Analytics

Vercelの本番環境では、自動的にReal User Monitoring（RUM）データを収集:

1. Vercel Dashboardを開く
2. **Analytics**タブを選択
3. Real User Metricsを確認
   - Core Web Vitals
   - ページビュー
   - デバイス分布

## ✅ 最適化チェックリスト

### 画像

- [x] 全画像がNext.js Imageコンポーネント
- [x] WebP/AVIF対応
- [x] 遅延読み込み（loading="lazy"）
- [x] 適切なサイズ指定（width, height）
- [x] Alt属性設定

### JavaScript

- [x] Server Components優先使用
- [x] 動的インポート（必要に応じて）
- [x] Tree-shaking対応
- [ ] 未使用依存関係の削除
- [x] console削除（本番環境）

### キャッシュ

- [x] ISR設定（チャンネル詳細: 24時間）
- [x] React Cache使用
- [x] fetch キャッシュ設定

### フォント

- [x] next/font使用（Noto Sans JP）
- [x] font-display: swap
- [x] サブセット化（latin）

### CSS

- [x] Tailwind CSS（Purge有効）
- [x] 未使用CSSの削除

### ビルド

- [x] Bundle Analyzer設定
- [ ] バンドルサイズ測定
- [ ] 大きな依存関係の特定

## 🐛 トラブルシューティング

### 画像が表示されない

**症状**: Next.js Imageコンポーネントで画像が表示されない

**確認事項**:
1. `remotePatterns`に外部ドメイン登録済みか
2. 画像URLが有効か
3. `unoptimized`プロパティが必要か（YouTube画像など）

**解決策**:
```typescript
// YouTube画像はunoptimized
<Image
  src={youtubeUrl}
  unoptimized
  width={240}
  height={240}
/>
```

### バンドルサイズが大きい

**症状**: First Load JSが200KBを超える

**確認事項**:
1. Bundle Analyzerで大きな依存関係を特定
2. 動的インポートを使用しているか
3. Server Componentsを活用しているか

**解決策**:
```bash
# バンドル分析
npm run analyze

# 大きなパッケージを特定
# → 軽量な代替ライブラリに置き換え
# → 動的インポートで遅延読み込み
```

### LCPが遅い

**症状**: Largest Contentful Paintが2.5秒を超える

**確認事項**:
1. Above the fold画像に`priority`設定されているか
2. 画像が最適化されているか
3. Server Componentsでレンダリングされているか

**解決策**:
```typescript
// Above the fold画像にpriority
<Image priority loading="eager" />

// Server Componentでサーバー側レンダリング
export default async function Page() {
  const data = await fetchData();
  return <Content data={data} />;
}
```

## 📈 パフォーマンス改善事例

### Before / After

| メトリクス | Before | After | 改善 |
|-----------|--------|-------|------|
| Lighthouse Performance | 測定中 | 測定中 | - |
| First Load JS | 測定中 | 測定中 | - |
| LCP | 測定中 | 測定中 | - |
| FID | 測定中 | 測定中 | - |
| CLS | 測定中 | 測定中 | - |

### 主な改善施策

1. **画像最適化**
   - Next.js Image コンポーネント使用
   - WebP/AVIF自動変換

2. **バンドル最適化**
   - Bundle Analyzer導入
   - webpack-bundle-analyzer設定

3. **キャッシュ戦略**
   - ISR設定（チャンネル詳細: 24時間）
   - React Cache活用

4. **ビルド最適化**
   - console削除（本番環境）
   - 画像フォーマット最適化

## 📚 参考資料

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**最終更新**: 2026-02-08
