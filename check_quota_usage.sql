-- ============================================
-- YouTube APIクォータ使用状況の確認
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================

-- 今日のクォータ使用状況
SELECT
  date,
  used as total_used,
  (10000 - used) as remaining,
  ROUND((used::numeric / 10000) * 100, 2) as usage_percentage,
  operations->>'search' as search_count,
  operations->>'details' as details_count
FROM quota_usage
WHERE date = CURRENT_DATE
ORDER BY date DESC;

-- 過去7日間のクォータ使用状況
SELECT
  date,
  used as total_used,
  ROUND((used::numeric / 10000) * 100, 2) as usage_percentage,
  operations->>'search' as search_count,
  operations->>'details' as details_count
FROM quota_usage
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- 平均使用量（過去30日間）
SELECT
  ROUND(AVG(used), 0) as avg_daily_usage,
  ROUND(MAX(used), 0) as max_daily_usage,
  ROUND(MIN(used), 0) as min_daily_usage,
  ROUND(AVG((used::numeric / 10000) * 100), 2) as avg_usage_percentage
FROM quota_usage
WHERE date >= CURRENT_DATE - INTERVAL '30 days';
