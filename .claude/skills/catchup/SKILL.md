---
description: "セッション再開時のコンテキスト再構築。前回の作業状態を復元し、次のアクションを提案する。"
---

# /catchup — セッション再開

前回のセッション状態を復元し、作業コンテキストを再構築する。

## 使い方

```
/catchup
```

---

## Step 1: ブランチ・作業状態の確認

```bash
git branch --show-current
git status
git log --oneline -5
```

## Step 2: 前回の作業状態を確認

以下のファイルが存在する場合、内容を読み込む:

- `.claude/last-session-state.md` — pre-compact hook が保存した作業状態

## Step 3: 関連 Issue / PR の確認

```bash
gh issue list --assignee @me --state open --limit 5
gh pr list --author @me --state open --limit 5
```

現在のブランチ名から Issue 番号を推測し、関連 Issue の詳細を取得:

```bash
gh issue view <推測したIssue番号>
```

## Step 4: 未コミットの変更確認

```bash
git diff --stat
git diff --cached --stat
```

## Step 5: コンテキスト要約を表示

以下の形式で現在の状態を要約:

```
## 🔄 セッション再開

- **ブランチ**: <現在のブランチ>
- **関連 Issue**: #<Issue番号> — <タイトル>
- **関連 PR**: #<PR番号> （存在する場合）
- **未コミット変更**: <ファイル数> files changed
- **前回の作業状態**: <last-session-state.md の要約>

## 📋 推奨アクション

1. <次にやるべきこと>
2. <その次にやるべきこと>
```
