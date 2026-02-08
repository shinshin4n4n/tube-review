# SEO対応ガイド

TubeReviewプロジェクトのSEO最適化方針とメタタグ設定方法です。

## 📋 目次

- [SEO戦略](#seo戦略)
- [メタタグ設定](#メタタグ設定)
- [sitemap.xml](#sitemapxml)
- [robots.txt](#robotstxt)
- [OGP画像](#ogp画像)
- [構造化データ](#構造化データ)
- [SEOチェックリスト](#seoチェックリスト)

## 🎯 SEO戦略

### 目的

1. **検索エンジンでの可視性向上**: Googleなどの検索エンジンで上位表示
2. **SNSシェア最適化**: TwitterやFacebookでのシェア時の見栄え向上
3. **クローラー効率化**: 検索エンジンが効率的にサイトを巡回できるようにする
4. **ユーザー体験向上**: SEOとUXは密接に関連

### ターゲットキーワード

- **プライマリ**: YouTubeチャンネル、レビュー、評価
- **セカンダリ**: おすすめチャンネル、ランキング、発見
- **ロングテール**: 特定のチャンネル名、ジャンル名

## 📝 メタタグ設定

### グローバルメタデータ

**ファイル**: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TubeReview - YouTubeチャンネルレビューサイト",
    template: "%s | TubeReview",  // 個別ページのタイトルフォーマット
  },
  description: "YouTubeチャンネルのレビューを投稿・閲覧できるプラットフォーム",
  keywords: ["YouTube", "レビュー", "チャンネル", ...],

  // Open Graph Protocol (OGP)
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "TubeReview",
    title: "TubeReview",
    description: "...",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "TubeReview",
    description: "...",
    images: ["/og-image.png"],
  },
};
```

### 動的メタデータ

#### チャンネル詳細ページ

**ファイル**: `app/channels/[id]/page.tsx`

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const channel = await fetchChannel(params.id);

  return {
    title: channel.title,  // "チャンネル名 | TubeReview"
    description: channel.description.substring(0, 160),  // 160文字以内
    keywords: [channel.title, "YouTube", "レビュー"],

    openGraph: {
      title: channel.title,
      description: channel.description,
      images: [channel.thumbnailUrl],
      type: 'profile',
    },

    alternates: {
      canonical: `${siteUrl}/channels/${params.id}`,
    },
  };
}
```

#### 検索ページ

**ファイル**: `app/search/page.tsx`

```typescript
export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const query = searchParams.q;

  if (query) {
    return {
      title: `「${query}」の検索結果`,
      description: `「${query}」に関連するYouTubeチャンネルの検索結果`,
      robots: {
        index: false,  // 検索結果ページはインデックスしない
        follow: true,
      },
    };
  }

  return {
    title: "チャンネル検索",
    description: "YouTubeチャンネルを検索してレビューを見つけよう",
  };
}
```

### メタタグのベストプラクティス

#### タイトルタグ

- **長さ**: 50-60文字（日本語は30文字程度）
- **フォーマット**: `ページ名 | サイト名`
- **重要キーワードを前方に配置**

✅ 良い例:
```
TubeReview - YouTubeチャンネルレビューサイト
ヒカキン | TubeReview
```

❌ 悪い例:
```
TubeReview | ページ | セクション | カテゴリ  # 長すぎる
チャンネル詳細  # サイト名がない
```

#### ディスクリプション

- **長さ**: 120-160文字
- **行動喚起を含める**
- **ページの内容を正確に要約**

✅ 良い例:
```
YouTubeチャンネルのレビューを投稿・閲覧できるプラットフォーム。
お気に入りのチャンネルを発見し、評価を共有しよう。
```

❌ 悪い例:
```
レビューサイト  # 短すぎる
このサイトはYouTubeチャンネルのレビューを投稿したり閲覧したりできるプラットフォームで、ユーザーは自分のお気に入りのチャンネルを発見したり、他のユーザーと評価を共有したりすることができます。  # 長すぎる
```

#### キーワード

- **5-10個程度**
- **関連性の高いキーワードのみ**
- **スパムキーワードは避ける**

✅ 良い例:
```typescript
keywords: ["YouTube", "レビュー", "チャンネル", "評価", "おすすめ"]
```

❌ 悪い例:
```typescript
keywords: ["YouTube", "YouTube", "YouTube", "レビュー", "レビュー"]  # 重複
keywords: ["無料", "最高", "人気", "おすすめ", "ランキング", ...]  # 多すぎる
```

## 🗺️ sitemap.xml

### 実装

**ファイル**: `app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // 静的ページ
  const staticPages = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/ranking`, changeFrequency: 'daily', priority: 0.8 },
  ];

  // 動的ページ（チャンネル）
  const channels = await fetchChannels();
  const channelPages = channels.map(channel => ({
    url: `${siteUrl}/channels/${channel.id}`,
    lastModified: new Date(channel.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...channelPages];
}
```

### アクセス方法

```
https://tube-review.vercel.app/sitemap.xml
```

### 設定値の意味

| プロパティ | 説明 | 推奨値 |
|-----------|------|--------|
| `url` | ページのURL | 完全なURL |
| `lastModified` | 最終更新日時 | ISO 8601形式 |
| `changeFrequency` | 更新頻度 | daily, weekly, monthly |
| `priority` | 優先度 | 0.0 〜 1.0 |

### 優先度ガイド

- **1.0**: トップページ
- **0.9**: 検索ページ
- **0.8**: ランキングページ
- **0.7**: チャンネル詳細ページ
- **0.5**: Aboutページ

## 🤖 robots.txt

### 実装

**ファイル**: `app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile/', '/my-channels/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],  // AI学習用クローラーは禁止
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

### アクセス方法

```
https://tube-review.vercel.app/robots.txt
```

### 出力例

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /profile/
Disallow: /my-channels/

User-agent: GPTBot
Disallow: /

Sitemap: https://tube-review.vercel.app/sitemap.xml
```

### クローラー制御

#### 許可するパス
- `/`: トップページ
- `/search`: 検索ページ
- `/channels/*`: チャンネル詳細ページ
- `/ranking`: ランキングページ

#### 禁止するパス
- `/api/*`: APIエンドポイント
- `/profile/*`: ユーザープロフィール（プライバシー）
- `/my-channels/*`: マイチャンネル（プライバシー）
- `/_next/*`: Next.js内部ファイル

#### AI学習用クローラー対策
- `GPTBot`: OpenAI
- `CCBot`: Common Crawl

これらは全て禁止し、コンテンツの無断学習を防ぐ。

## 🖼️ OGP画像

### デフォルト画像

**ファイル**: `public/og-image.png`

- **サイズ**: 1200 x 630 px
- **フォーマット**: PNG または JPG
- **ファイルサイズ**: < 300KB推奨

### デザインガイドライン

```
┌─────────────────────────────────┐
│                                 │
│         TubeReview              │
│                                 │
│  YouTubeチャンネルレビュー      │
│  サイト                          │
│                                 │
│  お気に入りのチャンネルを        │
│  発見しよう                      │
│                                 │
└─────────────────────────────────┘
```

### 動的OG画像（将来）

**ファイル**: `app/opengraph-image.tsx`

```typescript
export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ /* スタイル */ }}>
        <h1>TubeReview</h1>
        <p>YouTubeチャンネルレビューサイト</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### SNSプレビュー確認

- **Twitter**: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **Facebook**: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **LinkedIn**: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## 📊 構造化データ

### JSON-LD（将来実装）

構造化データを追加することで、検索結果でリッチスニペットを表示できます。

#### WebSite

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TubeReview',
  url: 'https://tube-review.vercel.app',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://tube-review.vercel.app/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};
```

#### Review（レビューページ）

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: {
    '@type': 'Thing',
    name: channel.title,
  },
  reviewRating: {
    '@type': 'Rating',
    ratingValue: review.rating,
    bestRating: 5,
  },
  author: {
    '@type': 'Person',
    name: review.author,
  },
};
```

## ✅ SEOチェックリスト

### 基本設定

- [x] タイトルタグが全ページに設定されている
- [x] メタディスクリプションが全ページに設定されている
- [x] OGP設定完了
- [x] Twitter Card設定完了
- [x] canonical URL設定
- [x] sitemap.xml生成
- [x] robots.txt設定

### コンテンツ

- [ ] 適切な見出し構造（h1 → h2 → h3）
- [ ] 画像にalt属性が設定されている
- [ ] 内部リンクが適切に設置されている
- [ ] 404ページのカスタマイズ完了

### パフォーマンス

- [ ] Lighthouse SEOスコア 90+
- [ ] Core Web Vitals合格
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

### クローラビリティ

- [x] robots.txtで不要なページをブロック
- [x] sitemap.xmlでクローラーを誘導
- [ ] Google Search Console登録
- [ ] Bing Webmaster Tools登録

## 🔍 SEO分析ツール

### Google Search Console

1. [Google Search Console](https://search.google.com/search-console)にアクセス
2. プロパティを追加: `https://tube-review.vercel.app`
3. 所有権の確認（DNSまたはHTMLタグ）
4. sitemap.xmlを送信

### Lighthouse

```bash
# インストール
npm install -g @lhci/cli

# 実行
lhci autorun --url=https://tube-review.vercel.app

# 目標スコア
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

### その他のツール

- **PageSpeed Insights**: パフォーマンス測定
- **Ahrefs**: 被リンク分析
- **SEMrush**: キーワードランキング
- **Screaming Frog**: クローラビリティチェック

## 📈 SEO改善の優先順位

### Phase 1: 基本設定（完了）

- [x] メタタグ設定
- [x] sitemap.xml
- [x] robots.txt
- [x] OGP設定

### Phase 2: コンテンツ最適化

- [ ] 見出し構造の最適化
- [ ] 画像alt属性の追加
- [ ] 内部リンク構造の改善
- [ ] ページ速度の最適化

### Phase 3: 高度なSEO

- [ ] 構造化データ（JSON-LD）
- [ ] パンくずリスト
- [ ] FAQページ
- [ ] ブログコンテンツ

## 🐛 トラブルシューティング

### OGP画像が表示されない

**症状**: SNSシェア時に画像が表示されない

**確認事項**:
1. 画像のURLが絶対パスか
2. 画像のサイズが1200x630pxか
3. 画像が公開アクセス可能か

**解決策**:
```typescript
// 相対パスではなく絶対パスを使用
openGraph: {
  images: [`${siteUrl}/og-image.png`],  // ✅
  images: ['/og-image.png'],            // ❌
}
```

### sitemap.xmlが生成されない

**症状**: `/sitemap.xml`にアクセスできない

**確認事項**:
1. `app/sitemap.ts`が存在するか
2. ビルドが成功しているか
3. デプロイが完了しているか

**解決策**:
```bash
# ローカルで確認
npm run build
npm run start
curl http://localhost:3000/sitemap.xml
```

### Google Search Consoleでインデックスされない

**症状**: 検索結果に表示されない

**確認事項**:
1. robots.txtでブロックされていないか
2. sitemap.xmlが送信されているか
3. noindexタグが設定されていないか

**解決策**:
1. Google Search ConsoleでURL検査
2. インデックス登録をリクエスト
3. 数日〜数週間待つ

## 📚 参考資料

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)

---

**最終更新**: 2026-02-08
