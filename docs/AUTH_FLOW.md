# 認証・認可フロー設計

> **参照Skill**: `better-auth` (ClaudeKit) - モダン認証フレームワーク、OAuth 2.1、JWT、セッション管理

## 設計方針

### 採用技術: Supabase Auth

ちゅぶれびゅ！は**Supabase Auth**を採用します。

**理由**:
- Next.js App Routerとの統合が容易
- Row Level Security (RLS)との連携
- OAuth 2.1準拠
- Magic Link、ソーシャルログイン対応
- セッション管理が組み込み済み

---

## 認証方式

### サポートする認証方式

| 方式 | 優先度 | 用途 |
|------|--------|------|
| **Magic Link（メール）** | 🔥 高 | パスワードレス、推奨 |
| **Google OAuth** | 🔥 高 | ソーシャルログイン |
| **GitHub OAuth** | 中 | 開発者向け |
| **Email + Password** | 低 | 従来型（オプション） |

---

## 認証フロー図

### 1. Magic Link認証フロー

```
┌─────────┐
│ User    │
└────┬────┘
     │
     │ 1. メールアドレス入力
     ▼
┌─────────────┐
│   Next.js   │
│   (Client)  │
└──────┬──────┘
       │ 2. Magic Link送信リクエスト
       ▼
┌──────────────┐
│  Supabase    │
│    Auth      │
└──────┬───────┘
       │ 3. Magic Link送信
       ▼
┌──────────────┐
│    Email     │
└──────┬───────┘
       │ 4. リンククリック
       ▼
┌──────────────┐
│   Next.js    │
│  /auth/      │
│  callback    │
└──────┬───────┘
       │ 5. トークン検証
       ▼
┌──────────────┐
│  Supabase    │
│  セッション   │
│  確立        │
└──────┬───────┘
       │ 6. リダイレクト
       ▼
┌──────────────┐
│  Dashboard   │
└──────────────┘
```

### 2. OAuth認証フロー（Google/GitHub）

```
┌─────────┐
│ User    │
└────┬────┘
     │
     │ 1. 「Googleでログイン」クリック
     ▼
┌─────────────┐
│   Next.js   │
└──────┬──────┘
       │ 2. OAuth開始
       ▼
┌──────────────┐
│  Supabase    │
│    Auth      │
└──────┬───────┘
       │ 3. Google認証画面へリダイレクト
       ▼
┌──────────────┐
│   Google     │
│   OAuth      │
└──────┬───────┘
       │ 4. 認証完了、コールバック
       ▼
┌──────────────┐
│  Supabase    │
│  /callback   │
└──────┬───────┘
       │ 5. セッション確立
       ▼
┌──────────────┐
│   Next.js    │
│  Dashboard   │
└──────────────┘
```

---

## 実装詳細

### ディレクトリ構成

```
app/
├── (auth)/                  # 認証関連（Route Group）
│   ├── login/
│   │   └── page.tsx        # ログインページ
│   ├── register/
│   │   └── page.tsx        # 登録ページ（Magic Link）
│   └── auth/
│       └── callback/
│           └── route.ts    # OAuth/Magic Linkコールバック
├── _lib/
│   └── supabase/
│       ├── client.ts       # クライアント側Supabase
│       ├── server.ts       # サーバー側Supabase
│       └── middleware.ts   # Middleware用Supabase
└── middleware.ts           # 認証チェック
```

---

### 1. Supabaseクライアント設定

#### クライアント側（`lib/supabase/client.ts`）

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

#### サーバー側（`lib/supabase/server.ts`）

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component内では set できない場合がある
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component内では remove できない場合がある
          }
        },
      },
    }
  );
}
```

#### Middleware用（`lib/supabase/middleware.ts`）

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
```

---

### 2. 認証ページ実装

#### ログインページ（`app/(auth)/login/page.tsx`）

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Magic Link送信
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the login link!');
    }

    setLoading(false);
  }

  // Google OAuth
  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  // GitHub OAuth
  async function handleGitHubLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-6">ちゅぶれびゅ！にログイン</h1>

      {/* Magic Link */}
      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 text-center text-gray-500">or</div>

      {/* Social Login */}
      <div className="space-y-3">
        <button
          onClick={handleGoogleLogin}
          className="w-full border py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <span>Continue with Google</span>
        </button>
        <button
          onClick={handleGitHubLogin}
          className="w-full border py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <span>Continue with GitHub</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <p className="mt-4 text-sm text-center text-gray-600">{message}</p>
      )}
    </div>
  );
}
```

---

### 3. 認証コールバック（`app/auth/callback/route.ts`）

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ログイン後のリダイレクト先
  return NextResponse.redirect(new URL('/my-list', request.url));
}
```

---

### 4. Middleware（認証チェック）

**ファイル**: `middleware.ts`

```typescript
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Supabaseセッション更新
  const response = await updateSession(request);

  // 認証が必要なページ
  const protectedPaths = ['/my-list', '/settings', '/review'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // 未認証ならログインページへリダイレクト
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### 5. ログアウト

```typescript
// app/_actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
```

**使用例**:
```typescript
'use client';

import { signOut } from '@/app/_actions/auth';

export function LogoutButton() {
  return (
    <button onClick={() => signOut()}>
      Logout
    </button>
  );
}
```

---

## Row Level Security (RLS)

### RLSポリシー例

#### users テーブル

```sql
-- 自分のプロフィールは読み書き可
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### reviews テーブル

```sql
-- 全員が閲覧可（削除されていない）
CREATE POLICY "Anyone can view active reviews"
  ON reviews FOR SELECT
  USING (deleted_at IS NULL);

-- 自分のレビューのみ作成可
CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のレビューのみ編集可
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分のレビューのみ削除可（ソフトデリート）
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);
```

#### user_channels テーブル（マイリスト）

```sql
-- 自分のマイリストのみアクセス可
CREATE POLICY "Users can manage own list"
  ON user_channels FOR ALL
  USING (auth.uid() = user_id);
```

---

## セッション管理

### セッション有効期限

| トークン種別 | 有効期限 | 用途 |
|-------------|---------|------|
| Access Token | 1時間 | API アクセス |
| Refresh Token | 30日 | Access Token更新 |

### 自動リフレッシュ

Supabase Authは**自動的にRefresh Token**を使用してAccess Tokenを更新します。

---

## セキュリティチェックリスト

### ✅ 認証

- [ ] Supabase Auth設定完了
- [ ] Magic Link動作確認
- [ ] Google OAuth設定（本番のみ）
- [ ] GitHub OAuth設定（オプション）
- [ ] Middlewareで認証チェック実装

### ✅ 認可（RLS）

- [ ] 全テーブルにRLSポリシー設定
- [ ] 自分のデータのみアクセス可能か確認
- [ ] 公開データの閲覧ポリシー設定

### ✅ セッション

- [ ] httpOnly Cookie使用（CSRF対策）
- [ ] SameSite=Lax設定
- [ ] HTTPS強制（本番）

---

## テスト戦略

### E2E Test（Playwright）

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('Magic Link login flow', async ({ page }) => {
  // ログインページ
  await page.goto('/login');
  
  // メールアドレス入力
  await page.fill('input[type="email"]', 'test@example.com');
  
  // Magic Link送信
  await page.click('button[type="submit"]');
  
  // 成功メッセージ確認
  await expect(page.locator('text=Check your email')).toBeVisible();
});

test('Protected page redirect', async ({ page }) => {
  // 未認証でマイリストにアクセス
  await page.goto('/my-list');
  
  // ログインページにリダイレクト
  await expect(page).toHaveURL('/login');
});
```

---

## トラブルシューティング

### Q1: Magic Linkが届かない

**原因**: 
- メールアドレスのtypo
- スパムフォルダに入っている
- Supabase SMTP設定ミス

**解決**:
1. Supabase Dashboard > Authentication > Email Templates
2. SMTP設定確認

### Q2: OAuth認証後に404エラー

**原因**: コールバックURL設定ミス

**解決**:
1. Supabase Dashboard > Authentication > URL Configuration
2. Redirect URLsに`http://localhost:3000/auth/callback`追加
3. 本番URLも追加

### Q3: RLSポリシーでアクセスできない

**原因**: ポリシーの条件ミス

**解決**:
```sql
-- デバッグ用：全てのポリシーを確認
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 一時的にRLS無効化（開発時のみ）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [better-auth skill](https://github.com/mrgoonie/claudekit-skills) (ClaudeKit)
