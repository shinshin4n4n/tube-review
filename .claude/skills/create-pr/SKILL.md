---
description: "PR 作成フロー。品質チェック→サイズ確認→PR作成→セルフレビューコメント投稿を実行する。"
---

# /create-pr — PR 作成

品質チェック→サイズ確認→PR作成→セルフレビューコメント投稿を実行する。

## 使い方

```
/create-pr
```

---

## Step 1: 品質チェック

以下を全て実行し、**いずれか失敗した場合は中断**:

```bash
npm run typecheck
npm run lint
npm run test:unit
```

## Step 2: サイズ確認

```bash
git diff --stat main...HEAD | tail -1
```

### 300行以下 & 10ファイル以下の場合

→ Step 3 へ続行。

### 300行超 or 10ファイル超の場合

**PR作成を中断**し、以下を実施:

1. 変更をカテゴリ別に分類（機能、テスト、ドキュメント、リファクタリング等）
2. 2〜3個の PR 分割案を提示
3. ユーザーの承認なしに PR を作成しない

※ ドキュメント・テストのみの場合は500行まで許容。

## Step 3: PR 作成

1. `git log main...HEAD` でコミット履歴を確認
2. Conventional Commits 形式のタイトルを生成（例: `feat: Add user profile page`）
3. 日本語で概要・変更内容を含む body を生成
4. PR を作成:

```bash
gh pr create --title "タイトル" --body "body（Closes #Issue番号 を含める）"
```

## Step 4: セルフレビューコメント投稿（スキップ不可）

PR作成後、**必ず**セルフレビューコメントを投稿する:

```bash
gh pr review <PR番号> --comment --body "セルフレビュー内容"
```

セルフレビューには以下を含める:

- 確認済み項目（Critical Rules 準拠、セキュリティ、テスト）
- 注意点・既知の制約
- レビュアーに特に見てほしいポイント
