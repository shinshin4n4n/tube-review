# ちゅぶれびゅ！ ドキュメント索引

このディレクトリには、ちゅぶれびゅ！プロジェクトの全ドキュメントが格納されています。

## 📚 ドキュメントカテゴリ

### 🚀 セットアップ・デプロイ

| ドキュメント                                           | 説明                                                       | 最終更新   |
| ------------------------------------------------------ | ---------------------------------------------------------- | ---------- |
| [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)         | 開発環境のセットアップ手順                                 | 2025-02-14 |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | 環境変数の詳細説明                                         | 2025-02-14 |
| [STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md)     | ステージング環境構築ガイド（Supabase Branching代替案含む） | 2026-02-17 |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                       | 本番環境へのデプロイ手順                                   | 2025-02-14 |
| [domain-setup.md](./domain-setup.md)                   | カスタムドメイン設定ガイド                                 | 2025-02-14 |
| [email-setup.md](./email-setup.md)                     | メール送信設定（Resend）                                   | 2025-02-13 |

### 🏗️ アーキテクチャ・設計

| ドキュメント                                                         | 説明                                                 | 最終更新   |
| -------------------------------------------------------------------- | ---------------------------------------------------- | ---------- |
| [CONCEPT.md](./CONCEPT.md)                                           | プロジェクトコンセプト                               | 2025-02-14 |
| [ARCHITECTURE_AND_PERFORMANCE.md](./ARCHITECTURE_AND_PERFORMANCE.md) | システムアーキテクチャとパフォーマンス戦略           | 2025-02-14 |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)                           | データベース設計（テーブル、RLS、ビュー）            | 2025-02-14 |
| [API_DESIGN.md](./API_DESIGN.md)                                     | API設計（Server Actions、エンドポイント）            | 2025-02-14 |
| [UI_DESIGN.md](./UI_DESIGN.md)                                       | UIデザインガイド（カラー、フォント、コンポーネント） | 2025-02-14 |
| [NAVIGATION_DESIGN.md](./NAVIGATION_DESIGN.md)                       | ナビゲーション設計                                   | 2025-02-12 |

### 🔐 認証・セキュリティ

| ドキュメント                                                         | 説明                            | 最終更新   |
| -------------------------------------------------------------------- | ------------------------------- | ---------- |
| [AUTH_FLOW.md](./AUTH_FLOW.md)                                       | 認証フロー（Magic Link、OAuth） | 2025-02-14 |
| [auth-troubleshooting.md](./auth-troubleshooting.md)                 | 認証トラブルシューティング      | 2025-02-13 |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)                             | セキュリティ監査結果            | 2025-02-14 |
| [email-template-customization.md](./email-template-customization.md) | メールテンプレートカスタマイズ  | 2025-02-14 |

### ⚡ パフォーマンス・最適化

| ドキュメント                           | 説明                     | 最終更新   |
| -------------------------------------- | ------------------------ | ---------- |
| [PERFORMANCE.md](./PERFORMANCE.md)     | パフォーマンス最適化戦略 | 2025-02-14 |
| [RATE_LIMITING.md](./RATE_LIMITING.md) | レート制限設計           | 2025-02-12 |

### 🧪 テスト・品質管理

| ドキュメント                                         | 説明                     | 最終更新   |
| ---------------------------------------------------- | ------------------------ | ---------- |
| [TESTING_AND_SECURITY.md](./TESTING_AND_SECURITY.md) | テスト戦略とセキュリティ | 2025-02-12 |
| [e2e-test-status.md](./e2e-test-status.md)           | E2Eテスト状況            | 2025-02-13 |

### 🔧 開発・運用

| ドキュメント                                         | 説明                               | 最終更新   |
| ---------------------------------------------------- | ---------------------------------- | ---------- |
| [PR-REVIEW-GUIDELINES.md](./PR-REVIEW-GUIDELINES.md) | プルリクエストレビューガイドライン | 2025-02-14 |
| [CICD.md](./CICD.md)                                 | CI/CD設定                          | 2025-02-14 |
| [OPERATION.md](./OPERATION.md)                       | 運用手順                           | 2025-02-14 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)           | トラブルシューティング             | 2025-02-12 |
| [ERROR_HANDLING.md](./ERROR_HANDLING.md)             | エラーハンドリング戦略             | 2025-02-12 |
| [ERROR_PAGES.md](./ERROR_PAGES.md)                   | エラーページ実装                   | 2025-02-14 |

### 📈 SEO・マーケティング

| ドキュメント                   | 説明                    | 最終更新   |
| ------------------------------ | ----------------------- | ---------- |
| [SEO.md](./SEO.md)             | SEO対策とメタデータ設定 | 2025-02-14 |
| [WIREFRAME.md](./WIREFRAME.md) | ワイヤーフレーム        | 2025-02-12 |

### 📁 サブディレクトリ

| ディレクトリ           | 説明                                                    |
| ---------------------- | ------------------------------------------------------- |
| [adr/](./adr/)         | Architecture Decision Records（アーキテクチャ決定記録） |
| [demos/](./demos/)     | デモデータ生成ガイド                                    |
| [archive/](./archive/) | 古いドキュメント・完了済みissue・PRレビュー履歴         |

## 🔍 ドキュメントを探す

### 機能別

- **検索機能**: [API_DESIGN.md](./API_DESIGN.md) の「チャンネル検索」セクション
- **レビュー機能**: [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) の「reviews テーブル」
- **ランキング機能**: [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) の「channel_stats ビュー」
- **認証機能**: [AUTH_FLOW.md](./AUTH_FLOW.md)
- **マイリスト機能**: [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) の「user_channels テーブル」

### 用途別

- **新規開発者向け**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) → [CONCEPT.md](./CONCEPT.md) → [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
- **デプロイ担当者向け**: [DEPLOYMENT.md](./DEPLOYMENT.md) → [STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md) → [domain-setup.md](./domain-setup.md) → [email-setup.md](./email-setup.md)
- **トラブルシューティング**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → [auth-troubleshooting.md](./auth-troubleshooting.md)
- **コードレビュアー向け**: [PR-REVIEW-GUIDELINES.md](./PR-REVIEW-GUIDELINES.md)

## 📝 ドキュメント更新ルール

### 更新タイミング

- **実装変更時**: 対応するドキュメントも同時に更新
- **PRマージ時**: ドキュメント更新の有無を確認
- **リリース時**: CHANGELOG.md に変更を記録

### 更新方法

1. 該当ドキュメントを編集
2. 「最終更新」日付を更新（このREADME.mdも含む）
3. PRに「docs:」プレフィックスを付ける

### ドキュメントの分類

- **アクティブ**: `docs/` ルートにある現在使用中のドキュメント
- **アーカイブ**: `docs/archive/` に移動した古いドキュメント
- **ADR**: `docs/adr/` にあるアーキテクチャ決定記録

## 🗂️ アーカイブポリシー

以下の条件を満たすドキュメントは `docs/archive/` に移動：

- 実装が大きく変わり、内容が古くなったもの
- 完了済みのissue・PR履歴
- 参照頻度が低く、プロジェクトの現状を反映していないもの

アーカイブ理由は各ファイル冒頭に記載することを推奨。

## 🔗 外部リンク

- [プロジェクトREADME](../README.md)
- [CHANGELOG](../CHANGELOG.md)
- [CONTRIBUTING](../CONTRIBUTING.md)
- [GitHub リポジトリ](https://github.com/shinshin4n4n/tube-review)
- [本番サイト](https://tube-review.com)

## 📞 質問・フィードバック

ドキュメントに関する質問や改善提案は、GitHubのIssueでお知らせください。

---

**最終更新**: 2026-02-17
