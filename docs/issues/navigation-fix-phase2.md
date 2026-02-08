---
title: 'enhance: ヘッダーナビゲーション改修とユーザーメニュー実装'
labels: ['enhancement', 'priority-high', 'M']
assignees: ''
---

## 📋 概要

現在のヘッダーには存在しないページへのリンク（/ranking, /new）があり、実装済みページへのリンク（/search, /profile）が不足しています。また、ユーザー認証状態に応じた表示分岐やユーザーメニューが実装されていません。ヘッダーナビゲーションを再設計し、実用的で使いやすいナビゲーションを提供します。

## 🎯 目的

- 存在しないページへのリンクを削除
- 実装済みページへのアクセス手段を提供
- ユーザー認証状態に応じた表示切り替え
- ユーザーメニュー（プロフィール、ログアウト）の実装
- モバイル対応（ハンバーガーメニュー）

## 📍 現在の状態

**現在のヘッダーリンク** (`components/layout/header.tsx`):
```tsx
- トップ → / ✅
- ランキング → /ranking ❌ ページが存在しない
- 新着 → /new ❌ ページが存在しない
- マイリスト → /my-list ✅
```

**問題点**:
- `/ranking`と`/new`ページが実装されていない（404エラー）
- `/search`（検索ページ）へのリンクがない
- `/profile`（プロフィール）へのリンクがない
- `/my-lists`（マイリスト一覧）へのリンクがない
- ログイン・ログアウトボタンがない
- ユーザー認証状態が表示されない
- モバイル対応していない

## ✨ 改善後の状態

### デスクトップ版ヘッダー

**未認証時**:
```
┌────────────────────────────────────────────┐
│ ちゅぶれびゅ！ │ トップ 検索 マイリスト │ ログイン │
└────────────────────────────────────────────┘
```

**認証済み時**:
```
┌──────────────────────────────────────────────────┐
│ ちゅぶれびゅ！ │ トップ 検索 マイリスト │ [Avatar▼] │
│                                           ┌──────────┐
│                                           │プロフィール│
│                                           │マイリスト管理│
│                                           │──────────│
│                                           │ログアウト│
│                                           └──────────┘
└──────────────────────────────────────────────────┘
```

### モバイル版ヘッダー（768px未満）

```
┌────────────────────────┐
│ ☰  ちゅぶれびゅ！  [Avatar] │
└────────────────────────┘

（メニュー展開時）
┌────────────────────────┐
│ トップ                 │
│ 検索                   │
│ マイリスト             │
│ ──────────────────     │
│ プロフィール           │ ← 認証済みのみ
│ マイリスト管理         │ ← 認証済みのみ
│ ログアウト             │ ← 認証済みのみ
│ ログイン               │ ← 未認証のみ
└────────────────────────┘
```

## 📐 設計

### 改善方針

1. **存在しないリンクを削除**: `/ranking`、`/new`を削除
2. **実装済みページへのリンク追加**: `/search`を追加
3. **ユーザーメニュー実装**: shadcn/ui DropdownMenuを使用
4. **認証状態表示**: ログイン・ログアウトボタンの切り替え
5. **モバイル対応**: Sheet（スライドメニュー）を使用

### UI/UX変更

**新しいヘッダー構成**:

```tsx
// components/layout/header.tsx
export async function Header() {
  const user = await getUser(); // Server Componentで認証チェック

  return (
    <header className="bg-primary text-white shadow-base">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/">ちゅぶれびゅ！</Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex gap-2">
            <NavLink href="/">トップ</NavLink>
            <NavLink href="/search">検索</NavLink>
            <NavLink href="/my-list">マイリスト</NavLink>
          </nav>

          {/* ユーザーメニュー */}
          <div className="hidden md:block">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link href="/login">
                <Button>ログイン</Button>
              </Link>
            )}
          </div>

          {/* モバイルメニュー */}
          <div className="md:hidden">
            <MobileMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 技術的な変更

1. **Server Componentでの認証チェック**
   - `getUser()`をHeader内で呼び出し
   - 認証状態に応じて表示切り替え

2. **shadcn/ui コンポーネント使用**
   - `DropdownMenu`: ユーザーメニュー
   - `Sheet`: モバイルメニュー
   - `Avatar`: ユーザーアバター
   - `Button`: ログインボタン

3. **ログアウト機能実装**
   - Client Componentで`signOut` Server Actionを呼び出し
   - ログアウト後は`/`にリダイレクト

## 📦 変更対象ファイル

### 修正

```
components/layout/
├── header.tsx
│   - Server Componentに変更（getUser()追加）
│   - 存在しないリンク削除（/ranking, /new）
│   - 検索リンク追加（/search）
│   - ユーザーメニュー追加
│   - モバイルメニュー追加
│   - レスポンシブ対応
│
└── layout.tsx
    - Headerの呼び出しを維持（変更なし）
```

### 新規作成

```
components/layout/
├── user-menu.tsx
│   - ユーザーメニューコンポーネント（Client Component）
│   - DropdownMenu使用
│   - Avatar表示
│   - プロフィール、マイリスト管理、ログアウト
│
└── mobile-menu.tsx
    - モバイルメニューコンポーネント（Client Component）
    - Sheet使用
    - ハンバーガーアイコン
    - ナビゲーションリスト
```

### shadcn/ui コンポーネント追加

```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add avatar
npx shadcn@latest add button  # 既存の場合はスキップ
```

## ⚡ パフォーマンス影響

- [x] パフォーマンス影響なし
  - Server Componentで認証チェック（サーバー側処理）
  - クライアント側JSは最小限（DropdownMenu、Sheetのみ）
  - 初回レンダリングはサーバー側で完了

## ♿ アクセシビリティ

- [x] アクセシビリティ向上
  - キーボードナビゲーション対応（Tab, Enter, Esc）
  - `aria-label`、`aria-expanded`などのARIA属性
  - フォーカス表示（`:focus-visible`）
  - スクリーンリーダー対応

## 🧪 テスト要件

### E2E Test

```typescript
// tests/e2e/header-navigation.spec.ts

test('未認証時にログインボタンが表示される', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a:has-text("ログイン")')).toBeVisible();
});

test('認証済み時にユーザーメニューが表示される', async ({ page, context }) => {
  // ログイン処理
  await loginAsUser(context);

  await page.goto('/');

  // アバターが表示される
  await expect(page.locator('header img[alt*="avatar"]')).toBeVisible();

  // ユーザーメニューをクリック
  await page.click('header button[aria-haspopup="menu"]');

  // メニュー項目が表示される
  await expect(page.locator('text=プロフィール')).toBeVisible();
  await expect(page.locator('text=マイリスト管理')).toBeVisible();
  await expect(page.locator('text=ログアウト')).toBeVisible();
});

test('ユーザーメニューからプロフィールに遷移できる', async ({ page, context }) => {
  await loginAsUser(context);
  await page.goto('/');

  await page.click('header button[aria-haspopup="menu"]');
  await page.click('text=プロフィール');

  await expect(page).toHaveURL('/profile');
});

test('ログアウトが機能する', async ({ page, context }) => {
  await loginAsUser(context);
  await page.goto('/');

  await page.click('header button[aria-haspopup="menu"]');
  await page.click('text=ログアウト');

  // トップページにリダイレクト
  await expect(page).toHaveURL('/');

  // ログインボタンが表示される
  await expect(page.locator('header a:has-text("ログイン")')).toBeVisible();
});

test('モバイルメニューが機能する', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

  await page.goto('/');

  // ハンバーガーメニューをクリック
  await page.click('header button[aria-label="メニュー"]');

  // メニューが表示される
  await expect(page.locator('text=トップ')).toBeVisible();
  await expect(page.locator('text=検索')).toBeVisible();
  await expect(page.locator('text=マイリスト')).toBeVisible();
});

test('検索ページへのリンクが機能する', async ({ page }) => {
  await page.goto('/');

  await page.click('header a:has-text("検索")');

  await expect(page).toHaveURL('/search');
});
```

## ✅ 受入基準

### 機能要件

- [ ] 存在しないリンク（/ranking, /new）が削除されている
- [ ] 検索ページへのリンクが表示される
- [ ] 未認証時にログインボタンが表示される
- [ ] 認証済み時にユーザーアバターが表示される
- [ ] ユーザーメニューからプロフィールに遷移できる
- [ ] ユーザーメニューからマイリスト管理に遷移できる
- [ ] ログアウト機能が動作する
- [ ] モバイルメニューが正しく表示・動作する

### 非機能要件

- [ ] レスポンシブデザイン（768px未満でモバイル表示）
- [ ] キーボードナビゲーション対応
- [ ] アクセシビリティ基準を満たす（WCAG 2.1 AA）
- [ ] パフォーマンス低下なし

### テスト

- [ ] E2Eテストがパス（ヘッダーナビゲーション確認）
- [ ] 既存テストがすべてパス
- [ ] モバイル表示テスト成功

### レビュー

- [ ] コードレビュー承認
- [ ] UI/UXレビュー承認

## 🔗 関連イシュー

### Blocked by

- #XX: 全ページへのLayoutコンポーネント適用（Phase 1）

### Related

- Epic: ナビゲーション設計の統一

## 📚 参考資料

### 設計ドキュメント

- `docs/NAVIGATION_DESIGN.md` - ナビゲーション設計
- `docs/UI_DESIGN.md` - デザインシステム
- `docs/AUTH_FLOW.md` - 認証フロー

### shadcn/ui ドキュメント

- [Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [Sheet](https://ui.shadcn.com/docs/components/sheet)
- [Avatar](https://ui.shadcn.com/docs/components/avatar)

### Next.js ドキュメント

- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

## 🏷️ ラベル

- `enhancement`: 改善
- `priority-high`: High（高優先度）
- `M`: Medium size（3時間）

## ⏱️ 見積もり時間

**予想時間**: 3時間

### 内訳

- shadcn/ui コンポーネント追加: 15分
- Header改修: 1時間
- UserMenuコンポーネント作成: 45分
- MobileMenuコンポーネント作成: 45分
- E2Eテスト作成: 30分
- 動作確認・デバッグ: 15分

## 📝 実装メモ

### 実装例

**components/layout/header.tsx**:
```tsx
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { UserMenu } from './user-menu';
import { MobileMenu } from './mobile-menu';

export async function Header() {
  const user = await getUser();

  return (
    <header className="bg-primary text-white shadow-base">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="text-xl font-bold hover:opacity-90 transition-opacity">
            ちゅぶれびゅ！
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex gap-2">
            <Link href="/" className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors">
              トップ
            </Link>
            <Link href="/search" className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors">
              検索
            </Link>
            <Link href="/my-list" className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors">
              マイリスト
            </Link>
          </nav>

          {/* デスクトップユーザーメニュー */}
          <div className="hidden md:block">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link href="/login" className="px-4 py-2 bg-accent rounded-md hover:bg-accent-hover transition-colors">
                ログイン
              </Link>
            )}
          </div>

          {/* モバイルメニュー */}
          <div className="md:hidden">
            <MobileMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

**components/layout/user-menu.tsx**:
```tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/app/_actions/auth';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
          <Avatar>
            <AvatarImage src={user.user_metadata?.avatar_url} alt="User avatar" />
            <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/my-lists')}>
          マイリスト管理
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### チェックリスト

- [ ] shadcn/uiコンポーネントをインストール
- [ ] Headerをasync Server Componentに変更
- [ ] UserMenuコンポーネント作成（Client Component）
- [ ] MobileMenuコンポーネント作成（Client Component）
- [ ] signOutAction実装（app/_actions/auth.ts）
- [ ] レスポンシブ対応確認（768px境界）
- [ ] キーボードナビゲーション確認
- [ ] E2Eテスト実装
