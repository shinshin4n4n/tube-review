# 開発環境セットアップ

TubeReviewの開発環境構築手順と開発用ツールの使用方法を説明します。

## 基本セットアップ

### 1. 依存関係のインストール

```bash
# 開発環境（初回セットアップ）
npm install

# CI/本番環境（厳密な再現性が必要）
npm ci  # package-lock.json を厳密に適用
```

### 2. 環境変数の設定

`.env.local` を作成し、以下の環境変数を設定してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# YouTube
YOUTUBE_API_KEY=xxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 開発サーバー起動

```bash
npm run dev
```

## 認証方法

開発環境では以下の認証方法が利用可能です。

### 推奨: Google OAuth

- **メリット**: ワンクリックログイン、本番環境と同じフロー
- **セットアップ**: Supabase管理画面で既に設定済み
- **使用方法**: ログインページの「Googleでログイン」ボタンをクリック

### Magic Link

- **メリット**: 実際のメール送信フローを検証可能
- **セットアップ**: 不要（Supabase Authが自動処理）
- **使用方法**: メールアドレスを入力してリンクを受信

### オプション: 開発用ログインエンドポイント

パスワード不要の簡易ログインが必要な場合、以下の手順で手動作成できます。

**注意**: このエンドポイントは `.gitignore` に含まれており、リポジトリにコミットされません。

#### 作成手順

1. `app/api/auth/dev-login/route.ts` を作成
2. 以下のコードをコピー:

```typescript
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

/**
 * 開発環境専用：即座にログインできるエンドポイント
 * 本番環境では無効化される
 */
export async function POST(request: Request) {
  // 本番環境では無効
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // OTPで既存ユーザーのみログイン可能
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // セキュリティ: 既存ユーザーのみ
      },
    });

    if (error) {
      return NextResponse.json(
        { error: "Development login failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to email (check your inbox)",
    });
  } catch (error) {
    console.error("[Dev Login] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

3. 使用方法:

```bash
# cURLで使用
curl -X POST http://localhost:3000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**重要**: 本番環境へのセキュリティリスクを避けるため、このファイルはコミットしないでください。

## テスト実行

### ユニットテスト

```bash
# 全テスト実行
npm run test:unit

# カバレッジ付き
npm run test:unit -- --coverage

# 特定ファイルのみ
npm run test:unit -- path/to/file.test.ts
```

### E2Eテスト

```bash
# 全E2Eテスト実行
npm run test:e2e

# UIモード（デバッグ用）
npm run test:e2e:ui

# 特定ブラウザのみ
npm run test:e2e -- --project=chromium
```

## コード品質チェック

### Lint

```bash
npm run lint

# 自動修正
npm run lint -- --fix
```

### フォーマット

```bash
# フォーマット確認
npm run format:check

# 自動フォーマット
npm run format
```

### 型チェック

```bash
npx tsc --noEmit
```

## Docker環境

### 開発環境（ホットリロード有効）

```bash
docker-compose -f docker-compose.dev.yml up
```

### 本番環境相当

```bash
docker-compose up --build
```

## トラブルシューティング

### ログインできない

1. `.env.local` の環境変数が正しく設定されているか確認
2. Supabase管理画面でユーザーが存在するか確認
3. Google OAuthを試す（最も確実）

### テストが失敗する

```bash
# キャッシュクリア
rm -rf node_modules/.vite
npm run test:unit -- --clearCache
```

### ビルドエラー

```bash
# 型エラー確認
npx tsc --noEmit

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

## 依存パッケージ管理

### インストール方法

```bash
# 開発環境（初回セットアップ）
npm install

# CI/本番環境（厳密な再現性が必要）
npm ci  # package-lock.json を厳密に適用
```

### 本番依存パッケージの更新

本番依存パッケージは固定バージョンで管理しています。

- **自動更新**: Dependabot が週次で PR を作成
- **手動更新**: `npm install <package>@<version> --save-exact`

詳細は [CLAUDE.md](../CLAUDE.md#dependency-management) を参照してください。

## 参考ドキュメント

- [CLAUDE.md](../CLAUDE.md) - AI開発ガイド、コーディング規約
- [README.md](../README.md) - プロジェクト概要、機能説明
