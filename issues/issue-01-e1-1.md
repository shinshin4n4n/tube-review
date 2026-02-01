# E1-1: Next.js 16 + TypeScript基本セットアップ

## 📋 概要
Next.js 16とTypeScriptを使用したプロジェクトの基本セットアップを行う

## 🎯 背景・目的
TubeReviewプロジェクトの技術基盤を構築し、モダンなフロントエンド開発環境を整える

## ✅ タスク詳細
- [ ] Next.js 16プロジェクトの初期化 (`npx create-next-app@latest`)
- [ ] TypeScript設定の最適化 (strict mode有効化)
- [ ] 基本的なフォルダ構造作成
  - `/app` - App Router
  - `/components` - 再利用可能コンポーネント
  - `/lib` - ユーティリティ関数
  - `/types` - TypeScript型定義
- [ ] ESLint/Prettier設定
- [ ] 開発サーバー起動確認
- [ ] README.mdの更新

## 📦 成果物
```
tube-review/
├── package.json
├── tsconfig.json
├── next.config.ts
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── README.md
└── app/
    ├── layout.tsx
    ├── page.tsx
    └── globals.css
```

## 🎓 受入基準
- [ ] `npm run dev` でローカル開発サーバーが起動する
- [ ] TypeScriptのコンパイルエラーがない
- [ ] ESLintでエラーがない
- [ ] 基本的なフォルダ構造が作成されている
- [ ] README.mdに開発環境のセットアップ手順が記載されている

## 🔗 関連ドキュメント
- `docs/phase1/epic1-technical-foundation.md`
- Next.js 16 公式ドキュメント

## ⏱️ 見積もり工数
2-3時間

## 🏷️ ラベル
`epic-1`, `priority-high`, `phase-1`, `setup`

## 📌 依存関係
なし（最初のイシュー）
