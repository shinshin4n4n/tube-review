# チャンネル統計の増分更新実装ガイド

## 📋 概要

Materialized Viewから増分更新テーブルに変更し、レビュー投稿時に自動的にチャンネル統計を更新します。

### メリット
- ⚡ **超高速**: 該当チャンネルのみ更新（<0.1秒）
- 🔄 **リアルタイム**: レビュー投稿後、即座に反映
- 🔓 **ロックなし**: 他のクエリをブロックしない
- 🛠️ **メンテナンス不要**: 手動リフレッシュ不要

### デメリット（解決済み）
- ~~Materialized Viewではなくテーブルが必要~~ → 実装済み
- ~~トリガーの実装が必要~~ → 実装済み

## 🚀 適用方法

### Option 1: Supabase Dashboard（推奨）

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. **SQL Editor** を開く
4. 以下のファイルの内容をコピー＆ペースト：
   ```
   supabase/migrations/20260208000000_implement_incremental_channel_stats.sql
   ```
5. **Run** をクリックして実行

### Option 2: ローカル環境（Docker起動時）

```bash
# Dockerを起動してから
cd C:\Users\siguc\work\dev\projects\tube-review

# データベースをリセット（マイグレーション自動適用）
npx supabase db reset
```

### Option 3: Supabase CLI（本番環境）

```bash
# マイグレーションをプッシュ
npx supabase db push
```

## 🔍 動作確認

### 1. マイグレーション完了確認

```sql
-- channel_statsがテーブルになっているか確認
SELECT
  table_type,
  table_name
FROM information_schema.tables
WHERE table_name = 'channel_stats';

-- 期待される結果: table_type = 'BASE TABLE'
```

### 2. トリガー確認

```sql
-- トリガーが作成されているか確認
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%channel_stats%';

-- 期待される結果:
-- trigger_update_channel_stats_on_review (reviews)
-- trigger_update_channel_stats_on_user_channel (user_channels)
-- trigger_initialize_channel_stats (channels)
```

### 3. 統計データ確認

```sql
-- 統計データが投入されているか確認
SELECT
  COUNT(*) as total_channels,
  SUM(review_count) as total_reviews,
  SUM(recent_review_count) as recent_reviews,
  MAX(updated_at) as last_updated
FROM channel_stats;
```

### 4. 増分更新テスト

```sql
-- テストレビューを投稿（実際のチャンネルIDに置き換え）
INSERT INTO reviews (user_id, channel_id, rating, content)
VALUES (
  'your-user-id',
  'your-channel-id',
  5,
  'テストレビュー'
);

-- 統計が即座に更新されたか確認
SELECT
  channel_id,
  review_count,
  average_rating,
  recent_review_count,
  updated_at
FROM channel_stats
WHERE channel_id = 'your-channel-id';

-- updated_atが最新になっていればOK
```

## 📊 パフォーマンス比較

### 更新前（Materialized View）
```
レビュー投稿 → 手動でREFRESH → 全チャンネル再計算（5秒）
```

### 更新後（増分更新）
```
レビュー投稿 → トリガー発火 → 該当チャンネルのみ更新（<0.1秒）⚡
```

## 🔧 トラブルシューティング

### エラー: "relation channel_stats already exists"

既存のMaterialized Viewが残っている場合：

```sql
DROP MATERIALIZED VIEW IF EXISTS channel_stats CASCADE;
```

その後、マイグレーションを再実行してください。

### エラー: "trigger already exists"

既存のトリガーが残っている場合：

```sql
DROP TRIGGER IF EXISTS trigger_update_channel_stats_on_review ON reviews;
DROP TRIGGER IF EXISTS trigger_update_channel_stats_on_user_channel ON user_channels;
DROP TRIGGER IF EXISTS trigger_initialize_channel_stats ON channels;
```

その後、マイグレーションを再実行してください。

### 統計が更新されない

トリガーが正常に作動しているか確認：

```sql
-- トリガーの状態を確認
SELECT * FROM pg_trigger WHERE tgname LIKE '%channel_stats%';

-- トリガー関数が存在するか確認
SELECT * FROM pg_proc WHERE proname LIKE '%channel_stats%';
```

## 🔄 ロールバック方法

問題が発生した場合は、以下のスクリプトでMaterialized Viewに戻せます：

```bash
# ロールバックスクリプトを実行
supabase/migrations/20260208000001_rollback_incremental_stats.sql
```

または、Supabase Dashboardから上記ファイルの内容を実行してください。

## 📈 今後のメンテナンス

### 不要
- ✅ 手動リフレッシュ不要
- ✅ 定期実行スクリプト不要
- ✅ Cron設定不要

### 推奨（オプション）
- 週1回程度、統計データの整合性チェック
- バックアップ前に統計の一貫性確認

### 整合性チェッククエリ

```sql
-- 統計と実データの差分確認
SELECT
  c.id,
  c.title,
  cs.review_count as stats_count,
  (SELECT COUNT(*) FROM reviews WHERE channel_id = c.id AND deleted_at IS NULL) as actual_count
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id
WHERE cs.review_count != (SELECT COUNT(*) FROM reviews WHERE channel_id = c.id AND deleted_at IS NULL)
LIMIT 10;

-- 差分がある場合は再計算（めったに発生しない）
```

## ✅ 完了チェックリスト

- [ ] マイグレーション実行完了
- [ ] トリガー作成確認
- [ ] 統計データ投入確認
- [ ] 増分更新テスト実施
- [ ] ランキングページで正常表示確認

すべて完了したら、実装完了です！🎉
