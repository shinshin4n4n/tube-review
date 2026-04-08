# TubeReview - AI Development Guide

## Tech Stack

- **Frontend**: Next.js 16.1.6 App Router + React 19.2.3
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Auth**: Magic Link + Google OAuth (Supabase Auth)
- **Cache**: Upstash Redis
- **Validation**: Zod 4.3.6
- **External API**: YouTube Data API v3
- **AI**: Anthropic Claude API (チャンネル自動分類)
- **Styling**: Tailwind CSS 4 + lucide-react
- **Testing**: Vitest 4 (Unit) + Playwright 1.58 (E2E)

## Commands

| コマンド                 | 説明                                          |
| ------------------------ | --------------------------------------------- |
| `/implement <Issue番号>` | Issue 実装フロー（計画→TDD→PR→レビュー）      |
| `/tdd <説明>`            | TDD Red-Green-Refactor サイクル               |
| `/create-pr`             | 品質チェック→サイズ確認→PR作成→セルフレビュー |
| `/review <PR番号>`       | PR レビュー                                   |
| `/fix-review <PR番号>`   | レビュー指摘の修正                            |
| `/merge <PR番号>`        | スカッシュマージ                              |
| `/catchup`               | セッション再開コンテキスト再構築              |

## Critical Rules (Must Follow)

1. **Server Actions は必ず `ApiResponse<T>` を返す**
2. **全エラーは `handleApiError()` で処理**
3. **TDD必須: テストを先に書いてから実装**（Red-Green-Refactor）
4. **テストカバレッジ 80%以上必須**
5. **`any` 型禁止**
6. **全テーブルで RLS 有効化**
7. **PRサイズ: 300行以下 / 10ファイル以下**（ドキュメント・テストのみ500行まで許容）
8. **Plan mode で推定サイズを記載**（300行超は分割計画必須）
9. **PR作成前に `git diff --stat` でサイズ確認**（超過時はPR作成中断）
10. **新規ライブラリ導入時は Context7 MCP で最新版確認**
11. **main ブランチへの直接プッシュ禁止**（全変更は feature ブランチ → PR → マージ）
12. **`/create-pr` 実行時、PR作成後に必ずセルフレビューコメント投稿**（スキップ不可）
13. **page.tsx にユーザー操作がある場合、UIインタラクションテスト必須**

## .claude/ ディレクトリ構成

| パス                      | 説明                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `agents/code-reviewer.md` | PR自動レビューサブエージェント                                   |
| `commands/`               | スラッシュコマンド定義（skills に委譲）                          |
| `hooks/`                  | 自動化フック（セッション開始、差分チェック等）                   |
| `rules/`                  | パススコープ付きルール（Next.js, Server Actions, Supabase, TDD） |
| `skills/`                 | スキル定義（tdd, implement, create-pr, review, catchup）         |
| `architecture.md`         | アーキテクチャパターン詳細                                       |
| `security.md`             | セキュリティルール詳細                                           |
| `testing.md`              | テスト規約詳細                                                   |
| `task-checklists.md`      | タスクチェックリスト                                             |

## Version Policy

- `dependencies`: **固定バージョン**（`^` `~` 不可）、`--save-exact` でインストール
- `devDependencies`: `^` 許容
- 新規ライブラリ: Context7 MCP で最新安定版を確認してからインストール

## Code Style

- **TypeScript strict mode**、`any` 型禁止
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- **ESLint + Prettier** (pre-commit 強制)
- **命名**: コンポーネント PascalCase、ユーティリティ kebab-case

## Definition of Done

- [ ] TDD（Red-Green-Refactor）で実装
- [ ] Server Action 呼び出し元で戻り値チェック + ユーザーフィードバック
- [ ] UI操作フローを手動確認
- [ ] テストカバレッジ 80%以上
- [ ] TypeScript 型チェック + Lint 通過
- [ ] コードレビュー承認済み
- [ ] 本番デプロイ + 動作確認完了

## Notes for AI

- **Supabase Auth** を使用（NextAuth や better-auth は不使用）
- **Zod 4** を使用（v3 ではない）
- **React 19** と **Next.js 16** の最新機能を活用
- **Server Actions** を優先的に使用
