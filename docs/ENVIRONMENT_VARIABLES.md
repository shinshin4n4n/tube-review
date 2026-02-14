# 環境変数管理設計

> **参照Skill**: `varlock-claude-skill` - セキュア環境変数管理

## 設計方針

### 原則（varlock準拠）
1. **セキュリティファースト**: シークレットは絶対に露出させない
2. **環境分離**: ローカル、プレビュー、ステージング、本番を明確に分離
3. **バリデーション**: 起動時に必須環境変数をチェック
4. **ドキュメント化**: `.env.example`で必要な変数を明示

### セキュリティ要件
- ❌ シークレットをgitにコミットしない
- ❌ ログにシークレットを出力しない
- ❌ エラーメッセージにシークレットを含めない
- ❌ クライアント側にサーバーシークレットを送らない
- ✅ Vercel環境変数で本番シークレットを管理
- ✅ ローカルは`.env.local`（gitignore済み）

---

## 環境変数一覧

### 1. Supabase関連

#### クライアント側（公開可能）
```bash
# .env.local / Vercel環境変数
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**用途**: クライアント側のSupabase接続  
**公開**: ✅ OK（`NEXT_PUBLIC_`プレフィックス）  
**取得方法**: Supabase Dashboard > Settings > API

#### サーバー側（秘密）
```bash
# .env.local / Vercel環境変数
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**用途**: サーバー側のRLSバイパス（管理操作）  
**公開**: ❌ 絶対NG  
**取得方法**: Supabase Dashboard > Settings > API

---

### 2. YouTube Data API

```bash
# .env.local / Vercel環境変数
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**用途**: YouTube APIへのアクセス  
**公開**: ❌ NG（クォータ悪用防止）  
**取得方法**: Google Cloud Console > APIs & Services > Credentials  
**制限**: 
- API制限: 10,000ユニット/日
- HTTPリファラー制限推奨（本番のみ）

---

### 3. 認証・セッション

```bash
# .env.local / Vercel環境変数
NEXTAUTH_SECRET=ランダムな32文字以上の文字列
NEXTAUTH_URL=https://tubereview.app
```

**用途**: セッション暗号化（NextAuth使用時）  
**公開**: ❌ 絶対NG  
**生成方法**: 
```bash
openssl rand -base64 32
```

---

### 4. モニタリング・エラートラッキング

#### Sentry
```bash
# .env.local / Vercel環境変数
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.us.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxx（ビルド時のみ）
```

**用途**: エラートラッキング  
**公開**: `NEXT_PUBLIC_SENTRY_DSN`のみOK

#### Vercel Analytics（設定不要）
Vercel自動検出

---

### 5. CI/CD

```bash
# GitHub Secrets
VERCEL_TOKEN=xxxxx
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx
CODECOV_TOKEN=xxxxx
SNYK_TOKEN=xxxxx
```

**用途**: 自動デプロイ、テストカバレッジ、セキュリティスキャン  
**設定場所**: GitHub Repository > Settings > Secrets

---

## ファイル構成

### プロジェクトルート

```
tube-review/
├── .env.example          # テンプレート（gitコミット）
├── .env.local            # ローカル開発用（gitignore）
├── .env.development      # 開発環境デフォルト値（gitコミット可）
├── .env.production       # 本番環境デフォルト値（gitコミット可）
└── .gitignore            # 必ず .env.local を含める
```

---

## .env.example（テンプレート）

```bash
# ============================================
# ちゅぶれびゅ！ 環境変数テンプレート
# ============================================
# このファイルをコピーして .env.local を作成してください
# cp .env.example .env.local

# ============================================
# Supabase
# ============================================
# 取得方法: Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# サーバー側専用（RLSバイパス）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# YouTube Data API
# ============================================
# 取得方法: Google Cloud Console > APIs & Services > Credentials
# クォータ: 10,000ユニット/日
YOUTUBE_API_KEY=your-youtube-api-key

# ============================================
# 認証（NextAuth）
# ============================================
# 生成方法: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# ============================================
# モニタリング
# ============================================
# Sentry（オプション）
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx.ingest.us.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=  # ビルド時のみ必要

# ============================================
# 開発用（オプション）
# ============================================
# ログレベル（debug, info, warn, error）
LOG_LEVEL=debug

# Node環境（通常は自動設定）
NODE_ENV=development
```

---

## .env.local（ローカル開発）

**注意**: このファイルは`.gitignore`に含める

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc...

# YouTube API
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# NextAuth
NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000

# 開発用
LOG_LEVEL=debug
```

---

## 環境変数バリデーション

### 起動時チェック（必須）

**ファイル**: `lib/env.ts`

```typescript
import { z } from 'zod';

// 環境変数スキーマ
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // YouTube API
  YOUTUBE_API_KEY: z.string().min(1),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // オプション
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Node環境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// バリデーション実行
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL,
  NODE_ENV: process.env.NODE_ENV,
});

// 型安全な環境変数として export
export type Env = z.infer<typeof envSchema>;
```

**使い方**:
```typescript
import { env } from '@/lib/env';

// 型安全にアクセス
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
```

---

## Vercel環境変数設定

### ダッシュボードで設定

1. Vercel Dashboard > プロジェクト選択
2. Settings > Environment Variables
3. 各環境ごとに設定:
   - **Production**: 本番用シークレット
   - **Preview**: プレビュー用（Productionと同じでOK）
   - **Development**: ローカル開発用（`.env.local`と同期）

### 環境ごとの値

| 変数名 | Production | Preview | Development |
|--------|-----------|---------|-------------|
| SUPABASE_URL | 本番URL | 本番URL | 開発URL |
| YOUTUBE_API_KEY | 本番Key（制限あり） | 本番Key | 開発Key |
| NEXTAUTH_SECRET | 本番Secret | 本番Secret | 開発Secret |
| NEXTAUTH_URL | https://tubereview.app | https://xxx-preview.vercel.app | http://localhost:3000 |

---

## セキュリティチェックリスト

### ✅ 開発時

- [ ] `.env.local`を`.gitignore`に追加
- [ ] `.env.example`をgitにコミット
- [ ] 環境変数バリデーション実装（`lib/env.ts`）
- [ ] シークレットをログ出力しない

### ✅ レビュー時

- [ ] PRに`.env.local`が含まれていないか確認
- [ ] ハードコードされたシークレットがないか確認
- [ ] `console.log()`でシークレット出力していないか確認

### ✅ デプロイ時

- [ ] Vercel環境変数が全て設定済みか確認
- [ ] 本番環境のシークレットをローテーション（定期）
- [ ] YouTube API制限を設定（HTTPリファラー制限）

---

## エラーハンドリング

### 環境変数が不足している場合

```typescript
// lib/env.ts
try {
  export const env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:');
  console.error(error);
  
  // 開発環境でのみ詳細表示
  if (process.env.NODE_ENV === 'development') {
    console.error('\n📋 Required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('- YOUTUBE_API_KEY');
    console.error('- NEXTAUTH_SECRET');
    console.error('- NEXTAUTH_URL');
    console.error('\n💡 Copy .env.example to .env.local and fill in the values');
  }
  
  process.exit(1);
}
```

---

## ローカル開発セットアップ手順

### 初回セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/your-username/tube-review.git
cd tube-review

# 2. 依存関係インストール
npm install

# 3. 環境変数ファイル作成
cp .env.example .env.local

# 4. .env.local を編集（実際の値を入力）
# エディタで開いて各値を設定

# 5. バリデーション確認
npm run dev
# エラーが出なければ成功
```

---

## トラブルシューティング

### Q1: `NEXT_PUBLIC_` がクライアントで undefined

**原因**: Next.js の仕様で、`NEXT_PUBLIC_`プレフィックスがないとクライアントで使えない

**解決**:
```typescript
// ❌ ダメな例
const apiKey = process.env.YOUTUBE_API_KEY; // クライアント側で undefined

// ✅ 良い例
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // OK
```

### Q2: Vercel デプロイで環境変数が反映されない

**原因**: Vercel環境変数の設定忘れ

**解決**:
1. Vercel Dashboard > Settings > Environment Variables
2. 必要な変数を全て設定
3. Redeploy

### Q3: YouTube API が 403 エラー

**原因**: API Key の制限設定

**解決**:
1. Google Cloud Console > Credentials
2. API Key の制限を確認
3. HTTPリファラー制限が厳しすぎる場合は緩和

---

## 参考資料

- [varlock-claude-skill](https://github.com/wrsmith108/varlock-claude-skill)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
