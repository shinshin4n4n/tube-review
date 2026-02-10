-- ============================================
-- channel_statsをリフレッシュして最新データを反映
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================

-- Materialized Viewをリフレッシュ
REFRESH MATERIALIZED VIEW channel_stats;

-- 確認: 最新の統計を表示
SELECT
  c.title,
  cs.review_count,
  cs.average_rating,
  cs.recent_review_count as reviews_this_week,
  cs.updated_at
FROM channel_stats cs
JOIN channels c ON cs.channel_id = c.id
WHERE cs.review_count > 0
ORDER BY cs.recent_review_count DESC, cs.average_rating DESC
LIMIT 10;

-- 確認メッセージ
SELECT 'channel_stats refreshed successfully!' AS status;
