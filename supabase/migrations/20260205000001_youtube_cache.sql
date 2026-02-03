-- YouTube API キャッシュテーブル
CREATE TABLE youtube_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_youtube_cache_expires ON youtube_cache(expires_at);

-- RLS有効化（全員が読み取り可能）
ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY youtube_cache_select_all ON youtube_cache FOR SELECT USING (true);

-- 期限切れキャッシュ削除関数
CREATE OR REPLACE FUNCTION delete_expired_youtube_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM youtube_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
