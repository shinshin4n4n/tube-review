-- ============================================
-- マテリアライズドビュー化: channel_stats
-- GitHub Actionsで定期リフレッシュすることで、
-- Supabase Proなしでパフォーマンスを向上
-- ============================================

-- Step 1: 既存のVIEWを削除
DROP VIEW IF EXISTS channel_stats CASCADE;

-- Step 2: MATERIALIZED VIEWとして再作成
CREATE MATERIALIZED VIEW channel_stats AS
SELECT
  c.id AS channel_id,
  COUNT(DISTINCT r.id) AS review_count,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(DISTINCT CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN r.id END) AS recent_review_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'want' THEN uc.user_id END) AS want_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'watching' THEN uc.user_id END) AS watching_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'watched' THEN uc.user_id END) AS watched_count,
  NOW() AS updated_at
FROM channels c
LEFT JOIN reviews r ON c.id = r.channel_id AND r.deleted_at IS NULL
LEFT JOIN user_channels uc ON c.id = uc.channel_id
GROUP BY c.id;

-- Step 3: インデックス作成（CONCURRENTLYでのリフレッシュに必須）
CREATE UNIQUE INDEX idx_channel_stats_channel_id ON channel_stats(channel_id);
CREATE INDEX idx_channel_stats_review_count ON channel_stats(review_count DESC);
CREATE INDEX idx_channel_stats_average_rating ON channel_stats(average_rating DESC);

-- Step 4: channels_with_stats ビューを再作成
DROP VIEW IF EXISTS channels_with_stats CASCADE;
CREATE VIEW channels_with_stats AS
SELECT
  c.*,
  COALESCE(cs.review_count, 0) AS review_count,
  COALESCE(cs.average_rating, 0) AS average_rating,
  COALESCE(cs.recent_review_count, 0) AS recent_review_count,
  COALESCE(cs.want_count, 0) AS want_count,
  COALESCE(cs.watching_count, 0) AS watching_count,
  COALESCE(cs.watched_count, 0) AS watched_count
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id;

-- Step 5: 権限設定
GRANT SELECT ON channel_stats TO anon;
GRANT SELECT ON channel_stats TO authenticated;
GRANT SELECT ON channels_with_stats TO anon;
GRANT SELECT ON channels_with_stats TO authenticated;

-- Step 6: リフレッシュ用の関数を作成（オプション: 直接SQLでも可）
CREATE OR REPLACE FUNCTION refresh_channel_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY channel_stats;
END;
$$;

-- 関数の実行権限
GRANT EXECUTE ON FUNCTION refresh_channel_stats() TO service_role;

-- 確認メッセージ
SELECT 'Materialized view channel_stats created successfully' AS status;
