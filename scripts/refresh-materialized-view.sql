-- ============================================
-- チャンネル統計情報の実体化ビューをリフレッシュ
-- ============================================
--
-- 実行方法:
-- 1. Supabase Dashboard > SQL Editor
-- 2. このSQLを貼り付けて実行
--
-- または、Supabase CLIから:
-- npx supabase db execute --file scripts/refresh-materialized-view.sql
--
-- ============================================

-- 実体化ビューをリフレッシュ
REFRESH MATERIALIZED VIEW channel_stats;

-- 結果確認：更新時刻と件数を表示
SELECT
  COUNT(*) as channel_count,
  MAX(updated_at) as last_updated,
  SUM(review_count) as total_reviews,
  SUM(recent_review_count) as recent_reviews
FROM channel_stats;

-- トップ10チャンネルを表示（確認用）
SELECT
  cs.channel_id,
  c.title,
  cs.recent_review_count,
  cs.average_rating,
  cs.review_count
FROM channel_stats cs
JOIN channels c ON c.id = cs.channel_id
ORDER BY cs.recent_review_count DESC, cs.average_rating DESC
LIMIT 10;
