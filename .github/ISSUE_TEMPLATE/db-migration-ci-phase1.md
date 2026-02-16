---
name: DB Migration CI 自動検証（Phase 1）
about: CIでSupabaseマイグレーションを自動検証する機能の実装
title: "feat: Add DB Migration CI validation with local Supabase"
labels: enhancement, ci/cd, database
assignees: ""
---

## 📋 概要

GitHub Actions CI で Supabase マイグレーションを自動検証し、PRマージ前にマイグレーションエラーを検出できるようにする。

## 🎯 目的

### 現状の課題

- ✅ 基本的な構文チェックのみ実施（`.github/workflows/ci.yml`）
- ❌ 実際のデータベースでマイグレーション実行なし
- ❌ マイグレーションの適用順序・依存関係の検証なし
- ❌ 手動適用に依存（人的ミスのリスク）

### 達成したい状態

- ✅ PR作成時に自動でマイグレーション検証
- ✅ ローカルSupabaseでマイグレーション実行テスト
- ✅ テーブル作成・RLSポリシー適用の確認
- ✅ マイグレーション失敗時はPRをブロック

## 🛠️ 実装内容（Phase 1）

### 1. Supabase ローカル環境の初期化

- [ ] `supabase init` を実行
- [ ] `supabase/config.toml` 生成
- [ ] `.gitignore` に必要な除外設定追加

### 2. GitHub Actions ワークフロー作成

- [ ] `.github/workflows/db-migration-test.yml` 作成
- [ ] Supabase CLI セットアップ
- [ ] ローカルSupabase起動（Docker）
- [ ] マイグレーション適用（`supabase db reset`）
- [ ] 検証テスト実行
  - [ ] テーブル存在確認
  - [ ] RLSポリシー確認
  - [ ] Materialized View確認
- [ ] 失敗時のログアップロード
- [ ] クリーンアップ（`supabase stop`）

### 3. package.json にスクリプト追加

- [ ] `db:start`: ローカルSupabase起動
- [ ] `db:stop`: ローカルSupabase停止
- [ ] `db:reset`: マイグレーション再適用
- [ ] `db:status`: ステータス確認

### 4. 既存CIへの統合

- [ ] `.github/workflows/ci.yml` に新ジョブ追加
- [ ] マイグレーションファイル変更時のみ実行
- [ ] 構文チェック後に実行（依存関係設定）

### 5. ドキュメント更新

- [ ] `docs/CICD.md` 更新
- [ ] `supabase/README.md` にローカル開発手順追加
- [ ] README.mdのバッジ追加（オプション）

## 📐 技術仕様

### 環境

- **GitHub Actions**: ubuntu-latest（Docker プリインストール）
- **Supabase CLI**: `supabase/setup-cli@v1`
- **PostgreSQL**: 15（Supabaseデフォルト）

### ワークフロー実行条件

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - "supabase/migrations/**"
      - "supabase/config.toml"
      - ".github/workflows/db-migration-test.yml"
  push:
    branches: [main]
    paths:
      - "supabase/migrations/**"
```

### 検証項目

1. **テーブル存在確認**
   - `users`, `channels`, `reviews`, `user_channels`, `lists`, etc.

2. **RLSポリシー確認**
   - 各テーブルにRLSが有効化されているか
   - ポリシーが設定されているか

3. **Materialized View確認**
   - `channel_stats` が存在するか

4. **インデックス確認**（オプション）
   - パフォーマンス用インデックスが作成されているか

## 🚫 対象外（Phase 2以降）

- ❌ Staging環境への自動適用
- ❌ Production環境への自動適用
- ❌ マイグレーションロールバック機能
- ❌ データシード自動投入

## 📊 成功基準

- [ ] PRを作成すると自動でマイグレーションテストが実行される
- [ ] テーブル存在確認が成功する
- [ ] RLSポリシー確認が成功する
- [ ] Materialized View確認が成功する
- [ ] マイグレーションエラー時はCIが失敗する
- [ ] CI実行時間が10分以内

## 🔗 関連資料

- [Supabase CLI Setup Action](https://github.com/supabase/setup-cli)
- [Automated Testing using GitHub Actions](https://supabase.com/docs/guides/deployment/ci/testing)
- [docs/STAGING_ENVIRONMENT.md](../docs/STAGING_ENVIRONMENT.md)
- [docs/CICD.md](../docs/CICD.md)

## ⏱️ 見積もり

**実装時間**: 3-4時間

- Supabase初期化: 15分
- ワークフロー作成: 1時間
- 検証テスト実装: 1時間
- 既存CI統合: 30分
- テスト・デバッグ: 1-2時間

## 🎉 期待される効果

- ✅ マイグレーションエラーの早期発見
- ✅ 本番環境への誤適用リスク低減
- ✅ レビュアーの負担軽減
- ✅ CI/CDパイプラインの信頼性向上
