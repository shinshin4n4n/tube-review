-- ============================================
-- channel_statsの自動リフレッシュを設定
-- ============================================

-- pg_cron拡張機能を有効化（すでに有効な場合はスキップ）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 既存のジョブを削除（存在する場合）
SELECT cron.unschedule('refresh-channel-stats');

-- 10分ごとにchannel_statsをリフレッシュ
SELECT cron.schedule(
  'refresh-channel-stats',
  '*/10 * * * *', -- 10分ごと
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY channel_stats$$
);

-- 確認メッセージ
SELECT 'Auto-refresh scheduled successfully (every 10 minutes)' AS status;

-- 注意:
-- - CONCURRENTLY オプションを使用しているため、クエリ実行中でもリフレッシュ可能
-- - CONCURRENTLY を使用するには、UNIQUE INDEX が必要（既に作成済み）
-- - 10分間隔で自動リフレッシュされるため、ランキングは最大10分遅れで反映
