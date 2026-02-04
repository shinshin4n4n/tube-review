-- ユーザーチャンネルステータステーブルの作成
-- ユーザーがチャンネルを「見たい」「見ている」「見た」で管理

-- ステータスENUM型の作成
CREATE TYPE channel_status AS ENUM ('want_to_watch', 'watching', 'watched');

-- user_channelsテーブルの作成
CREATE TABLE IF NOT EXISTS user_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  status channel_status NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約: 同じユーザーが同じチャンネルを重複して追加できない
  UNIQUE(user_id, channel_id)
);

-- インデックス
CREATE INDEX idx_user_channels_user_id ON user_channels(user_id);
CREATE INDEX idx_user_channels_channel_id ON user_channels(channel_id);
CREATE INDEX idx_user_channels_status ON user_channels(status);
CREATE INDEX idx_user_channels_user_status ON user_channels(user_id, status);

-- RLS有効化
ALTER TABLE user_channels ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 自分のデータは読み書き可能
CREATE POLICY user_channels_crud_own ON user_channels
  FOR ALL
  USING (auth.uid() = user_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_user_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_channels_updated_at
  BEFORE UPDATE ON user_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_user_channels_updated_at();

-- コメント
COMMENT ON TABLE user_channels IS 'ユーザーのチャンネルステータス管理（見たい/見ている/見た）';
COMMENT ON COLUMN user_channels.user_id IS 'ユーザーID';
COMMENT ON COLUMN user_channels.channel_id IS 'チャンネルID';
COMMENT ON COLUMN user_channels.status IS 'ステータス（want_to_watch/watching/watched）';
COMMENT ON COLUMN user_channels.added_at IS 'マイリスト追加日時';
COMMENT ON COLUMN user_channels.updated_at IS '最終更新日時';
