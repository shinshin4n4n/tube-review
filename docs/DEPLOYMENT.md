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
2. 以下のマイグレーションファイルを順番に実行:
   - \`supabase/migrations/20260203000000_initial_schema.sql\`
   - その他全てのマイグレーションファイル

詳細は [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照してください。

---

**最終更新**: 2026-02-08
**バージョン**: 1.0
