# E1-2: Supabase接続とスキーマ設計

## 📋 概要
Supabaseプロジェクトのセットアップとデータベーススキーマの設計・実装

## 🎯 背景・目的
YouTube APIデータとユーザーデータを永続化するためのバックエンド基盤を構築する

## ✅ タスク詳細
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定 (`.env.local`)
- [ ] Supabase Clientライブラリのインストールと設定
- [ ] データベーススキーマ設計
  - `users` テーブル (認証情報)
  - `channels` テーブル (YouTubeチャンネル情報)
  - `videos` テーブル (動画情報)
  - `reviews` テーブル (レビュー)
  - `my_lists` テーブル (マイリスト)
- [ ] マイグレーションファイル作成
- [ ] RLS (Row Level Security) ポリシー設定
- [ ] Supabase接続テスト

## 📦 成果物
```
tube-review/
├── .env.local (gitignore)
├── .env.example
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── types.ts
└── supabase/
    └── migrations/
        └── 20260201000000_initial_schema.sql
```

## 🎓 受入基準
- [ ] Supabaseプロジェクトが作成され、接続確認ができる
- [ ] 必要なテーブルが作成されている
- [ ] RLSポリシーが適切に設定されている
- [ ] `.env.example` に必要な環境変数が記載されている
- [ ] Supabase Clientで接続テストが成功する

## 🔒 セキュリティ要件
- [ ] RLSポリシーが全テーブルに設定されている
- [ ] 環境変数が `.gitignore` に含まれている
- [ ] APIキーがコミットされていない

## 🔗 関連ドキュメント
- `docs/phase1/epic1-technical-foundation.md`
- `docs/ENVIRONMENT_VARIABLES.md`
- Supabase公式ドキュメント

## ⏱️ 見積もり工数
3-4時間

## 🏷️ ラベル
`epic-1`, `priority-high`, `phase-1`, `database`

## 📌 依存関係
- E1-1 (環境変数設定が必要)
