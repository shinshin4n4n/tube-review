-- ============================================
-- TubeReview 初期スキーマ
-- ============================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 全文検索用

-- ============================================
-- ENUMタイプ
-- ============================================

CREATE TYPE channel_status AS ENUM ('want', 'watching', 'watched');

-- ============================================
-- テーブル定義
-- ============================================

-- 1. users（ユーザー）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- 2. user_settings（ユーザー設定）
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_settings_preferences ON user_settings USING gin(preferences);

-- 3. user_follows（フォロー関係）
CREATE TABLE user_follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_followee ON user_follows(followee_id);

-- 4. channels（チャンネル）
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_channel_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  subscriber_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  latest_video_at TIMESTAMPTZ,
  category TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  cache_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_channels_youtube_id ON channels(youtube_channel_id);
CREATE INDEX idx_channels_category ON channels(category);
CREATE INDEX idx_channels_tags ON channels USING gin(tags);
CREATE INDEX idx_channels_latest_video ON channels(latest_video_at DESC);
CREATE INDEX idx_channels_subscriber ON channels(subscriber_count DESC);
CREATE INDEX idx_channels_title_trgm ON channels USING gin(title gin_trgm_ops);
CREATE INDEX idx_channels_cursor ON channels(created_at DESC, id);

-- 5. top_videos（代表作動画）
CREATE TABLE top_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  view_count BIGINT DEFAULT 0,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, rank)
);

CREATE INDEX idx_top_videos_channel ON top_videos(channel_id, rank);

-- 6. reviews（レビュー）
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_reviews_channel ON reviews(channel_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_user ON reviews(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful ON reviews(helpful_count DESC);
CREATE INDEX idx_reviews_cursor ON reviews(created_at DESC, id) WHERE deleted_at IS NULL;

-- 7. review_helpful（参考になったボタン）
CREATE TABLE review_helpful (
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

CREATE INDEX idx_review_helpful_user ON review_helpful(user_id);

-- 8. user_channels（マイリスト管理）
CREATE TABLE user_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  status channel_status NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  private_memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_user_channels_user ON user_channels(user_id, status);
CREATE INDEX idx_user_channels_channel ON user_channels(channel_id);
CREATE INDEX idx_user_channels_status ON user_channels(status);

-- 9. lists（テーマ別リスト）
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  slug TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lists_user ON lists(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_slug ON lists(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_public ON lists(is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_popular ON lists(like_count DESC) WHERE deleted_at IS NULL;

-- 10. list_channels（リスト内チャンネル）
CREATE TABLE list_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, channel_id)
);

CREATE INDEX idx_list_channels_list ON list_channels(list_id, order_index);
CREATE INDEX idx_list_channels_channel ON list_channels(channel_id);

-- 11. list_likes（リストいいね）
CREATE TABLE list_likes (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX idx_list_likes_user ON list_likes(user_id);

-- ============================================
-- Materialized View
-- ============================================

-- 12. channel_stats（チャンネル統計）
CREATE MATERIALIZED VIEW channel_stats AS
SELECT
  c.id AS channel_id,
  COUNT(DISTINCT r.id) AS review_count,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(DISTINCT CASE WHEN uc.status = 'want' THEN uc.user_id END) AS want_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'watching' THEN uc.user_id END) AS watching_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'watched' THEN uc.user_id END) AS watched_count,
  NOW() AS updated_at
FROM channels c
LEFT JOIN reviews r ON c.id = r.channel_id AND r.deleted_at IS NULL
LEFT JOIN user_channels uc ON c.id = uc.channel_id
GROUP BY c.id;

CREATE UNIQUE INDEX idx_channel_stats_channel ON channel_stats(channel_id);

-- Materialized View更新関数
CREATE OR REPLACE FUNCTION refresh_channel_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY channel_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views
-- ============================================

-- チャンネル一覧 + 統計情報
CREATE VIEW channels_with_stats AS
SELECT
  c.*,
  cs.review_count,
  cs.average_rating,
  cs.want_count,
  cs.watching_count,
  cs.watched_count
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY users_select_others ON users FOR SELECT USING (deleted_at IS NULL);

-- user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_crud_own ON user_settings FOR ALL USING (auth.uid() = user_id);

-- user_follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_follows_crud_own ON user_follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY user_follows_select_all ON user_follows FOR SELECT USING (true);

-- channels（全員読み取り可能）
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY channels_select_all ON channels FOR SELECT USING (true);

-- top_videos（全員読み取り可能）
ALTER TABLE top_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY top_videos_select_all ON top_videos FOR SELECT USING (true);

-- reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_crud_own ON reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY reviews_select_others ON reviews FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- review_helpful
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

CREATE POLICY review_helpful_crud_own ON review_helpful FOR ALL USING (auth.uid() = user_id);
CREATE POLICY review_helpful_select_all ON review_helpful FOR SELECT USING (true);

-- user_channels
ALTER TABLE user_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_channels_crud_own ON user_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_channels_select_public ON user_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_settings
    WHERE user_id = user_channels.user_id
    AND is_public = true
  )
);

-- lists
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY lists_crud_own ON lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY lists_select_public ON lists FOR SELECT USING (is_public = true AND deleted_at IS NULL);
CREATE POLICY lists_insert ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);

-- list_channels
ALTER TABLE list_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY list_channels_crud_via_list ON list_channels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lists
    WHERE id = list_channels.list_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY list_channels_select_public ON list_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lists
    WHERE id = list_channels.list_id
    AND is_public = true
    AND deleted_at IS NULL
  )
);

-- list_likes
ALTER TABLE list_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY list_likes_crud_own ON list_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY list_likes_select_all ON list_likes FOR SELECT USING (true);

-- ============================================
-- Triggers（updated_at自動更新）
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_top_videos_updated_at BEFORE UPDATE ON top_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_channels_updated_at BEFORE UPDATE ON user_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初期Materialized View作成
-- ============================================

REFRESH MATERIALIZED VIEW channel_stats;
