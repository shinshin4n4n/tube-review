-- チャンネルテーブルに総視聴回数カラムを追加
ALTER TABLE channels
ADD COLUMN view_count BIGINT DEFAULT 0;

-- インデックスを作成（ランキング用）
CREATE INDEX idx_channels_view_count ON channels(view_count DESC);
