# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- カスタムドメイン `tube-review.com` のサポート (#64)
- Resend SMTP によるメール送信機能（3,000通/月）
- Vercel DNS によるドメイン管理
- Magic Link 認証の完全サポート
- マテリアライズドビュー `channel_stats` による高速ランキング (#65)
- YouTube API レスポンスキャッシュ機能
- API クォータ管理機能（`quota_usage` テーブル）
- カスタムドメイン設定ガイド (`docs/domain-setup.md`)
- メール設定ガイド (`docs/email-setup.md`)
- 認証トラブルシューティングガイド (`docs/auth-troubleshooting.md`)

### Changed
- **アプリ名**: `TubeReview` → `ちゅぶれびゅ！` に統一 (#66)
- **ドメイン**: `tube-review.vercel.app` → `tube-review.com` にメイン変更
- **技術スタック更新**:
  - Next.js: 16.1.6
  - React: 19.2.3
  - Tailwind CSS: 4
  - Playwright: 1.58.1
  - Vitest: 4.0.18

### Fixed
- 認証コールバックで Magic Link (`token_hash`) が動作しない問題を修正 (#67)
- 認証後に複数の Cookie が正しく設定されない問題を修正
- E2E テストで CSS クラスチェックが失敗する問題を修正（9件）
- ランキングページの要素参照エラーを修正

### Documentation
- 全ドキュメントでアプリ名を「ちゅぶれびゅ！」に統一（17ファイル）
- `UI_DESIGN.md` を実装（`app/globals.css`）と一致させる
- `DATABASE_DESIGN.md` にマテリアライズドビューを追記
- `README.md` の技術スタックを最新化
- 古いドキュメントを `docs/archive/` に移動（22ファイル）

### Planned
- ユーザーフォロー機能
- リストへの「いいね」機能
- 通知機能
- 二要素認証 (2FA)

## [0.1.0] - 2026-02-08

### Added (Phase 7: デプロイ準備)

#### E7-1: CI/CD基本設定 (#57)
- GitHub Actionsワークフロー追加
- Lintチェック自動化
- テスト自動実行

#### E7-2: 本番環境設定 (#58)
- Vercel設定ファイル
- 環境変数管理
- ビルド最適化

#### E7-3: エラーハンドリング強化 (#59)
- エラーページ実装 (404, 500, global-error)
- Loggerユーティリティ
- エラーハンドリングドキュメント

#### E7-4: SEO対応 (#60)
- メタタグ最適化
- sitemap.xml生成
- robots.txt設定
- OGP設定

#### E7-5: パフォーマンス最適化 (#61)
- Next.js Image最適化
- ISR (Incremental Static Regeneration)
- webpack-bundle-analyzer導入
- セキュリティヘッダー設定

#### E7-6: セキュリティ監査 (#62)
- Row Level Security全件確認
- セキュリティヘッダー設定
- npm audit実行（脆弱性0件）
- セキュリティドキュメント作成

#### E7-7: デプロイドキュメント整備 (#63)
- README.md更新
- DEPLOYMENT.md作成
- OPERATION.md作成
- TROUBLESHOOTING.md作成
- CONTRIBUTING.md作成

### Added (Phase 6: E6シリーズ)

#### E6-1: チャンネル詳細ページ
- チャンネル情報表示
- レビュー一覧表示
- マイリスト追加機能

#### E6-2: レビュー投稿機能
- レビューフォーム実装
- 5段階評価
- バリデーション (Zod)

#### E6-3: マイリスト機能
- 見たい/見ている/見た ステータス管理
- プライベート/公開設定

#### E6-4: ランキング機能
- 週間人気チャンネル表示
- 新着レビュー表示

### Added (Phase 5: E5シリーズ)

#### E5-1: ユーザープロフィール
- プロフィール表示
- プロフィール編集
- 都道府県選択

#### E5-2: アバター画像アップロード
- Supabase Storage統合
- 画像アップロード機能
- プロフィール画像表示

### Added (Phase 4: E4シリーズ)

#### E4-1: 認証機能
- Magic Link認証
- Google OAuth認証
- Middleware認証チェック

#### E4-2: レビュー管理
- レビュー編集
- レビュー削除
- レビュー一覧表示

#### E4-3: チャンネル検索
- YouTube Data API統合
- リアルタイム検索
- カテゴリフィルタ

#### E4-4: 「参考になった」ボタン
- いいねボタン実装
- カウント表示
- RLS設定

### Added (Phase 3: E3シリーズ)

#### E3-1: データベース設計
- Supabaseプロジェクト作成
- 初期スキーマ設計
- RLSポリシー設定

#### E3-2: UI/UXデザイン
- デザインシステム構築
- コンポーネントライブラリ (Radix UI)
- レスポンシブ対応

### Added (Phase 2: E2シリーズ)

#### E2-1: プロジェクトセットアップ
- Next.js 16 プロジェクト作成
- TypeScript設定
- Tailwind CSS設定
- ESLint/Prettier設定

#### E2-2: 基本レイアウト
- ヘッダー
- フッター
- ナビゲーション
- モバイルメニュー

### Added (Phase 1: 企画)

#### E1-1: プロジェクト企画
- 要件定義
- 機能一覧作成
- 技術スタック選定

---

## バージョニング規則

- **Major** (x.0.0): 破壊的変更
- **Minor** (0.x.0): 新機能追加（後方互換性あり）
- **Patch** (0.0.x): バグ修正

## カテゴリ

- **Added**: 新機能
- **Changed**: 既存機能の変更
- **Deprecated**: 将来削除予定の機能
- **Removed**: 削除された機能
- **Fixed**: バグ修正
- **Security**: セキュリティ修正

---

[Unreleased]: https://github.com/shinshin4n4n/tube-review/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/shinshin4n4n/tube-review/releases/tag/v0.1.0
