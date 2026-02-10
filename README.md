# TubeReview 🎬

<div align="center">

**YouTubeチャンネルを発見・レビュー・管理できるプラットフォーム**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.93.3-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[デモ](#) | [ドキュメント](./docs) | [コントリビューション](./CONTRIBUTING.md) | [変更履歴](./CHANGELOG.md)

</div>

---

## 📋 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [プロジェクト構成](#プロジェクト構成)
- [ドキュメント](#ドキュメント)
- [コントリビューション](#コントリビューション)
- [ライセンス](#ライセンス)

---

## 🎯 概要

**TubeReview**は、YouTubeチャンネルの発見・レビュー・管理を支援するWebアプリケーションです。

### なぜTubeReviewなのか？

- 🔍 **発見**: 高品質なYouTubeチャンネルを見つける
- ⭐ **レビュー**: 他のユーザーと意見を共有
- 📚 **管理**: 見たいチャンネルをリスト化
- 🏆 **ランキング**: 人気チャンネルを一目で確認

### 対象ユーザー

- YouTubeで新しいチャンネルを探している人
- チャンネルのレビューを読みたい人
- 見たいチャンネルを整理したい人
- おすすめのチャンネルを共有したい人

---

## ✨ 主な機能

### 🔍 チャンネル検索

- YouTube Data API v3による高速検索
- カテゴリ別フィルタリング
- リアルタイムサジェスト
- 検索履歴保存

### ⭐ レビュー機能

- 5段階評価
- テキストレビュー（10-5000文字）
- 「参考になった」ボタン
- レビュー編集・削除

### 📚 マイリスト管理

- 「見たい」「見ている」「見た」の3ステータス
- プライベート/公開設定
- カスタムリスト作成
- リスト共有機能

### 🏆 ランキング

- 週間人気チャンネル
- 新着レビュー
- 評価順ソート
- カテゴリ別ランキング

### 👤 ユーザープロフィール

- プロフィール編集（名前、自己紹介、都道府県）
- アバター画像アップロード
- レビュー履歴表示
- マイリスト管理

### 🔐 認証

- Magic Link認証（メールアドレス）
- OAuth認証（Google）
- セッション管理
- Row Level Security (RLS)

---

## 🛠️ 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| [Next.js](https://nextjs.org/) | 16.1.6 | Reactフレームワーク (App Router + Turbopack) |
| [React](https://react.dev/) | 19.2.3 | UIライブラリ |
| [TypeScript](https://www.typescriptlang.org/) | 5 | 型安全性 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | スタイリング |
| [Radix UI](https://www.radix-ui.com/) | - | アクセシブルなUIコンポーネント |
| [Lucide React](https://lucide.dev/) | - | アイコン |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| [Supabase](https://supabase.com/) | 2.93.3 | 認証・データベース・ストレージ |
| [PostgreSQL](https://www.postgresql.org/) | - | データベース (Supabase経由) |
| [YouTube Data API v3](https://developers.google.com/youtube/v3) | - | チャンネル情報取得 |
| [Upstash Redis](https://upstash.com/) | - | 高速キャッシュ（2層キャッシュ戦略） |

### バリデーション・ユーティリティ

| 技術 | バージョン | 用途 |
|------|-----------|------|
| [Zod](https://zod.dev/) | 4.3.6 | スキーマバリデーション |
| [date-fns](https://date-fns.org/) | 4.1.0 | 日付処理 |

### 開発ツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| [ESLint](https://eslint.org/) | 9 | 静的解析 |
| [Prettier](https://prettier.io/) | 3.8.1 | コードフォーマット |
| [Vitest](https://vitest.dev/) | 4.0.18 | ユニットテスト |
| [Playwright](https://playwright.dev/) | 1.58.1 | E2Eテスト |

### インフラ・CI/CD

| 技術 | 用途 |
|------|------|
| [Vercel](https://vercel.com/) | ホスティング・デプロイ |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

---

## 🚀 セットアップ

### 必要要件

- **Node.js**: 18.17以上
- **npm**: 9以上（または yarn/pnpm）
- **Git**: 2.x以上

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

`.env.local` ファイルを作成:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth (Optional)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

詳細な環境変数の説明は [DEPLOYMENT.md](./docs/DEPLOYMENT.md) を参照してください。

### 4. Supabaseデータベースのセットアップ

マイグレーションを実行:

```bash
# Supabase CLIのインストール（初回のみ）
npm install -g supabase

# ローカルSupabaseの起動
supabase start

# マイグレーション実行
supabase db reset
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

---

## 💻 開発

### 開発サーバー

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 本番サーバー起動

```bash
npm run start
```

### リント

```bash
# リントチェック
npm run lint

# リント自動修正
npm run lint:fix
```

### バンドル分析

```bash
npm run analyze
```

---

## 🧪 テスト

### ユニットテスト

```bash
# テスト実行
npm run test

# テスト実行（ウォッチモード）
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# UI付きテスト
npm run test:ui
```

### E2Eテスト

```bash
# Playwrightテスト実行
npm run test:e2e

# Playwrightテスト（UIモード）
npm run test:e2e:ui
```

---

## 🚢 デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com/)にログイン
2. プロジェクトをインポート
3. 環境変数を設定
4. デプロイ

詳細な手順は [DEPLOYMENT.md](./docs/DEPLOYMENT.md) を参照してください。

### 環境変数の設定

本番環境では以下の環境変数を設定してください:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

---

## 📁 プロジェクト構成

```
tube-review/
├── app/                    # Next.js App Router
│   ├── _actions/          # Server Actions
│   ├── _components/       # ページ固有コンポーネント
│   ├── api/               # API Routes
│   ├── about/             # Aboutページ
│   ├── channels/          # チャンネル詳細ページ
│   ├── profile/           # プロフィールページ
│   ├── ranking/           # ランキングページ
│   ├── search/            # 検索ページ
│   └── layout.tsx         # ルートレイアウト
├── components/            # 再利用可能コンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   └── ui/               # UIコンポーネント (Radix UI)
├── lib/                   # ユーティリティ関数
│   ├── supabase/         # Supabaseクライアント
│   ├── validations/      # Zodスキーマ
│   ├── logger.ts         # ロガー
│   └── env.ts            # 環境変数バリデーション
├── types/                 # TypeScript型定義
├── public/                # 静的ファイル
├── docs/                  # ドキュメント
│   ├── DEPLOYMENT.md      # デプロイ手順
│   ├── OPERATION.md       # 運用マニュアル
│   ├── TROUBLESHOOTING.md # トラブルシューティング
│   ├── PERFORMANCE.md     # パフォーマンス最適化
│   ├── SEO.md            # SEO対応
│   ├── ERROR_PAGES.md    # エラーページ
│   └── SECURITY_AUDIT.md # セキュリティ監査
├── supabase/              # Supabaseマイグレーション
│   └── migrations/       # データベースマイグレーション
├── tests/                 # テスト
│   └── e2e/              # E2Eテスト
├── .github/               # GitHub設定
│   └── workflows/        # GitHub Actions
├── next.config.ts         # Next.js設定
├── tailwind.config.ts     # Tailwind CSS設定
├── tsconfig.json          # TypeScript設定
├── vitest.config.ts       # Vitest設定
└── playwright.config.ts   # Playwright設定
```

---

## 📚 ドキュメント

### 開発ドキュメント

- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - デプロイ手順
- [OPERATION.md](./docs/OPERATION.md) - 運用マニュアル
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - トラブルシューティング
- [CONTRIBUTING.md](./CONTRIBUTING.md) - コントリビューションガイド

### 技術ドキュメント

- [PERFORMANCE.md](./docs/PERFORMANCE.md) - パフォーマンス最適化
- [SEO.md](./docs/SEO.md) - SEO対応
- [ERROR_PAGES.md](./docs/ERROR_PAGES.md) - エラーページ
- [SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md) - セキュリティ監査

### その他

- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴
- [SECURITY.md](./SECURITY.md) - セキュリティポリシー

---

## 🤝 コントリビューション

コントリビューションを歓迎します！以下の手順でプルリクエストを作成してください:

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

### コミットメッセージ規約

Conventional Commitsに従ってください:

```
feat: 新機能
fix: バグ修正
docs: ドキュメント変更
style: コードスタイル変更（フォーマット等）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルドプロセス・補助ツール変更
```

---

## 📄 ライセンス

このプロジェクトは [MIT License](./LICENSE) の下で公開されています。

---

## 👥 作者

**shinshin4n4n**

- GitHub: [@shinshin4n4n](https://github.com/shinshin4n4n)
- プロジェクト: [tube-review](https://github.com/shinshin4n4n/tube-review)

---

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Supabase](https://supabase.com/) - バックエンドプラットフォーム
- [Vercel](https://vercel.com/) - ホスティング
- [YouTube Data API](https://developers.google.com/youtube/v3) - チャンネル情報
- [Radix UI](https://www.radix-ui.com/) - UIコンポーネント

---

<div align="center">

**⭐ このプロジェクトが役立った場合は、GitHubでスターを付けてください！**

Made with ❤️ by shinshin4n4n

</div>
