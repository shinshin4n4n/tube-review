-- ============================================
-- ビューの権限を修正（緊急）
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================

-- channel_stats ビューに権限を付与
GRANT SELECT ON channel_stats TO anon;
GRANT SELECT ON channel_stats TO authenticated;

-- channels_with_stats ビューに権限を付与
GRANT SELECT ON channels_with_stats TO anon;
GRANT SELECT ON channels_with_stats TO authenticated;

-- 確認: ビューが正しく機能するかテスト
SELECT
  c.title,
  cs.review_count,
  cs.average_rating,
  cs.recent_review_count
FROM channels_with_stats cs
JOIN channels c ON cs.id = c.id
WHERE cs.review_count > 0
LIMIT 5;

-- 確認メッセージ
SELECT 'View permissions fixed successfully!' AS status;
