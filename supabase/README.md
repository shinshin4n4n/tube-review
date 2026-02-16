# Supabase セットアップ手順

## 前提条件

- Supabaseアカウント作成済み
- `.env.local` に環境変数が設定済み

## 1. Supabaseプロジェクト作成（Web UI）

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: `tubereview`
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
4. 「Create new project」をクリック
5. プロジェクト作成完了を待つ（数分かかります）

## 2. 環境変数の取得

1. Supabase Dashboard > Settings > API
2. 以下の値をコピー：
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` ⚠️ 秘密鍵

3. `.env.local` に設定：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. マイグレーション実行

### オプションA: SQL Editorで実行（推奨）

1. Supabase Dashboard > SQL Editor
2. 「New query」をクリック
3. `supabase/migrations/20260203000000_initial_schema.sql` の内容をコピー&ペースト
4. 「Run」をクリック
5. エラーがないことを確認

### オプションB: Supabase CLI（ローカル開発用）

```bash
# Supabase CLI インストール（未インストールの場合）
npm install -g supabase

# ログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref <your-project-ref>

# マイグレーション実行
supabase db push
```

## 4. RLS（Row Level Security）確認

1. Supabase Dashboard > Authentication > Policies
2. 各テーブルにポリシーが設定されているか確認：
   - `users`: 3 policies
   - `reviews`: 3 policies
   - `user_channels`: 2 policies
   - `lists`: 3 policies
   - など

## 5. 動作確認

### テーブル作成確認

```sql
-- Supabase SQL Editorで実行
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

期待される結果：

- channels
- channel_stats (Materialized View)
- list_channels
- list_likes
- lists
- review_helpful
- reviews
- top_videos
- user_channels
- user_follows
- user_settings
- users

### インデックス確認

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### RLS確認

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 6. OAuth設定（オプション）

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
3. Authorized redirect URIs に追加：
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
4. Client ID と Client Secret を取得
5. Supabase Dashboard > Authentication > Providers > Google
6. 「Enable Google Provider」を有効化
7. Client ID と Client Secret を入力

### GitHub OAuth

1. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App
2. Authorization callback URL:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
3. Client ID と Client Secret を取得
4. Supabase Dashboard > Authentication > Providers > GitHub
5. 「Enable GitHub Provider」を有効化
6. Client ID と Client Secret を入力

## 7. ローカルSupabase環境（Docker）

### セットアップ

ローカルでSupabase環境を起動することで、本番環境に影響を与えずにマイグレーションをテストできます。

#### 必要要件

- Docker Desktop インストール済み
- Supabase CLI インストール済み

```bash
# Supabase CLI インストール（未インストールの場合）
npm install -g supabase
```

#### ローカルSupabase起動

```bash
# Supabaseローカル環境起動（初回は時間がかかります）
npm run db:start
# または
supabase start

# ステータス確認
npm run db:status
# または
supabase status
```

**出力例:**

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
```

#### マイグレーション適用

```bash
# 全マイグレーションを適用
npm run db:reset
# または
supabase db reset
```

#### Supabase Studio でデータ確認

ブラウザで http://localhost:54323 を開くと、Supabase Studio（管理画面）にアクセスできます。

#### ローカルSupabase停止

```bash
# Supabase停止
npm run db:stop
# または
supabase stop
```

### トラブルシューティング（ローカル環境）

#### エラー: "Docker is not running"

- Docker Desktop を起動してください

#### エラー: "Port already in use"

- 既にSupabaseが起動している可能性があります
- `supabase stop` で停止してから再起動

#### マイグレーションをやり直したい

```bash
# データベースをリセットして全マイグレーションを再適用
supabase db reset
```

## 8. ローカル開発で接続確認

```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# エラーが出なければ成功
```

## トラブルシューティング

### エラー: "relation does not exist"

- マイグレーションが正しく実行されていない
- SQL Editorでマイグレーションを再実行

### エラー: "Invalid API key"

- `.env.local` の環境変数が正しく設定されているか確認
- 開発サーバーを再起動

### エラー: "Row level security is enabled"

- RLSポリシーが正しく設定されているか確認
- 未認証の状態で保護されたテーブルにアクセスしていないか確認

## 定期メンテナンス

### Materialized View更新

```sql
-- 手動更新
SELECT refresh_channel_stats();

-- または
REFRESH MATERIALIZED VIEW CONCURRENTLY channel_stats;
```

### 統計情報更新

```sql
ANALYZE;
```

## 参考資料

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
