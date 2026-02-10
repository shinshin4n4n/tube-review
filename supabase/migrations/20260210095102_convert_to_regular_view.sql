-- ============================================
-- channel_statsをマテリアライズドビューから通常のビューに変更
-- リアルタイム更新でポートフォリオデモに最適
-- ============================================

-- Step 1: 既存のマテリアライズドビューを削除
DROP MATERIALIZED VIEW IF EXISTS channel_stats CASCADE;

-- Step 2: 通常のビューとして再作成
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

-- Step 3: インデックスを再作成（通常のビューではマテリアライズされないが、元テーブルのインデックスを最適化）
CREATE INDEX IF NOT EXISTS idx_reviews_channel_recent ON reviews(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_channels_status ON user_channels(channel_id, status);

-- Step 4: channels_with_stats ビューを再作成
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

-- Step 5: RLSポリシー設定（ビューにはRLSは不要だが、念のため）
-- channel_statsは通常のビューなので、元テーブルのRLSが適用される

-- 確認メッセージ
SELECT 'Successfully converted to regular view - real-time updates enabled!' AS status;

-- 注意:
-- - リアルタイムで反映されるため、リフレッシュ不要
-- - データ量が増えた場合、クエリが遅くなる可能性あり
-- - パフォーマンス問題が発生したら、マテリアライズドビュー + 自動リフレッシュに戻すことを推奨
