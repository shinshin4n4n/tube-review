---
title: 'enhance: ブレッドクラム実装でユーザーの現在地把握を改善'
labels: ['enhancement', 'priority-medium', 'S']
assignees: ''
---

## 📋 概要

現在、どのページにもブレッドクラムが実装されていないため、ユーザーが自分の現在地やサイト階層を把握しにくい状態です。主要ページにブレッドクラムを追加し、ユーザーが直感的にナビゲーションできるようにします。

## 🎯 目的

- ユーザーの現在地を明確に表示
- サイト階層構造の可視化
- 上位ページへの素早い移動を可能にする
- UX・ユーザビリティの向上

## 📍 現在の状態

すべてのページでブレッドクラムがなく、以下の問題があります：

- ユーザーが今どのページにいるか分かりにくい
- 検索結果からチャンネル詳細に遷移した場合、検索結果に戻りづらい
- サイトの階層構造が不明瞭
- SEO的にも不利（構造化データ不足）

**特に問題となるページ**:
- チャンネル詳細ページ
- マイリスト詳細ページ（将来）
- プロフィールページ

## ✨ 改善後の状態

### 各ページでのブレッドクラム表示

**チャンネル詳細ページ** (`/channels/[id]`):
```
トップ > チャンネル名
```

**検索ページ** (`/search`):
```
トップ > 検索
```

**マイリストページ** (`/my-list`):
```
トップ > マイリスト
```

**マイリスト一覧ページ** (`/my-lists`):
```
トップ > マイリスト管理
```

**プロフィールページ** (`/profile`):
```
トップ > プロフィール
```

**マイリスト詳細ページ** (`/my-lists/[id]`) - 将来実装:
```
トップ > マイリスト管理 > リスト名
```

## 📐 設計

### 改善方針

1. **shadcn/ui Breadcrumbコンポーネントを使用**
   - アクセシビリティ対応済み
   - カスタマイズ可能
   - セマンティックHTML

2. **ページごとにブレッドクラムを定義**
   - 静的ページ: 固定パス
   - 動的ページ: パラメータから生成

3. **構造化データ対応（SEO）**
   - JSON-LD形式でBreadcrumbList追加

### UI/UX変更

**デザイン仕様**:
```
┌─────────────────────────────────┐
│ トップ > 検索 > チャンネル名      │
│   ↑      ↑         ↑            │
│  Link   Link   現在地（テキスト） │
└─────────────────────────────────┘
```

**スタイル**:
- テキスト色: `text-content-secondary`
- リンク: `hover:text-primary`
- セパレーター: `/`または`>`
- フォントサイズ: `text-sm`
- マージン: ページタイトルの上に配置

### 技術的な変更

**Breadcrumbコンポーネント**:
```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export function ChannelBreadcrumb({ channelTitle }: { channelTitle: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">トップ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{channelTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

**構造化データ（JSON-LD）**:
```tsx
// SEO最適化のため
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "トップ",
      "item": "https://tubereview.example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "チャンネル名",
      "item": "https://tubereview.example.com/channels/UC..."
    }
  ]
}
</script>
```

## 📦 変更対象ファイル

### 新規作成

```
components/
└── ui/
    └── breadcrumb.tsx (shadcn/uiから追加)

app/
└── _components/
    ├── channel-breadcrumb.tsx
    ├── search-breadcrumb.tsx
    ├── my-list-breadcrumb.tsx
    └── profile-breadcrumb.tsx
```

### 修正

```
app/
├── channels/
│   └── [id]/
│       └── page.tsx
│           - ブレッドクラム追加（ページ上部）
│           - 構造化データ追加（metadata）
│
├── search/
│   └── page.tsx
│       - ブレッドクラム追加
│
├── my-list/
│   └── page.tsx
│       - ブレッドクラム追加
│
├── my-lists/
│   └── page.tsx
│       - ブレッドクラム追加
│
└── profile/
    └── page.tsx
        - ブレッドクラム追加
```

## ⚡ パフォーマンス影響

- [x] パフォーマンス影響なし
  - Server Componentで静的レンダリング
  - クライアント側JSなし
  - DOM要素は最小限（<nav>と<ol>）

## ♿ アクセシビリティ

- [x] アクセシビリティ向上
  - `<nav aria-label="breadcrumb">`でランドマーク設定
  - `<ol>`で順序付きリスト
  - `aria-current="page"`で現在地を明示
  - キーボードナビゲーション対応

## 🧪 テスト要件

### E2E Test

```typescript
// tests/e2e/breadcrumb.spec.ts

test('チャンネル詳細ページでブレッドクラムが表示される', async ({ page }) => {
  await page.goto('/channels/UC_test_id');

  // ブレッドクラムが存在する
  const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
  await expect(breadcrumb).toBeVisible();

  // 「トップ」リンクが存在する
  await expect(breadcrumb.locator('a:has-text("トップ")')).toBeVisible();

  // チャンネル名が表示される（現在地）
  await expect(breadcrumb.locator('[aria-current="page"]')).toBeVisible();
});

test('ブレッドクラムからトップページに遷移できる', async ({ page }) => {
  await page.goto('/channels/UC_test_id');

  await page.click('nav[aria-label="breadcrumb"] a:has-text("トップ")');

  await expect(page).toHaveURL('/');
});

test('検索ページでブレッドクラムが表示される', async ({ page }) => {
  await page.goto('/search');

  const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.locator('a:has-text("トップ")')).toBeVisible();
  await expect(breadcrumb.locator('text=検索')).toBeVisible();
});

test('構造化データが正しく出力される', async ({ page }) => {
  await page.goto('/channels/UC_test_id');

  // JSON-LDスクリプトが存在する
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain('"@type": "BreadcrumbList"');
  expect(jsonLd).toContain('"name": "トップ"');
});
```

### Unit Test

```typescript
// __tests__/components/channel-breadcrumb.test.tsx

test('ChannelBreadcrumbが正しくレンダリングされる', () => {
  render(<ChannelBreadcrumb channelTitle="テストチャンネル" />);

  expect(screen.getByText('トップ')).toBeInTheDocument();
  expect(screen.getByText('テストチャンネル')).toBeInTheDocument();
  expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'breadcrumb');
});
```

## ✅ 受入基準

### 機能要件

- [ ] チャンネル詳細ページにブレッドクラムが表示される
- [ ] 検索ページにブレッドクラムが表示される
- [ ] マイリストページにブレッドクラムが表示される
- [ ] マイリスト一覧ページにブレッドクラムが表示される
- [ ] プロフィールページにブレッドクラムが表示される
- [ ] ブレッドクラムのリンクから上位ページに遷移できる
- [ ] 現在地が視覚的に区別される（リンクではなくテキスト）

### 非機能要件

- [ ] 構造化データ（JSON-LD）が正しく出力される
- [ ] SEO改善（Googleリッチリザルト対応）
- [ ] アクセシビリティ基準を満たす（WCAG 2.1 AA）
- [ ] モバイル表示でも読みやすい

### テスト

- [ ] E2Eテストがパス（全ページでブレッドクラム確認）
- [ ] Unit Testがパス
- [ ] 構造化データのバリデーション成功

### レビュー

- [ ] コードレビュー承認
- [ ] SEO観点でのレビュー承認

## 🔗 関連イシュー

### Blocked by

- #XX: 全ページへのLayoutコンポーネント適用（Phase 1）

### Related

- Epic: ナビゲーション設計の統一

## 📚 参考資料

### 設計ドキュメント

- `docs/NAVIGATION_DESIGN.md` - ナビゲーション設計
- `docs/UI_DESIGN.md` - デザインシステム

### shadcn/ui ドキュメント

- [Breadcrumb](https://ui.shadcn.com/docs/components/breadcrumb)

### 外部リソース

- [Google Search - Breadcrumb Structured Data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Schema.org - BreadcrumbList](https://schema.org/BreadcrumbList)
- [MDN - Breadcrumb Navigation](https://developer.mozilla.org/en-US/docs/Web/CSS/Layout_cookbook/Breadcrumb_Navigation)

## 🏷️ ラベル

- `enhancement`: 改善
- `priority-medium`: Medium（中優先度）
- `S`: Small size（2時間）

## ⏱️ 見積もり時間

**予想時間**: 2時間

### 内訳

- shadcn/ui Breadcrumbコンポーネント追加: 10分
- ブレッドクラムコンポーネント作成: 40分
  - 各ページ用 × 4 = 10分/ページ
- ページへの組み込み: 30分
  - 5ページ × 6分/ページ
- 構造化データ追加: 20分
- テスト作成: 20分
- 動作確認: 10分

## 📝 実装メモ

### 実装例

**app/channels/[id]/page.tsx**:
```tsx
import { ChannelBreadcrumb } from '@/app/_components/channel-breadcrumb';

export default async function ChannelDetailPage({ params }) {
  const { id } = await params;
  const result = await getChannelDetailsAction(id);
  const channel = result.data;

  return (
    <Layout>
      {/* ブレッドクラム */}
      <div className="mb-4">
        <ChannelBreadcrumb channelTitle={channel.title} />
      </div>

      {/* 既存のコンテンツ */}
      <Card className="mb-8">
        {/* ... */}
      </Card>
    </Layout>
  );
}

// 構造化データを追加
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params;
  const result = await getChannelDetailsAction(id);
  const channel = result.data;

  return {
    title: `${channel.title} | TubeReview`,
    description: channel.description,
    // 構造化データ
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'トップ',
            item: 'https://tubereview.example.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: channel.title,
            item: `https://tubereview.example.com/channels/${id}`,
          },
        ],
      }),
    },
  };
}
```

**app/_components/channel-breadcrumb.tsx**:
```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export function ChannelBreadcrumb({ channelTitle }: { channelTitle: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="text-content-secondary hover:text-primary">
            トップ
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-content">
            {channelTitle}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### チェックリスト

- [ ] shadcn/ui breadcrumbコンポーネントをインストール
- [ ] ページ別ブレッドクラムコンポーネント作成
- [ ] 各ページにブレッドクラム追加
- [ ] 構造化データ追加
- [ ] スタイル調整（デザインシステムに準拠）
- [ ] モバイル表示確認
- [ ] アクセシビリティ確認
- [ ] E2Eテスト実装
- [ ] 構造化データバリデーション（Google Rich Results Test）
