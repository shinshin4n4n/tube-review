# Task Checklists

タスク別のチェックリストです。作業前に該当するチェックリストを確認してください。

## 🆕 Adding New Feature

### Before Starting

- [ ] Issue を確認し、要件を理解する
- [ ] 既存の類似機能を確認
- [ ] `.claude/architecture.md` でアーキテクチャパターンを確認
- [ ] `.claude/examples.md` でコード例を確認
- [ ] 技術スタックを確認（新しいライブラリが必要か？）
- [ ] ブランチ作成: `git checkout -b feature/feature-name`

### During Development

- [ ] Server Actions は `ApiResponse<T>` を返す
- [ ] エラーは `handleApiError()` で処理
- [ ] 入力は Zod でバリデーション
- [ ] 認証が必要な場合は `requireAuth()` を使用
- [ ] データ更新後は `revalidatePath()` を呼ぶ
- [ ] RLS ポリシーを確認
- [ ] TypeScript strict mode に準拠
- [ ] `any` 型を使用しない

### Testing

- [ ] ユニットテスト作成（80%以上カバレッジ）
- [ ] E2Eテスト作成（主要フロー）
- [ ] エッジケースのテスト
- [ ] エラーケースのテスト
- [ ] `npm run test:unit` が通過
- [ ] `npm run test:e2e` が通過

### Documentation

- [ ] コード内コメント追加（複雑なロジックのみ）
- [ ] 必要に応じて CLAUDE.md 更新
- [ ] 新しいパターンは `.claude/examples.md` に追加

### Before Committing

- [ ] `npm run lint` が通過
- [ ] `npm run build` が成功
- [ ] `console.log` を削除（デバッグログを除く）
- [ ] 個人情報をログに出力していないか確認
- [ ] Conventional Commits 形式でコミット

### Code Review

- [ ] セルフレビュー完了
- [ ] PR 作成（テンプレート使用）
- [ ] CI が全て通過
- [ ] レビュワーに依頼

## 🧪 Writing Tests

### Unit Test Setup

- [ ] テストファイル作成: `__tests__/{filename}.test.ts`
- [ ] 必要なモックを設定
- [ ] `describe` でグループ化
- [ ] AAA パターン（Arrange-Act-Assert）に従う

### Test Structure

- [ ] 正常系テスト
- [ ] 異常系テスト（バリデーションエラー、認証エラー等）
- [ ] エッジケーステスト
- [ ] 意味のあるテスト名（`should ...` 形式）

### Test Coverage

- [ ] Statements: 80%以上
- [ ] Branches: 75%以上
- [ ] Functions: 80%以上
- [ ] Lines: 80%以上

### E2E Test Setup

- [ ] テストファイル作成: `tests/e2e/{feature}.spec.ts`
- [ ] 認証状態のセットアップ
- [ ] 必要なテストデータ準備

### Running Tests

- [ ] `npm run test:unit` でユニットテスト実行
- [ ] `npm run test:e2e` でE2Eテスト実行
- [ ] 全てのテストがパス

## 🔒 Security Review

### Before Implementing Auth-Related Feature

- [ ] `.claude/security.md` を確認
- [ ] 認証方式を確認（Magic Link or Google OAuth）
- [ ] RLS ポリシーを設計
- [ ] セッション管理方針を確認

### Input Validation

- [ ] 全ての入力を Zod でバリデーション
- [ ] XSS 対策（React の自動エスケープ）
- [ ] SQL インジェクション対策（Supabase のパラメータ化）
- [ ] 型安全性の確保

### Error Handling

- [ ] エラーレスポンスに機密情報を含めない
- [ ] スタックトレースを露出しない
- [ ] ユーザーのメールアドレスをログに出力しない
- [ ] `handleApiError()` を使用

### Database Operations

- [ ] RLS ポリシーが有効
- [ ] ユーザーは自分のデータのみアクセス可能
- [ ] Soft Delete パターン使用（論理削除）
- [ ] IDOR 脆弱性の確認

### Environment Variables

- [ ] Public 変数は `NEXT_PUBLIC_` プレフィックス
- [ ] Private 変数はサーバー側のみで使用
- [ ] `.env.example` を更新
- [ ] シークレットをハードコードしない

## 📝 Creating PR

### Before Creating PR

- [ ] 全てのテストがパス
- [ ] Lint エラーがない
- [ ] ビルドが成功
- [ ] 自分のコードをレビュー
- [ ] コミットメッセージを確認

### PR Description

- [ ] 何を変更したか明確に記載
- [ ] なぜ変更したか説明
- [ ] スクリーンショット追加（UI 変更の場合）
- [ ] 関連 Issue をリンク
- [ ] 破壊的変更があれば明記

### PR Checklist

- [ ] CI が全て通過
- [ ] E2E テストが通過
- [ ] Lighthouse スコア確認
- [ ] セキュリティチェック完了
- [ ] ドキュメント更新完了

### Code Review Preparation

- [ ] レビューポイントを明記
- [ ] 懸念点があれば記載
- [ ] レビュワーに依頼

## 🚀 Deploying to Production

### Pre-Deployment Checklist

- [ ] 全テストがパス（Unit + E2E）
- [ ] Lint エラーがない
- [ ] TypeScript 型チェック完了
- [ ] 本番環境変数を確認
- [ ] データベースマイグレーション確認
- [ ] ロールバック計画を準備

### Deployment Steps

- [ ] PR をマージ
- [ ] main ブランチで自動デプロイ
- [ ] Vercel デプロイログを確認
- [ ] デプロイ完了を確認

### Post-Deployment

- [ ] 本番環境で動作確認
- [ ] エラーログを確認
- [ ] パフォーマンスメトリクスを確認
- [ ] ユーザーフィードバックを監視

### Rollback Plan

- [ ] 問題発生時は即座にロールバック
- [ ] Vercel で前のデプロイに戻す
- [ ] データベース変更があれば手動でロールバック
- [ ] ユーザーに通知（必要な場合）

## 🗄️ Database Changes

### Before Schema Changes

- [ ] 既存のスキーマを確認
- [ ] RLS ポリシーへの影響を確認
- [ ] 既存データへの影響を確認
- [ ] マイグレーション戦略を計画

### Creating Migration

- [ ] マイグレーションファイル作成
- [ ] Up migration 作成
- [ ] Down migration 作成（ロールバック用）
- [ ] ローカルでテスト
- [ ] RLS ポリシーを更新

### After Migration

- [ ] 本番環境で実行
- [ ] データ整合性を確認
- [ ] パフォーマンスへの影響を確認
- [ ] ドキュメント更新

## 🎨 UI/UX Changes

### Before Implementation

- [ ] デザインを確認
- [ ] レスポンシブ対応を確認
- [ ] アクセシビリティを考慮
- [ ] 既存の UI コンポーネントを確認

### Implementation

- [ ] Tailwind CSS を使用
- [ ] shadcn/ui コンポーネントを活用
- [ ] lucide-react アイコンを使用
- [ ] モバイルファースト

### Testing

- [ ] Desktop Chrome でテスト
- [ ] Pixel 5 でテスト
- [ ] iPad Pro でテスト
- [ ] キーボードナビゲーション確認

### Performance

- [ ] 画像最適化（Next.js Image）
- [ ] 遅延読み込み
- [ ] Lighthouse スコア確認

## 📦 Dependency Updates

### Before Updating

- [ ] `npm outdated` で確認
- [ ] CHANGELOG を確認
- [ ] Breaking changes の有無を確認
- [ ] セキュリティアドバイザリを確認

### Update Process

- [ ] ローカルで `npm install package@version --save-exact`
- [ ] `npm run build` が成功
- [ ] `npm run test:unit` が通過
- [ ] `npm run test:e2e` が通過
- [ ] アプリケーションの動作確認

### Testing After Update

- [ ] 主要機能のテスト
- [ ] 既存のテストが全て通過
- [ ] パフォーマンスへの影響確認
- [ ] 互換性の確認

### Committing

- [ ] `package.json` と `package-lock.json` をコミット
- [ ] コミットメッセージ: `chore: Update package@version`
- [ ] PR 作成

## 🐛 Bug Fixing

### Investigation

- [ ] 問題を再現
- [ ] エラーログを確認
- [ ] 根本原因を特定
- [ ] 影響範囲を確認

### Fix

- [ ] 最小限の変更で修正
- [ ] 既存機能への影響を確認
- [ ] テストを追加（リグレッション防止）
- [ ] コード品質を維持

### Testing

- [ ] バグが修正されたことを確認
- [ ] 既存テストが通過
- [ ] エッジケースをテスト
- [ ] E2E テストを実行

### Documentation

- [ ] コミットメッセージに Issue 番号を記載
- [ ] PR に修正内容を詳細に記載
- [ ] 必要に応じてドキュメント更新

## 📊 Performance Optimization

### Before Optimization

- [ ] パフォーマンス問題を計測
- [ ] ボトルネックを特定
- [ ] 最適化の目標を設定
- [ ] ベースライン測定

### Optimization Techniques

- [ ] React コンポーネントの最適化（memo, useMemo）
- [ ] データベースクエリの最適化（インデックス）
- [ ] キャッシュ戦略の見直し
- [ ] 画像最適化
- [ ] コード分割

### Measurement

- [ ] Lighthouse でスコア測定
- [ ] Chrome DevTools でプロファイリング
- [ ] 実際のユーザーメトリクス確認

### Verification

- [ ] 最適化後の測定
- [ ] 目標達成を確認
- [ ] 既存機能への影響確認
- [ ] ドキュメント更新

## 🔍 Code Review Guidelines

### As Reviewer

- [ ] コードの理解（なぜこの変更が必要か？）
- [ ] アーキテクチャパターンに準拠しているか
- [ ] セキュリティ問題がないか
- [ ] テストが十分か
- [ ] パフォーマンスへの影響
- [ ] 建設的なフィードバック

### As Author

- [ ] レビューコメントを全て確認
- [ ] 質問に回答
- [ ] 指摘事項を修正
- [ ] 修正後に再度レビュー依頼
- [ ] 承認後にマージ

## 🎯 Definition of Done

機能が「完了」とみなされる条件:

- [ ] 要件を満たしている
- [ ] コードがレビュー承認済み
- [ ] 全てのテストがパス（Unit + E2E）
- [ ] カバレッジ 80%以上
- [ ] Lint エラーなし
- [ ] TypeScript 型チェック通過
- [ ] ドキュメント更新完了
- [ ] PR がマージ済み
- [ ] 本番環境にデプロイ済み
- [ ] 本番環境で動作確認完了

## Quick Reference Commands

```bash
# 開発
npm run dev

# ビルド
npm run build

# テスト
npm run test:unit
npm run test:e2e
npm run test:unit -- --coverage

# Lint
npm run lint
npm run lint:fix

# その他
npm run generate-demo-data
npm run classify-channels
npm run refresh-stats

# Git
git checkout -b feature/feature-name
git add .
git commit -m "feat: Add new feature"
git push origin feature/feature-name

# PR作成
gh pr create --title "feat: Add new feature" --body "Description"

# マージ
gh pr merge --squash
```

---

**Last Updated:** 2026-02-17
**Next Review:** 2026-05-17
**Update Triggers:**

- プロセス改善
- 新しいチェック項目追加
- ツール変更
