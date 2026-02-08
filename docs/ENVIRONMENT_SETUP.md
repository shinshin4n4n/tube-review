# 環境構築ガイド

TubeReviewプロジェクトの開発環境・本番環境の構築手順です。

## 📋 目次

- [前提条件](#前提条件)
- [ローカル開発環境](#ローカル開発環境)
- [本番環境（Supabase）](#本番環境supabase)
- [本番環境（YouTube API）](#本番環境youtube-api)
- [本番環境（Vercel）](#本番環境vercel)
- [環境変数一覧](#環境変数一覧)
- [トラブルシューティング](#トラブルシューティング)

## 🔧 前提条件

### 必須ツール

- **Node.js**: v20以上
- **npm**: v9以上
- **Git**: 最新版
- **Supabase CLI**: 最新版（ローカル開発時）

### アカウント

- **GitHub**: リポジトリアクセス用
- **Supabase**: データベース用
- **Google Cloud Platform**: YouTube API用
- **Vercel**: デプロイ用

## 💻 ローカル開発環境

### 1. リポジトリのクローン

```bash
git clone https://github.com/shinshin4n4n/tube-review.git
cd tube-review
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env.local
```

`.env.local`を編集して、以下の値を設定：

```bash
# Supabase（開発用）
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# YouTube API（開発用）
YOUTUBE_API_KEY=your-youtube-api-key
```

### 4. Supabaseローカル起動（オプション）

```bash
# Dockerが起動していることを確認
docker --version

# Supabaseローカル環境を起動
npx supabase start

# マイグレーション実行
npx supabase db reset
```

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 にアクセスして動作確認

## 🗄️ 本番環境（Supabase）

### 1. Supabaseプロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. **New Project** をクリック
3. プロジェクト情報を入力：
   - **Name**: `tube-review-production`
   - **Database Password**: 強力なパスワードを生成
   - **Region**: `Northeast Asia (Tokyo)`（推奨）
   - **Pricing Plan**: Free または Pro
4. **Create new project** をクリック
5. プロジェクトの作成完了を待つ（数分）

### 2. API認証情報の取得

1. **Settings** > **API** に移動
2. 以下の値をコピー：
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` ⚠️極秘

### 3. マイグレーション実行

#### 方法1: Supabase Dashboard（推奨）

1. **SQL Editor** を開く
2. `supabase/migrations`フォルダ内の各ファイルを順番に実行：
   ```
   20260203000000_initial_schema.sql
   20260204000000_create_user_on_signup.sql
   20260204000001_fix_quota_usage_rls.sql
   20260207000002_fix_channels_rls.sql
   20260207000003_fix_youtube_cache_rls.sql
   20260207000004_add_view_count_to_channels.sql
   20260208000000_implement_incremental_channel_stats.sql
   ```
3. 各ファイルの内容をコピー＆ペーストして **Run** をクリック

#### 方法2: Supabase CLI

```bash
# Supabaseにログイン
npx supabase login

# プロジェクトとリンク
npx supabase link --project-ref your-project-ref

# マイグレーションをプッシュ
npx supabase db push
```

### 4. Storage設定（アバター画像用）

1. **Storage** > **Buckets** に移動
2. **New bucket** をクリック
3. バケット情報を入力：
   - **Name**: `avatars`
   - **Public**: ✅ ON
4. **Create bucket** をクリック
5. バケットのポリシー設定：
   - **Policies** タブを開く
   - **New policy** をクリック
   - テンプレート: **Allow public read access**
   - **Save policy** をクリック

### 5. RLSポリシー確認

以下のテーブルのRLSが有効になっているか確認：

```sql
-- 確認用SQL
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'reviews',
    'user_channels',
    'custom_lists',
    'list_channels',
    'review_helpful',
    'quota_usage',
    'channel_stats'
  );
```

全てのテーブルで`rowsecurity = true`であることを確認。

### 6. プロダクション準備チェック

Supabaseの[本番環境チェックリスト](https://supabase.com/docs/guides/platform/going-into-prod)を確認：

- [ ] RLSポリシー設定完了
- [ ] Storage CORS設定確認
- [ ] Connection Pooling有効化（Pro以上）
- [ ] バックアップ設定（Pro以上）
- [ ] カスタムドメイン設定（オプション）

## 🎥 本番環境（YouTube API）

### 1. Google Cloud Platformプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成：
   - **Project name**: `tube-review-production`
   - **Location**: Organization（任意）
3. **Create** をクリック

### 2. YouTube Data API v3を有効化

1. **APIs & Services** > **Library** に移動
2. "YouTube Data API v3" を検索
3. **Enable** をクリック

### 3. APIキーの作成

1. **APIs & Services** > **Credentials** に移動
2. **Create Credentials** > **API key** をクリック
3. APIキーが作成される

### 4. APIキーの制限設定（重要）

1. 作成したAPIキーの **Edit** をクリック
2. **Application restrictions**:
   - **HTTP referrers (web sites)** を選択
   - 以下のリファラーを追加：
     ```
     https://your-domain.vercel.app/*
     https://*.vercel.app/*  # Preview環境用
     ```
3. **API restrictions**:
   - **Restrict key** を選択
   - **YouTube Data API v3** のみ選択
4. **Save** をクリック

### 5. クォータ管理

1. **APIs & Services** > **Quotas** に移動
2. YouTube Data API v3のクォータを確認：
   - **無料プラン**: 10,000ユニット/日
   - **課金プラン**: 必要に応じて増加可能
3. クォータアラートの設定（推奨）：
   - **Monitoring** > **Alerting** で設定

## 🚀 本番環境（Vercel）

### 1. Vercelプロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. **Add New** > **Project** をクリック
3. GitHubリポジトリ `tube-review` を選択
4. **Import** をクリック

### 2. プロジェクト設定

- **Framework Preset**: Next.js（自動検出）
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. 環境変数設定

1. **Settings** > **Environment Variables** に移動
2. 以下の環境変数を追加（**Preview**と**Production**両方にチェック）：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Anon Key |
| `YOUTUBE_API_KEY` | `AIzaSy...` | YouTube Data API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Service Role Key ⚠️ |

⚠️ **セキュリティ注意**:
- 本番環境の値は必ずVercel環境変数で管理
- ローカルの`.env.local`には開発環境の値のみ
- Secretsは絶対にGitにコミットしない

### 4. Git連携設定

1. **Git** タブで以下を確認：
   - **Production Branch**: `main`
   - **Automatic Deployments**: ON

2. **Deployment Protection**（Pro以上）:
   - Preview Deploymentにパスワード保護可能

### 5. カスタムドメイン設定（オプション）

1. **Settings** > **Domains** に移動
2. カスタムドメインを追加
3. DNSレコードを設定（Vercelの指示に従う）

## 📚 環境変数一覧

### 必須環境変数

| 変数名 | 必須 | 説明 | 取得方法 |
|--------|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | SupabaseプロジェクトURL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase匿名キー | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabaseサービスロールキー | Supabase Dashboard > Settings > API |
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API v3キー | Google Cloud Console > Credentials |

### オプション環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXTAUTH_SECRET` | ❌ | NextAuth秘密鍵（現在未使用） |
| `NEXTAUTH_URL` | ❌ | NextAuth URL（現在未使用） |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry DSN（エラー監視） |
| `SENTRY_AUTH_TOKEN` | ❌ | Sentryビルドトークン |
| `LOG_LEVEL` | ❌ | ログレベル（debug/info/warn/error） |
| `NODE_ENV` | ❌ | Node環境（自動設定） |

## 🐛 トラブルシューティング

### Supabase接続エラー

**エラー**: `Error: Invalid Supabase URL`

**解決策**:
1. `NEXT_PUBLIC_SUPABASE_URL`が正しいか確認
2. URLの末尾に`/`がないか確認（不要）
3. `https://`プロトコルが含まれているか確認

### YouTube API エラー

**エラー**: `API key not valid`

**解決策**:
1. APIキーが正しいか確認
2. YouTube Data API v3が有効化されているか確認
3. APIキーの制限設定を確認
4. クォータを超過していないか確認

### RLS（Row Level Security）エラー

**エラー**: `new row violates row-level security policy`

**解決策**:
1. 該当テーブルのRLSポリシーを確認
2. ユーザーが認証されているか確認
3. `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認

### ビルドエラー

**エラー**: `Module not found`

**解決策**:
1. `npm install`を実行
2. `node_modules`を削除して再インストール
3. Next.jsのキャッシュをクリア: `rm -rf .next`

### Vercel デプロイエラー

**エラー**: `Build failed`

**解決策**:
1. ローカルで`npm run build`が成功するか確認
2. Vercelの環境変数が正しく設定されているか確認
3. Vercelのビルドログを確認
4. `package.json`の`engines`フィールドを確認

## 📞 サポート

問題が解決しない場合：

1. **GitHubイシュー**: [Issues](https://github.com/shinshin4n4n/tube-review/issues)
2. **ドキュメント確認**:
   - [Supabase Docs](https://supabase.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
3. **ログ確認**:
   - Vercel: Dashboard > Deployments > Function Logs
   - Supabase: Dashboard > Logs

---

**最終更新**: 2026-02-08
