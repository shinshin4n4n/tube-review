-- ============================================
-- チャンネル統計の増分更新実装
-- ============================================
--
-- 目的:
-- - Materialized Viewからテーブルベースの増分更新に変更
-- - レビュー投稿時に該当チャンネルのみを高速更新
-- - フルリフレッシュ不要でリアルタイム更新を実現
--
-- ============================================

-- Step 1: 既存のMaterialized Viewを削除
DROP MATERIALIZED VIEW IF EXISTS channel_stats CASCADE;

-- Step 2: 通常のテーブルとして作成
CREATE TABLE channel_stats (
  channel_id UUID PRIMARY KEY REFERENCES channels(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(4,2) DEFAULT 0.00,
  recent_review_count INTEGER DEFAULT 0,
  want_count INTEGER DEFAULT 0,
  watching_count INTEGER DEFAULT 0,
  watched_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: インデックス作成
CREATE INDEX idx_channel_stats_recent_reviews ON channel_stats(recent_review_count DESC, average_rating DESC);
CREATE INDEX idx_channel_stats_rating ON channel_stats(average_rating DESC);
CREATE INDEX idx_channel_stats_updated ON channel_stats(updated_at DESC);

-- Step 4: 初期データを投入
INSERT INTO channel_stats (
  channel_id,
  review_count,
  average_rating,
  recent_review_count,
  want_count,
  watching_count,
  watched_count,
  updated_at
)
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

-- Step 5: 増分更新関数（レビュー用）
CREATE OR REPLACE FUNCTION update_channel_stats_for_review()
RETURNS TRIGGER AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  -- 影響を受けるチャンネルIDを取得
  v_channel_id := COALESCE(NEW.channel_id, OLD.channel_id);

  -- 統計情報を更新（UPSERT）
  INSERT INTO channel_stats (
    channel_id,
    review_count,
    average_rating,
    recent_review_count,
    updated_at
  )
  SELECT
    v_channel_id,
    COUNT(*) AS review_count,
    COALESCE(AVG(rating), 0) AS average_rating,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS recent_review_count,
    NOW() AS updated_at
  FROM reviews
  WHERE channel_id = v_channel_id AND deleted_at IS NULL
  ON CONFLICT (channel_id)
  DO UPDATE SET
    review_count = EXCLUDED.review_count,
    average_rating = EXCLUDED.average_rating,
    recent_review_count = EXCLUDED.recent_review_count,
    updated_at = EXCLUDED.updated_at;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 6: 増分更新関数（user_channels用）
CREATE OR REPLACE FUNCTION update_channel_stats_for_user_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  -- 影響を受けるチャンネルIDを取得
  v_channel_id := COALESCE(NEW.channel_id, OLD.channel_id);

  -- 統計情報を更新（UPSERT）
  INSERT INTO channel_stats (
    channel_id,
    want_count,
    watching_count,
    watched_count,
    updated_at
  )
  SELECT
    v_channel_id,
    COUNT(CASE WHEN status = 'want' THEN 1 END) AS want_count,
    COUNT(CASE WHEN status = 'watching' THEN 1 END) AS watching_count,
    COUNT(CASE WHEN status = 'watched' THEN 1 END) AS watched_count,
    NOW() AS updated_at
  FROM user_channels
  WHERE channel_id = v_channel_id
  ON CONFLICT (channel_id)
  DO UPDATE SET
    want_count = EXCLUDED.want_count,
    watching_count = EXCLUDED.watching_count,
    watched_count = EXCLUDED.watched_count,
    updated_at = EXCLUDED.updated_at;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 7: トリガー作成（レビュー投稿/更新/削除時）
DROP TRIGGER IF EXISTS trigger_update_channel_stats_on_review ON reviews;
CREATE TRIGGER trigger_update_channel_stats_on_review
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_channel_stats_for_review();

-- Step 8: トリガー作成（user_channels変更時）
DROP TRIGGER IF EXISTS trigger_update_channel_stats_on_user_channel ON user_channels;
CREATE TRIGGER trigger_update_channel_stats_on_user_channel
AFTER INSERT OR UPDATE OR DELETE ON user_channels
FOR EACH ROW
EXECUTE FUNCTION update_channel_stats_for_user_channel();

-- Step 9: 新規チャンネル作成時の統計初期化
CREATE OR REPLACE FUNCTION initialize_channel_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO channel_stats (channel_id, updated_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (channel_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initialize_channel_stats ON channels;
CREATE TRIGGER trigger_initialize_channel_stats
AFTER INSERT ON channels
FOR EACH ROW
EXECUTE FUNCTION initialize_channel_stats();

-- Step 10: channels_with_stats ビューを再作成
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

-- Step 11: RLSポリシー設定
ALTER TABLE channel_stats ENABLE ROW LEVEL SECURITY;

-- 全員が統計情報を閲覧可能
CREATE POLICY channel_stats_select_all ON channel_stats
  FOR SELECT
  USING (true);

-- 統計情報の更新はトリガー経由のみ（直接更新は不可）
-- サービスロールのみが更新可能
CREATE POLICY channel_stats_update_service_role ON channel_stats
  FOR UPDATE
  USING (false);

CREATE POLICY channel_stats_insert_service_role ON channel_stats
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY channel_stats_delete_service_role ON channel_stats
  FOR DELETE
  USING (false);

-- Step 12: コメント追加
COMMENT ON TABLE channel_stats IS '増分更新方式のチャンネル統計テーブル。レビュー投稿時に自動更新される。';
COMMENT ON FUNCTION update_channel_stats_for_review() IS 'レビュー投稿/更新/削除時に該当チャンネルの統計を増分更新';
COMMENT ON FUNCTION update_channel_stats_for_user_channel() IS 'マイリスト変更時に該当チャンネルの統計を増分更新';
COMMENT ON TRIGGER trigger_update_channel_stats_on_review ON reviews IS 'レビュー変更時に統計を自動更新';
COMMENT ON TRIGGER trigger_update_channel_stats_on_user_channel ON user_channels IS 'マイリスト変更時に統計を自動更新';

-- ============================================
-- 完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ チャンネル統計の増分更新が有効になりました';
  RAISE NOTICE '📊 初期データ投入完了: % チャンネル', (SELECT COUNT(*) FROM channel_stats);
  RAISE NOTICE '⚡ レビュー投稿時に自動更新されます';
END $$;
