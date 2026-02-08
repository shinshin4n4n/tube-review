---
title: 'enhance: 戻るボタンと認証リダイレクト改善'
labels: ['enhancement', 'priority-medium', 'XS']
assignees: ''
---

## 📋 概要

詳細ページに「戻る」ボタンを追加し、ユーザーが前のページに素早く戻れるようにします。また、未認証ユーザーが認証が必要なアクションを実行しようとした際に、認証後に元のページに自動で戻れるようリダイレクト機能を改善します。

## 🎯 目的

- 詳細ページからの離脱を容易にする
- ブラウザの「戻る」ボタンに依存しない直感的なUI
- 認証後のユーザー体験を向上させる
- 未認証ユーザーの離脱を防ぐ

## 📍 現在の状態

### 戻るボタンの問題

- チャンネル詳細ページに「戻る」手段がない（ブラウザの戻るボタンのみ）
- ユーザーがどこから来たか分からない
- 特にモバイルでは不便

### 認証リダイレクトの問題

```
現在の動作:
1. 未認証ユーザーがレビュー投稿を試みる
2. ログインページにリダイレクト
3. ログイン成功
4. トップページにリダイレクト ← 問題！
5. ユーザーは再度チャンネル詳細ページに戻る必要がある
```

## ✨ 改善後の状態

### 戻るボタンの追加

```
┌─────────────────────────────────┐
│ ← 戻る   チャンネル詳細          │
│                                 │
│ [チャンネル情報]                 │
└─────────────────────────────────┘
```

### 認証リダイレクトの改善

```
改善後の動作:
1. 未認証ユーザーがレビュー投稿を試みる
2. 現在のURLを保存してログインページにリダイレクト
3. ログイン成功
4. 元のチャンネル詳細ページにリダイレクト ← 改善！
5. ユーザーはすぐにレビュー投稿を続けられる
```

## 📐 設計

### 改善方針

1. **BackButtonコンポーネントの作成**
   - `useRouter().back()`を使用
   - Client Component
   - 左矢印アイコン + 「戻る」テキスト

2. **認証リダイレクトの改善**
   - ログイン前のURLをクエリパラメータに保存
   - ログイン成功後にそのURLにリダイレクト
   - Middlewareで対応

### UI/UX変更

**BackButtonコンポーネント**:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      戻る
    </Button>
  );
}
```

### 技術的な変更

**認証リダイレクト**:
```tsx
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();

  // 未認証で保護されたページにアクセス
  if (!user && protectedPaths.includes(pathname)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname); // 元のURLを保存
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
```

```tsx
// app/(auth)/login/page.tsx
export default function LoginPage({ searchParams }) {
  const redirect = searchParams.redirect || '/';

  // ログイン成功後
  const handleLogin = async () => {
    await signIn();
    router.push(redirect); // 元のページにリダイレクト
  };
}
```

## 📦 変更対象ファイル

### 新規作成

```
components/
└── ui/
    └── back-button.tsx
        - 戻るボタンコンポーネント（Client Component）
        - useRouter().back()使用
        - ArrowLeftアイコン
```

### 修正

```
app/
├── channels/
│   └── [id]/
│       └── page.tsx
│           - BackButton追加（ページ上部）
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   │       - redirectクエリパラメータ対応
│   │       - ログイン成功後のリダイレクト先を変更
│   │
│   └── signup/
│       └── page.tsx
│           - redirectクエリパラメータ対応
│           - サインアップ成功後のリダイレクト先を変更
│
└── middleware.ts
    - 未認証リダイレクト時にredirectパラメータ追加
```

## ⚡ パフォーマンス影響

- [x] パフォーマンス影響なし
  - BackButtonは小さなClient Component
  - `useRouter().back()`はブラウザ標準機能を使用
  - クエリパラメータの追加のみ

## ♿ アクセシビリティ

- [x] アクセシビリティ向上
  - ボタンに明確なラベル「戻る」
  - キーボードでアクセス可能
  - フォーカス表示あり
  - `aria-label`で説明追加（オプション）

## 🧪 テスト要件

### E2E Test

```typescript
// tests/e2e/back-button.spec.ts

test('戻るボタンが表示される', async ({ page }) => {
  // トップページから遷移
  await page.goto('/');
  await page.click('text=人気チャンネル >> first');

  // チャンネル詳細ページ
  await expect(page).toHaveURL(/\/channels\/.+/);

  // 戻るボタンが表示される
  await expect(page.locator('button:has-text("戻る")')).toBeVisible();
});

test('戻るボタンをクリックすると前のページに戻る', async ({ page }) => {
  // トップページから遷移
  await page.goto('/');
  await page.click('text=人気チャンネル >> first');

  // チャンネル詳細ページ
  await expect(page).toHaveURL(/\/channels\/.+/);

  // 戻るボタンをクリック
  await page.click('button:has-text("戻る")');

  // トップページに戻る
  await expect(page).toHaveURL('/');
});

test('未認証ユーザーが認証後に元のページに戻る', async ({ page, context }) => {
  // 未認証状態でチャンネル詳細ページにアクセス
  await page.goto('/channels/UC_test_id');

  // マイリスト追加ボタンをクリック（認証が必要）
  await page.click('button:has-text("マイリストに追加")');

  // ログインページにリダイレクト（redirectパラメータ付き）
  await expect(page).toHaveURL(/\/login\?redirect=%2Fchannels%2FUC_test_id/);

  // ログイン
  await loginAsUser(context);

  // 元のチャンネル詳細ページに戻る
  await expect(page).toHaveURL('/channels/UC_test_id');
});

test('ログイン後、redirectパラメータがない場合はトップページに遷移', async ({ page, context }) => {
  await page.goto('/login');

  await loginAsUser(context);

  // トップページに遷移
  await expect(page).toHaveURL('/');
});
```

## ✅ 受入基準

### 機能要件

- [ ] チャンネル詳細ページに「戻る」ボタンが表示される
- [ ] 「戻る」ボタンをクリックすると前のページに戻る
- [ ] 未認証ユーザーが保護されたページにアクセスすると、現在のURLが保存される
- [ ] ログイン成功後、元のページにリダイレクトされる
- [ ] サインアップ成功後も同様にリダイレクトされる
- [ ] redirectパラメータがない場合はトップページにリダイレクト

### 非機能要件

- [ ] パフォーマンス低下なし
- [ ] セキュリティ: リダイレクトURLのバリデーション（外部URLを防ぐ）
- [ ] アクセシビリティ確認

### テスト

- [ ] E2Eテストがパス（戻るボタン、認証リダイレクト）
- [ ] 既存テストがすべてパス

### レビュー

- [ ] コードレビュー承認
- [ ] セキュリティレビュー承認（リダイレクトURLバリデーション）

## 🔗 関連イシュー

### Blocked by

- #XX: 全ページへのLayoutコンポーネント適用（Phase 1）

### Related

- Epic: ナビゲーション設計の統一

## 📚 参考資料

### 設計ドキュメント

- `docs/NAVIGATION_DESIGN.md` - ナビゲーション設計
- `docs/AUTH_FLOW.md` - 認証フロー

### Next.js ドキュメント

- [useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## 🏷️ ラベル

- `enhancement`: 改善
- `priority-medium`: Medium（中優先度）
- `XS`: Extra Small size（1時間）

## ⏱️ 見積もり時間

**予想時間**: 1時間

### 内訳

- BackButtonコンポーネント作成: 15分
- チャンネル詳細ページに追加: 10分
- Middleware改修（redirectパラメータ追加）: 15分
- ログイン・サインアップページ改修: 15分
- テスト作成: 10分
- 動作確認: 5分

## 📝 実装メモ

### 実装例

**components/ui/back-button.tsx**:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="mb-4 text-content-secondary hover:text-primary"
      aria-label="前のページに戻る"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      戻る
    </Button>
  );
}
```

**middleware.ts（抜粋）**:
```tsx
const protectedPaths = ['/profile', '/my-list', '/my-lists'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && protectedPaths.some(path => pathname.startsWith(path))) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
```

**app/(auth)/login/page.tsx（抜粋）**:
```tsx
export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const redirect = params.redirect || '/';

  // リダイレクトURLのバリデーション（セキュリティ）
  const isValidRedirect = redirect.startsWith('/') && !redirect.startsWith('//');
  const safeRedirect = isValidRedirect ? redirect : '/';

  return (
    <LoginForm redirectUrl={safeRedirect} />
  );
}
```

**app/(auth)/login/login-form.tsx（Client Component）**:
```tsx
'use client';

export function LoginForm({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter();

  const handleLogin = async () => {
    const result = await signInAction();

    if (result.success) {
      router.push(redirectUrl);
      router.refresh();
    }
  };

  // ...
}
```

### セキュリティ対策

**リダイレクトURLバリデーション**:
```tsx
function isValidRedirectUrl(url: string): boolean {
  // 相対URLのみ許可
  if (!url.startsWith('/')) return false;

  // プロトコル相対URL（//example.com）を防ぐ
  if (url.startsWith('//')) return false;

  // JavaScriptスキームを防ぐ
  if (url.toLowerCase().startsWith('javascript:')) return false;

  return true;
}
```

### チェックリスト

- [ ] BackButtonコンポーネント作成
- [ ] チャンネル詳細ページに追加
- [ ] Middleware改修
- [ ] ログインページ改修
- [ ] サインアップページ改修
- [ ] リダイレクトURLバリデーション実装
- [ ] E2Eテスト実装
- [ ] セキュリティレビュー（オープンリダイレクト脆弱性チェック）
