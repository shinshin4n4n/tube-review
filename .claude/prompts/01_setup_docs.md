# プロンプト: プロジェクトドキュメント作成

## 目的
プロジェクトのコンセプトドキュメントとREADMEを作成する

## 実行日
2026-01-30

## 技術スタック選定
Context7 スキルで確認した最新の推奨バージョン：
- Next.js: v16.x (latest)
- TypeScript: v5.9.x (latest)
- Tailwind CSS: v4.0
- Supabase: @supabase/supabase-js v2.x (latest)
- Node.js: 20以上

## 指示内容

プロジェクトルートに以下の2つのファイルを作成してください。

### 1. docs/CONCEPT.md

以下の内容で作成：

# TubeReview（ちゅぶれびゅ！）コンセプトドキュメント

## サービス概要
**TubeReview（ちゅぶれびゅ！）** は、YouTubeチャンネルのレビュー・発見プラットフォームです。
ブクログのように、チャンネル単位で「見たい」「見ている」「見た」を管理し、能動的にチャンネルを発見できます。

## コアバリュー
1. YouTubeの受動的な「おすすめ」視聴から、能動的なチャンネル発見へ
2. ブクログ的な「管理する楽しさ」をYouTubeチャンネルに適用
3. チャンネル単位での評価・発見を促進し、質の高い視聴体験を提供

## ターゲットユーザー

### プライマリ
- YouTubeを日常的に視聴する人
- 「また時間を無駄にした...」と後悔したことがある人
- 良質なチャンネルを探しているが、おすすめに頼りたくない人

### セカンダリ
- 新規チャンネルを立ち上げたYouTuber
- 認知拡大に課題を感じているクリエイター

## やらないこと（v1.0スコープ外）

### 機能面
- 動画単位のレビュー（チャンネル単位のみ）
- 動画の埋め込み再生機能
- リアルタイムチャット・コメント機能
- SNSシェア機能の過度な実装
- スマホネイティブアプリ（PWAのみ）

### ビジネス面
- 初期段階での課金機能
- YouTuber向けの有料分析ツール
- 広告配信システム

### 対象外ユーザー
- YouTubeを全く見ない人
- 短尺動画（Shorts）のみを視聴する人

## MVP（最小限の価値提供）

ユーザーが以下のことをできるようにする：

1. チャンネルを検索して登録できる
2. レビュー（★評価+コメント）を書ける
3. 「見たい」「見ている」「見た」でマイリスト管理できる
4. 自分のマイリストを公開できる
5. 他ユーザーのプロフィール・マイリストを閲覧できる
6. デイリーランキングと新着チャンネルを見れる
7. テーマ別リスト（ユーザー作成）を見れる・作れる

これだけで「能動的なチャンネル発見」という価値を提供できる。

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router), TypeScript 5.9, Tailwind CSS 4.0
- **バックエンド**: Supabase (PostgreSQL, Auth, Storage)
- **外部API**: YouTube Data API v3
- **デプロイ**: Vercel
- **必須環境**: Node.js 20以上

## 技術的制約

- **YouTube Data API**: 10,000ユニット/日
  - チャンネル情報はキャッシュ必須（Supabaseに保存）
- **Supabase 無料枠**: ストレージ500MB、月間帯域幅5GB
  - 画像は外部URL参照で対応
- **Tailwind CSS 4.0**: Safari 16.4+, Chrome 111+, Firefox 128+ が必要
  - 古いブラウザサポートが必要な場合は v3.4 を検討


### 2. README.md

以下の内容で作成：

# TubeReview（ちゅぶれびゅ！）

YouTube channel review and discovery platform - Find channels actively, not passively.

## About

TubeReview is a platform for discovering and managing YouTube channels, inspired by Booklog (読書管理サービス).

### Core Features (MVP)

- 📝 Review YouTube channels with ratings and comments
- 📚 Manage channels with "Want to Watch", "Watching", "Watched" status
- 🔍 Discover channels through user reviews and rankings
- 📊 Daily rankings and new channel listings
- 📋 Create and share themed channel lists

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript 5.9, Tailwind CSS 4.0
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **External API**: YouTube Data API v3
- **Deployment**: Vercel

## Requirements

- Node.js 20 or higher

## Project Structure
```
tube-review/
├── .claude/       # Claude CLI prompts
├── docs/          # Documentation
├── src/           # Source code (to be created)
└── README.md
```

## Development Setup

(To be documented)

## License

MIT


これらのファイルを作成したら、その内容を表示してください。

## 期待される成果物

- `docs/CONCEPT.md`
- `README.md`

## 備考

- 初回のプロジェクトドキュメント作成
- Context7 スキルで確認した最新技術スタックを反映
- コンセプトとMVPが確定した段階で実行