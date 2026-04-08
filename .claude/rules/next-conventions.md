---
description: "Next.js/React コンポーネント規約"
globs: "app/**"
---

# Next.js / React 規約

## Server Components First

- デフォルトは Server Component。`'use client'` は必要な場合のみ
- Client Component が必要: ユーザーインタラクション、ブラウザ API、React hooks 使用時

## ページコンポーネント (page.tsx)

- ユーザー操作がある場合、UIインタラクションのテスト必須
- データ取得は Server Component 内で実行
- データ更新は Server Actions 経由

## レイアウト

- `layout.tsx` で共通 UI を定義
- 認証チェックは middleware または layout で実施

## スタイリング

- Tailwind CSS 4 を使用
- アイコンは `lucide-react` を使用

## Import 順序

1. React
2. Next.js
3. 外部ライブラリ
4. 内部モジュール (`@/`)
5. 型定義

## データ更新後

- `revalidatePath()` を呼んでキャッシュを無効化
