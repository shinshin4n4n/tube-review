-- ============================================
-- 本番環境用: channel_statsをリアルタイムビューに変換
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================

-- Step 1: 既存のcronジョブを削除（存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('refresh-channel-stats');
  END IF;
END $$;

-- Step 2: 既存のマテリアライズドビューを削除
DROP MATERIALIZED VIEW IF EXISTS channel_stats CASCADE;

-- Step 3: 通常のビューとして再作成
CREATE VIEW channel_stats AS
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

-- Step 4: パフォーマンス最適化用インデックス
CREATE INDEX IF NOT EXISTS idx_reviews_channel_recent ON reviews(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_channels_status ON user_channels(channel_id, status);

-- Step 5: channels_with_stats ビューを再作成
CREATE OR REPLACE VIEW channels_with_stats AS
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

-- 確認: 最新の統計を表示
SELECT
  c.title,
  cs.review_count,
  cs.average_rating,
  cs.recent_review_count as reviews_this_week
FROM channel_stats cs
JOIN channels c ON cs.channel_id = c.id
WHERE cs.review_count > 0
ORDER BY cs.recent_review_count DESC, cs.average_rating DESC
LIMIT 10;

-- 確認メッセージ
SELECT 'Successfully converted to real-time view! 🎉' AS status;
