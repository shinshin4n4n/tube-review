# TubeReview - Development Guide

このドキュメントは、Claude Code がこのプロジェクトを理解し、一貫性のあるコード提案を行うためのコアガイドです。

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
- **Analytics**: Vercel Analytics + Speed Insights

## 🚨 Critical Rules (Must Follow)

1. **Server Actions は必ず `ApiResponse<T>` を返す**
2. **全エラーは `handleApiError()` で処理**
3. **テストカバレッジ 80%以上必須**
4. **`any` 型禁止**
5. **全テーブルで RLS 有効化**

## Architecture Patterns

詳細は `.claude/architecture.md` を参照してください。

### Server Actions

- **配置**: `app/_actions/{domain}.ts`
- **戻り値**: 必ず `ApiResponse<T>` を返す
- **エラーハンドリング**: `lib/api/error.ts` の `handleApiError()` を使用

### API Routes

- **配置**: `app/api/{endpoint}/route.ts`
- **命名**: POST, GET, PUT, DELETE を export
- **バリデーション**: Zod スキーマで検証

### Database

- **RLS**: 全テーブルで有効化
- **Soft Delete**: `deleted_at IS NULL` パターン使用
- **Materialized Views**: GitHub Actions (6h cron) でリフレッシュ

### Client Components

- **'use client'** ディレクティブを明示的に使用
- **状態管理**: React hooks (useState, useEffect)
- **データ取得**: Server Actions を呼び出し

## Security

詳細は `.claude/security.md` を参照してください。

### エラーハンドリング

- ❌ エラーレスポンスに `details`, `stack` を含めない
- ❌ ユーザーのメールアドレスや個人情報をログに出力しない
- ✅ 全エラーは `handleApiError()` で処理

### ログ出力

- 本番環境では `console.log` を使わない
- `console.error`, `console.warn` のみ使用
- `next.config.ts` で自動削除設定済み

### 認証

- **Magic Link**: メールアドレスのみで認証
- **Google OAuth**: Supabase の設定済みプロバイダー
- **認証チェック**: `lib/auth.ts` の `getUser()`, `requireAuth()` を使用

## Testing

詳細は `.claude/testing.md` を参照してください。

### Unit Testing (Vitest)

- **カバレッジ**: 80%以上必須
- **実行**: `npm run test:unit`
- **配置**: `{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`

### E2E Testing (Playwright)

- **デバイス**: Desktop Chrome, Pixel 5, iPad Pro
- **実行**: `npm run test:e2e`
- **配置**: `tests/e2e/{feature}.spec.ts`

### CI

- 全テスト通過が必須
- `continue-on-error` は使わない
- TypeScript 型チェックも必須

## Code Style

### TypeScript

- **strict mode** 有効
- `any` 型は禁止（型ガードを使用）
- `as unknown as` は最小限に
- Optional chaining (`?.`) を活用

### Commits

- **Conventional Commits** 形式
  - `feat:` 新機能
  - `fix:` バグ修正
  - `refactor:` リファクタリング
  - `test:` テスト追加/修正
  - `docs:` ドキュメント更新
  - `chore:` ビルド/設定変更

### Lint & Format

- **ESLint + Prettier** (pre-commit 強制)
- **Import 順**:
  1. React
  2. Next.js
  3. 外部ライブラリ
  4. 内部モジュール (`@/...`)
  5. 型定義

### ファイル命名

- **コンポーネント**: PascalCase (`UserProfile.tsx`)
- **ユーティリティ**: kebab-case (`format-date.ts`)
- **テスト**: `{name}.test.ts` または `{name}.spec.ts`
- **Server Actions**: kebab-case (`review-actions.ts`)

## Common Patterns

```typescript
// Supabase Client (Server)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Supabase Client (Client)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// YouTube API (Always Cache)
import { searchChannels } from "@/lib/youtube/api";
const channels = await searchChannels(query, limit);
```

## Task Guidelines

- 機能追加時: `.claude/architecture.md` を参照
- テスト作成時: `.claude/testing.md` を参照
- セキュリティ作業: `.claude/security.md` を参照
- コード例: `.claude/examples.md` を参照
- タスクチェックリスト: `.claude/task-checklists.md` を参照

## Best Practices

1. **Server Components First**: デフォルトは Server Component、必要な場合のみ Client Component
2. **Type Safety**: 型定義を明示的に。`ApiResponse<T>` で統一
3. **Error Handling**: 必ず `try-catch` + `handleApiError()`
4. **Validation**: Zod で入力バリデーション
5. **Caching**: YouTube API は高コスト → 必ずキャッシュ利用
6. **RLS**: データベースアクセスは RLS で保護
7. **Revalidation**: データ更新後は `revalidatePath()` を呼ぶ
8. **Testing**: 新機能には必ずテストを追加

## Avoid These Patterns

- ❌ `any` 型の使用
- ❌ クライアント側での直接Supabaseクエリ
- ❌ エラーの握りつぶし
- ❌ `console.log` の本番コード残留
- ❌ ハードコードされた文字列
- ❌ 巨大なコンポーネント
- ❌ グローバル状態の乱用

## Notes

- このプロジェクトは **Supabase Auth** を使用（NextAuth や better-auth は不使用）
- **Zod 4** を使用（v3 ではない）
- **React 19** と **Next.js 16** の最新機能活用
- **Server Actions** 優先
- Pre-commit hooks 自動実行

## 📅 Document Maintenance

**更新ポリシー:**

- 更新頻度: 3ヶ月ごと
- 次回レビュー: 2026-05-17
- 担当者: @shinshin4n4n

**即座更新が必要なトリガー:**

- メジャーフレームワーク更新（Next.js, React, Supabase）
- 新しい重要なセキュリティルール
- アーキテクチャパターン変更

**定期レビュー:**

- 四半期ごと（3ヶ月）: claude.md, security.md, task-checklists.md
- 半年ごと（6ヶ月）: architecture.md, testing.md, examples.md

**更新方法:**

1. 情報の検証（package.json と照合、コード例の動作確認）
2. 内容の更新（該当セクション編集、Last Updated 更新）
3. レビュー（一貫性確認、Claude Code でテスト）
4. コミット: `docs: Update .claude/[filename]`

**バージョン履歴:**

- v1.0.0 (2026-02-17): 初版作成
  - ルート CLAUDE.md から分割
  - 4KB のコアコンテンツに削減
  - 詳細ドキュメントへの参照追加

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-17
**Next Review:** 2026-05-17
