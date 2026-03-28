# TubeReview - AI Development Guide

このドキュメントは、AIアシスタント（Claude）がこのプロジェクトを理解し、一貫性のあるコード提案を行うためのガイドです。

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

## Critical Rules (Must Follow)

1. **Server Actions は必ず `ApiResponse<T>` を返す**
2. **全エラーは `handleApiError()` で処理**
3. **TDD必須: テストを先に書いてから実装**（Red-Green-Refactor）
4. **テストカバレッジ 80%以上必須**
5. **`any` 型禁止**
6. **全テーブルで RLS 有効化**
7. **PRサイズ: 300行以下 / 10ファイル以下**（詳細は `.claude/task-checklists.md`）
8. **Plan mode で推定サイズを記載**（300行超は分割計画必須）
9. **PR作成前に `git diff --stat` でサイズ確認**（超過時はPR作成中断）
10. **新規ライブラリ導入時は Context7 MCP で最新版確認**
11. **main ブランチへの直接プッシュ禁止**。全ての変更は feature ブランチ → PR → マージ。ドキュメントのみも同様
12. **`/create-pr` 実行時、PR作成後に必ず `gh pr review --comment` でセルフレビューコメントを投稿**。スキップ不可
13. **ページコンポーネント（page.tsx）にユーザー操作がある場合、UIインタラクションのテストも必須**

## Architecture Patterns

詳細は `.claude/architecture.md` を参照。

### Server Actions

- **配置**: `app/_actions/{domain}.ts`
- **戻り値**: 必ず `ApiResponse<T>` を返す
- **エラーハンドリング**: `lib/api/error.ts` の `handleApiError()` を使用

### API Routes

- **配置**: `app/api/{endpoint}/route.ts`
- **バリデーション**: Zod スキーマで検証
- **レスポンス**: `NextResponse.json` + 適切なステータスコード

### Database

- **RLS**: 全テーブルで有効化
- **Soft Delete**: `deleted_at IS NULL` パターン使用
- **Materialized Views**: GitHub Actions (6h cron) でリフレッシュ

### Client Components

- **'use client'** ディレクティブを明示的に使用
- **データ取得**: Server Actions を呼び出し

## Security

詳細は `.claude/security.md` を参照。

- ❌ エラーレスポンスに `details`, `stack` を含めない
- ❌ ユーザーの個人情報をログに出力しない
- ✅ 全エラーは `handleApiError()` で処理
- ✅ 本番環境では `console.log` を使わない（`console.error`, `console.warn` のみ）
- ✅ 認証チェック: `lib/auth.ts` の `getUser()`, `requireAuth()` を使用

## Testing（TDD必須）

詳細は `.claude/testing.md` を参照。
新機能の実装は必ず Red-Green-Refactor サイクルに従うこと。

1. 🔴 RED: 失敗するテストを先に書く
2. 🟢 GREEN: テストを通す最小限の実装を書く
3. 🔵 REFACTOR: テストが通る状態を維持しながらリファクタ

- `/tdd` コマンドで TDD サイクルを開始
- カバレッジ: `npm run test:coverage`（80%以上必須）
- 配置: `{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`

## Version Policy + Context7 MCP

### 依存パッケージ管理

- `dependencies`: **固定バージョン**（`^` `~` 不可）
- `devDependencies`: `^` 許容
- 新規ライブラリ導入時: Context7 MCP で最新安定版を確認 → `--save-exact` でインストール

### Context7 MCP の利用

新しいライブラリを追加する際は、必ず Context7 MCP で最新ドキュメントを確認:

```
mcp__plugin_context7_context7__resolve-library-id → mcp__plugin_context7_context7__query-docs
```

## Code Style

### TypeScript

- **strict mode** 有効、`any` 型禁止
- Optional chaining (`?.`) を活用

### Commits

- **Conventional Commits** 形式: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

### Lint & Format

- **ESLint + Prettier** (pre-commit 強制)
- **Import 順**: React → Next.js → 外部ライブラリ → 内部モジュール → 型定義

### ファイル命名

- **コンポーネント**: PascalCase (`UserProfile.tsx`)
- **ユーティリティ**: kebab-case (`format-date.ts`)
- **Server Actions**: kebab-case (`review-actions.ts`)

## Common Patterns

```typescript
// Supabase Client (Server)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// YouTube API (Always Cache)
import { searchChannels } from "@/lib/youtube/api";
const channels = await searchChannels(query, limit);
```

コード例の詳細は `.claude/examples.md` を参照。

## Definition of Done

機能が「完了」とみなされる条件:

- [ ] TDD（Red-Green-Refactor）で実装されている
- [ ] Server Action の呼び出し元で戻り値チェック + ユーザーフィードバック（toast/alert）がある
- [ ] UIの操作フロー（ボタン押下→結果表示）を手動で確認した
- [ ] テストカバレッジ 80%以上
- [ ] TypeScript 型チェック + Lint 通過
- [ ] コードレビュー承認済み
- [ ] 本番環境にデプロイ + 動作確認完了

## Task Guidelines

- 機能追加時: `.claude/architecture.md` を参照
- テスト作成時: `.claude/testing.md` を参照
- セキュリティ作業: `.claude/security.md` を参照
- コード例: `.claude/examples.md` を参照
- タスクチェックリスト: `.claude/task-checklists.md` を参照

## PR Scoping Enforcement

PRサイズは2つのチェックポイントで強制チェックされる。詳細手順は `.claude/task-checklists.md` を参照。

### チェックポイント1: Plan mode（見積もり段階）

- 実装計画に「推定変更行数・ファイル数」を必須記載
- 推定300行超 → 分割計画を記載してから ExitPlanMode
- 分割不可能な場合 → 理由を明記し、ユーザー承認を得る

### チェックポイント2: PR作成前（実測段階）

- `git diff --stat main...HEAD | tail -1` でサイズを実測
- 300行以下 & 10ファイル以下 → PR作成続行
- ドキュメント・テストのみ → 500行まで許容
- 超過時 → PR作成を中断し、分割を提案

## Best Practices

1. **Server Components First**: デフォルトは Server Component
2. **Type Safety**: `ApiResponse<T>` で統一
3. **Caching**: YouTube API は高コスト → 必ずキャッシュ利用
4. **RLS**: データベースアクセスは RLS で保護
5. **Revalidation**: データ更新後は `revalidatePath()` を呼ぶ

## 避けるべきパターン

❌ `any` 型の使用
❌ クライアント側での直接的な Supabase クエリ（Server Actions を使用）
❌ エラーを握りつぶす（必ず適切にハンドリング）
❌ `console.log` の本番コードへの残留
❌ ハードコードされた文字列（定数化する）

## Notes for AI

- **Supabase Auth** を使用（NextAuth や better-auth は不使用）
- **Zod 4** を使用（v3 ではない）
- **React 19** と **Next.js 16** の最新機能を活用
- **Server Actions** を優先的に使用
- コミット前に **pre-commit hooks** が自動実行されます
