# SQL Debug Scripts

このディレクトリには、開発・デバッグ・トラブルシューティング用のSQLスクリプトが含まれています。

## ファイル一覧

### デバッグ・調査用

- **debug_channels.sql** - チャンネルデータのデバッグクエリ
- **check_quota_usage.sql** - YouTube API クォータ使用状況の確認

### RLS権限修正

- **fix_production_rls.sql** - 本番環境のRLS権限修正
- **fix_view_permissions.sql** - ビューの権限修正

### ビュー管理

- **convert_to_realtime_view.sql** - リアルタイムビューへの変換
- **refresh_channel_stats.sql** - チャンネル統計の更新

### デモデータ

- **generate_demo_data_complete.sql** - デモデータの完全生成スクリプト

## 使用方法

これらのスクリプトは、Supabaseのダッシュボード SQL Editor または `psql` コマンドで実行できます。

```bash
# Supabase CLI を使用する場合
supabase db reset

# psql を使用する場合
psql -U postgres -d postgres -f scripts/sql-debug/[filename].sql
```

## 注意事項

- これらのスクリプトは開発・デバッグ用です
- 本番環境で実行する前に、必ず内容を確認してください
- マイグレーションが必要な場合は、`supabase/migrations/` に適切なマイグレーションファイルを作成してください
