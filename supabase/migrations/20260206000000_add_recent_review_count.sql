-- ============================================
-- Materialized View拡張: 直近7日間のレビュー数追加
-- ============================================

-- 既存のMaterialized Viewを削除
DROP MATERIALIZED VIEW IF EXISTS channel_stats CASCADE;

-- 拡張版Materialized Viewを作成
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

-- インデックス作成
CREATE UNIQUE INDEX idx_channel_stats_channel ON channel_stats(channel_id);
CREATE INDEX idx_channel_stats_recent_reviews ON channel_stats(recent_review_count DESC, average_rating DESC);

-- 初回更新
REFRESH MATERIALIZED VIEW channel_stats;

-- 既存のViewを再作成
CREATE OR REPLACE VIEW channels_with_stats AS
SELECT
  c.*,
  cs.review_count,
  cs.average_rating,
  cs.recent_review_count,
  cs.want_count,
  cs.watching_count,
  cs.watched_count
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id;
