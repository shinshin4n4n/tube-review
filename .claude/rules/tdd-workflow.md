---
description: "TDD ワークフローとテスト規約"
globs: "**/*.test.*,**/__tests__/**"
---

# TDD ワークフロー

## TDD 必須

新機能の実装は必ず Red-Green-Refactor サイクルに従う。

1. 🔴 RED: 失敗するテストを先に書く
2. 🟢 GREEN: テストを通す最小限の実装
3. 🔵 REFACTOR: テストを維持しながら改善

## テストファイル配置

- `{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`

## カバレッジ要件

- Statements: 80%以上
- Branches: 75%以上
- Functions: 80%以上
- Lines: 80%以上

確認: `npm run test:coverage`

## テストパターン

- AAA (Arrange-Act-Assert) パターンを使用
- 正常系・異常系・エッジケースをカバー
- テストは独立して実行可能であること

## モック対象

- 外部 API（YouTube Data API）
- Supabase クライアント
- Auth（`getUser()`, `requireAuth()`）

## ページコンポーネント

- ユーザー操作がある `page.tsx` は UI インタラクションテスト必須
- `@testing-library/react` を使用
- 実装詳細ではなく振る舞いをテスト
