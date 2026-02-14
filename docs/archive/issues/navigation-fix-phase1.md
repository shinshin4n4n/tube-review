---
title: 'enhance: 🔥【緊急】全ページへのLayoutコンポーネント適用'
labels: ['enhancement', 'priority-critical', 'M']
assignees: ''
---

## 📋 概要

現在、トップページ以外のすべてのページでヘッダー・フッターが表示されておらず、ユーザーがページ間を自由に移動できない重大なUX問題が発生しています。全ページに共通Layoutコンポーネントを適用し、基本的なナビゲーションを可能にします。

## 🎯 目的

- すべてのページでヘッダー・フッターを表示
- ユーザーがページ間を自由に移動できるようにする
- チャンネル詳細ページからトップページに戻れるようにする
- 検索ページから他のページへ遷移できるようにする

## 📍 現在の状態

**Layout使用状況**:
- トップページ (`/`) - ✅ Layout使用
- 検索ページ (`/search`) - ❌ Layoutなし
- チャンネル詳細 (`/channels/[id]`) - ❌ Layoutなし
- マイリスト (`/my-list`) - ❌ Layoutなし
- マイリスト一覧 (`/my-lists`) - ❌ Layoutなし
- プロフィール (`/profile`) - ❌ Layoutなし

**影響**:
- ユーザーがページから他のページに遷移できない
- ブラウザの「戻る」ボタンに依存せざるを得ない
- ナビゲーションメニューが表示されない
- サイトの一貫性が欠如

## ✨ 改善後の状態

すべてのページで以下が表示される：
- ヘッダー（ロゴ、ナビゲーションメニュー）
- フッター（サイト情報、コピーライト）
- 統一されたページレイアウト

ユーザーシナリオ：
```
1. トップページで人気チャンネルをクリック
   ↓
2. チャンネル詳細ページに遷移
   ↓ ヘッダーが表示されている ✅
3. ヘッダーの「検索」をクリック
   ↓
4. 検索ページに遷移
   ↓ ヘッダーが表示されている ✅
5. ヘッダーの「トップ」をクリック
   ↓
6. トップページに戻る ✅
```

## 📐 設計

### 改善方針

1. 各ページコンポーネントを`<Layout>`でラップ
2. 認証ページ（ログイン・サインアップ）は簡易レイアウトを維持（例外）
3. 既存のスタイリングを保持しつつ、Layoutのpadding/marginと調整

### UI/UX変更

**Before**:
```tsx
// app/search/page.tsx
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-base py-8 px-4">
      {/* ヘッダーなし */}
      <h1>検索ページ</h1>
      {/* コンテンツ */}
    </div>
  );
}
```

**After**:
```tsx
// app/search/page.tsx
import { Layout } from '@/components/layout';

export default function SearchPage() {
  return (
    <Layout>
      <h1>検索ページ</h1>
      {/* コンテンツ */}
    </Layout>
  );
}
```

### 技術的な変更

- 各ページのルート要素を`<Layout>`に変更
- `min-h-screen`、`bg-base`、`py-8 px-4`などのスタイルをLayoutに任せる
- Layoutコンポーネント内で既に`container mx-auto px-6 py-8`が適用されているため、重複を避ける

## 📦 変更対象ファイル

### 修正

```
app/
├── search/
│   └── page.tsx
│       - <Layout>コンポーネントでラップ
│       - 既存のwrapperスタイルを調整
│
├── channels/
│   └── [id]/
│       └── page.tsx
│           - <Layout>コンポーネントでラップ
│           - max-w-4xl、mx-autoなどの調整
│
├── my-list/
│   └── page.tsx
│       - <Layout>コンポーネントでラップ
│       - 既存のwrapperスタイルを調整
│
├── my-lists/
│   └── page.tsx
│       - <Layout>コンポーネントでラップ
│       - 既存のwrapperスタイルを調整
│
└── profile/
    └── page.tsx
        - <Layout>コンポーネントでラップ
        - 既存のwrapperスタイルを調整
```

### 変更しないファイル（例外）

```
app/
└── (auth)/
    ├── login/page.tsx (認証フローに集中するため)
    └── signup/page.tsx (認証フローに集中するため)
```

## ⚡ パフォーマンス影響

- [x] パフォーマンス影響なし
  - Layoutコンポーネントは軽量（Header + Footer + wrapper div）
  - ISR/SSR戦略に変更なし
  - 既存のrevalidate設定を維持

## ♿ アクセシビリティ

- [x] アクセシビリティ向上
  - `<header>`、`<main>`、`<footer>`のセマンティックHTML構造
  - ナビゲーションがキーボードでアクセス可能
  - スクリーンリーダーでページ構造を理解しやすくなる

## 🧪 テスト要件

### E2E Test追加

```typescript
// tests/e2e/navigation.spec.ts
test('全ページでヘッダー・フッターが表示される', async ({ page }) => {
  const pages = [
    '/',
    '/search',
    '/channels/UC_test_id',
    '/my-list',
    '/my-lists',
    '/profile',
  ];

  for (const path of pages) {
    await page.goto(path);

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header a:has-text("ちゅぶれびゅ！")')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  }
});

test('ヘッダーからページ遷移ができる', async ({ page }) => {
  // チャンネル詳細からトップへ
  await page.goto('/channels/UC_test_id');
  await page.click('header a:has-text("トップ")');
  await expect(page).toHaveURL('/');

  // トップから検索へ
  await page.click('header a:has-text("検索")'); // Issue #2で実装予定
  await expect(page).toHaveURL('/search');

  // 検索からマイリストへ
  await page.click('header a:has-text("マイリスト")');
  await expect(page).toHaveURL('/my-list');
});
```

### Visual Regression Test（オプション）

- 各ページのスクリーンショットを撮影し、レイアウト崩れがないか確認

## ✅ 受入基準

### 機能要件

- [ ] 検索ページにヘッダー・フッターが表示される
- [ ] チャンネル詳細ページにヘッダー・フッターが表示される
- [ ] マイリストページにヘッダー・フッターが表示される
- [ ] マイリスト一覧ページにヘッダー・フッターが表示される
- [ ] プロフィールページにヘッダー・フッターが表示される
- [ ] 各ページのコンテンツが適切に表示される（レイアウト崩れなし）

### 非機能要件

- [ ] 既存のISR/SSR戦略を維持
- [ ] パフォーマンス低下なし（Lighthouse Score 90+維持）
- [ ] モバイル表示確認（レスポンシブ対応）
- [ ] アクセシビリティ確認（キーボードナビゲーション）

### テスト

- [ ] E2Eテストがパス（全ページでヘッダー・フッター表示確認）
- [ ] 既存テストがすべてパス（リグレッションなし）
- [ ] ナビゲーションフローテストがパス

### レビュー

- [ ] コードレビュー承認
- [ ] UI/UXレビュー承認（デザイナーがいる場合）

## 🔗 関連イシュー

### Blocks（このイシューが完了しないと開始できない）

- #XX: ヘッダーナビゲーション改修（Phase 2）
- #XX: ブレッドクラム実装（Phase 3）
- #XX: 戻るボタン実装（Phase 4）

### 関連

- Epic: ナビゲーション設計の統一

## 📚 参考資料

### 設計ドキュメント

- `docs/NAVIGATION_DESIGN.md` - ナビゲーション設計全体
- `docs/UI_DESIGN.md` - デザインシステム
- `components/layout/layout.tsx` - 既存Layoutコンポーネント
- `components/layout/header.tsx` - ヘッダーコンポーネント
- `components/layout/footer.tsx` - フッターコンポーネント

### 外部リソース

- [Next.js Layouts Documentation](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)

## 🏷️ ラベル

- `enhancement`: 改善
- `priority-critical`: Critical（緊急・最優先）
- `M`: Medium size（2-3時間）

## ⏱️ 見積もり時間

**予想時間**: 2-3時間

### 内訳

- ファイル修正: 1.5時間
  - 5ページ × 15分/ページ
  - スタイル調整: 15分
- E2Eテスト作成: 1時間
- 動作確認・デバッグ: 30分

## 📝 実装メモ

### 注意点

1. **Layoutのpadding/marginに注意**
   - Layoutコンポーネント: `container mx-auto px-6 py-8`
   - 各ページで重複する`min-h-screen bg-base py-8 px-4`を削除
   - コンテンツの最大幅（`max-w-4xl`等）は各ページで維持

2. **認証ページは例外**
   - `/login`、`/signup`はLayoutを適用しない
   - 認証フローに集中するため、シンプルなレイアウトを維持

3. **ISR/SSR設定を維持**
   - `revalidate`設定はそのまま
   - `generateMetadata`関数はそのまま

### 実装例

```tsx
// app/channels/[id]/page.tsx (修正後)
import { Layout } from '@/components/layout';

export default async function ChannelDetailPage({ params, searchParams }) {
  // ... 既存のデータ取得ロジック

  return (
    <Layout>
      {/* ヘッダーカード */}
      <Card className="mb-8">
        {/* ... */}
      </Card>

      {/* チャンネル説明 */}
      {channel.description && (
        <Card className="mb-8">
          {/* ... */}
        </Card>
      )}

      {/* レビュー投稿セクション */}
      {user && (
        <Card className="mb-8">
          {/* ... */}
        </Card>
      )}

      {/* レビュー一覧セクション */}
      <Card className="mb-8">
        {/* ... */}
      </Card>
    </Layout>
  );
}
```

### チェックリスト

開発中に確認すること：
- [ ] ヘッダーのロゴがクリック可能（トップページへ遷移）
- [ ] ナビゲーションメニューが機能する
- [ ] フッターが最下部に表示される
- [ ] レスポンシブ対応（モバイル・タブレット・デスクトップ）
- [ ] ページ遷移がスムーズ
- [ ] スタイルの崩れなし
