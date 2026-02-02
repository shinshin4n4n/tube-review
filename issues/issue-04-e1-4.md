# E1-4: 基本的なUI/UXフレームワーク構築

## 📋 概要
Tailwind CSSとshadcn/uiを使用した基本的なUIフレームワークの構築

## 🎯 背景・目的
一貫性のあるデザインシステムを構築し、効率的なUI開発を可能にする

## ✅ タスク詳細
- [ ] Tailwind CSS設定の最適化
- [ ] shadcn/uiのセットアップ
- [ ] 基本コンポーネントのインストール
  - Button
  - Input
  - Card
  - Dialog
  - Toast
  - Badge
  - Avatar
- [ ] カラーテーマ設定 (YouTube風の赤と黒)
- [ ] レイアウトコンポーネント作成
  - Header (ナビゲーション)
  - Footer
  - Container (max-width制御)
- [ ] レスポンシブデザイン対応確認
- [ ] ダークモード対応

## 📦 成果物
```
tube-review/
├── tailwind.config.ts
├── components/
│   ├── ui/ (shadcn/ui components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Container.tsx
└── app/
    ├── globals.css (カスタムテーマ)
    └── layout.tsx (Header/Footer配置)
```

## 🎓 受入基準
- [ ] Tailwind CSSが正しく動作している
- [ ] shadcn/uiの基本コンポーネントが使用可能
- [ ] カラーテーマがYouTube風に設定されている
- [ ] 基本レイアウト (Header/Footer) がレスポンシブに動作する
- [ ] ダークモード切り替えが動作する
- [ ] コンポーネントカタログページで確認できる (Storybook的なページ)

## 🎨 デザイン要件
- [ ] YouTube風カラーパレット (赤 #FF0000, 黒 #0F0F0F)
- [ ] モバイルファースト (375px〜)
- [ ] タブレット対応 (768px〜)
- [ ] デスクトップ対応 (1024px〜)

## 🔗 関連ドキュメント
- `docs/phase1/epic1-technical-foundation.md`
- shadcn/ui公式ドキュメント
- Tailwind CSS公式ドキュメント

## ⏱️ 見積もり工数
3-4時間

## 🏷️ ラベル
`epic-1`, `priority-medium`, `phase-1`, `ui`, `design`

## 📌 依存関係
- E1-1 (Next.jsプロジェクトが必要)
