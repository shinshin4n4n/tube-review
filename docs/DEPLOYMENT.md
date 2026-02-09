# デプロイガイド

TubeReviewアプリケーションの本番環境へのデプロイ手順です。

## 📋 目次

- [前提条件](#前提条件)
- [Supabaseセットアップ](#supabaseセットアップ)
- [Vercelデプロイ](#vercelデプロイ)
- [環境変数設定](#環境変数設定)
- [ドメイン設定](#ドメイン設定)
- [デプロイ後の確認](#デプロイ後の確認)
- [継続的デプロイ](#継続的デプロイ)

---

## ✅ 前提条件

デプロイ前に以下を準備してください:

- ✅ GitHub アカウント
- ✅ Vercel アカウント
- ✅ Supabase アカウント
- ✅ YouTube Data API キー
- ✅ Googleアカウント（OAuth用）

---

## 🗄️ Supabaseセットアップ

### 1. Supabaseプロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. **New Project**をクリック
3. プロジェクト情報を入力:
   - **Name**: \`tube-review\` (任意)
   - **Database Password**: 強力なパスワードを生成
   - **Region**: \`Tokyo (ap-northeast-1)\` または最寄りのリージョン
4. **Create new project**をクリック

### 2. データベース初期化

#### 方法A: Supabase CLI経由（推奨）

\`\`\`bash
# Supabase CLIインストール（初回のみ）
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push
\`\`\`

#### 方法B: SQL Editor経由

1. Supabase Dashboard → **SQL Editor**を開く
2. `supabase/migrations/`フォルダ内の全ファイルを順番に実行

### 3. 認証設定

#### Magic Link認証

1. **Authentication** → **Providers**を開く
2. **Email**プロバイダーを有効化
3. **Enable email confirmations**をOFF（開発用）または ON（本番用）

#### Google OAuth認証

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**作成
3. Authorized redirect URIs: `https://[your-project-ref].supabase.co/auth/v1/callback`
4. Client IDとClient SecretをSupabase Dashboardに設定

### 4. Storage設定

**avatarsバケット**は自動的にマイグレーションで作成されます。

Supabase Dashboard → **Storage**で確認してください。

### 5. APIキーの取得

**Settings** → **API**から以下をコピー:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **秘密にする**

---

## 🚀 Vercelデプロイ

### 1. Vercelプロジェクト作成

[Vercel Dashboard](https://vercel.com/dashboard)にアクセス:

1. **Add New** → **Project**
2. GitHubリポジトリを選択（`tube-review`）
3. **Import**をクリック

### 2. プロジェクト設定

- **Framework Preset**: Next.js（自動検出）
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3. 環境変数設定

**Settings** → **Environment Variables**で以下を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# YouTube Data API
YOUTUBE_API_KEY=[your-youtube-api-key]

# Next.js
NEXT_PUBLIC_SITE_URL=https://[your-domain].vercel.app
NEXT_PUBLIC_APP_URL=https://[your-domain].vercel.app

# NextAuth
NEXTAUTH_SECRET=[random-32-chars-or-more]
NEXTAUTH_URL=https://[your-domain].vercel.app
```

⚠️ **重要**: 全ての環境（Production, Preview, Development）で設定

**NEXTAUTH_SECRET生成**:
```bash
openssl rand -base64 32
```

### 4. デプロイ実行

1. **Deploy**ボタンをクリック
2. ビルドログを確認
3. デプロイ完了を待つ（2-5分）

---

## 🔐 環境変数設定

### 必須環境変数一覧

| 変数名 | 説明 | 取得方法 |
|--------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase公開キー | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスキー | 同上 ⚠️ **秘密** |
| `YOUTUBE_API_KEY` | YouTube API キー | Google Cloud Console |
| `NEXTAUTH_SECRET` | 認証シークレット | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | アプリURL | Vercel URL |
| `NEXT_PUBLIC_SITE_URL` | サイトURL | Vercel URL |
| `NEXT_PUBLIC_APP_URL` | アプリURL | Vercel URL |

### 環境変数の検証

環境変数は起動時に自動検証されます（`lib/env.ts`）。

---

## 🌐 ドメイン設定

### カスタムドメインの追加

1. Vercel Dashboard → **Settings** → **Domains**
2. **Add**をクリック
3. ドメイン名を入力

### DNSレコード設定

**Aレコード**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAMEレコード**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

DNS反映まで最大48時間かかります。

### SSL証明書

- Vercelが自動的にLet's Encrypt証明書を発行
- 90日ごとに自動更新

---

## ✅ デプロイ後の確認

### 1. アプリケーション動作確認

- ✅ トップページが表示される
- ✅ チャンネル検索が動作する
- ✅ ログインができる
- ✅ レビュー投稿ができる
- ✅ プロフィール編集ができる

### 2. セキュリティヘッダー確認

開発者ツールで以下を確認:
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000
```

### 3. パフォーマンス確認

[PageSpeed Insights](https://pagespeed.web.dev/)でスコア確認:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### 4. データベース接続確認

Supabase Dashboard → **Database**で接続数を確認

### 5. エラーログ確認

Vercel Dashboard → **Deployments**でエラーがないか確認

---

## 🔄 継続的デプロイ (CI/CD)

### 自動デプロイ

- **mainブランチへのプッシュ** → 本番環境に自動デプロイ
- **プルリクエスト作成** → プレビュー環境に自動デプロイ

### GitHub Actions

`.github/workflows/ci.yml`で自動テスト実行

---

## 🔧 トラブルシューティング

### ビルドエラー

**エラー**: `Environment variable validation failed`

**解決策**:
1. Vercel Dashboardで環境変数を確認
2. 必須変数が全て設定されているか確認
3. `lib/env.ts`のスキーマと照合

### データベース接続エラー

**エラー**: `Connection pool timeout`

**解決策**:
1. Supabase Dashboard → **Database**を確認
2. 接続プールサイズを増やす

### OAuth認証エラー

**エラー**: `Redirect URI mismatch`

**解決策**:
1. Google Cloud ConsoleでAuthorized redirect URIsを確認
2. SupabaseのCallback URLを追加

詳細は [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照してください。

---

## 📊 デプロイチェックリスト

### デプロイ前

- [ ] 全てのテストが通る
- [ ] Lintエラーがない
- [ ] 環境変数が全て設定されている
- [ ] Supabaseマイグレーションが完了
- [ ] セキュリティ監査が完了

### デプロイ後

- [ ] アプリケーションが正常に動作
- [ ] セキュリティヘッダーが設定されている
- [ ] パフォーマンススコアが90+
- [ ] データベース接続が正常
- [ ] エラーログがない

---

## 📚 参考資料

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**最終更新**: 2026-02-08
**バージョン**: 1.0
