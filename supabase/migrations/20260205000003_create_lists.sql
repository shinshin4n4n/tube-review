-- マイリスト（リスト）テーブルの作成
-- ユーザーが独自のテーマでチャンネルをグループ化できる

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  CONSTRAINT lists_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- インデックス
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_created_at ON lists(created_at DESC);
CREATE INDEX idx_lists_public ON lists(is_public) WHERE is_public = true;

-- RLS有効化
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 自分のリストは読み書き可能
CREATE POLICY lists_crud_own ON lists
  FOR ALL
  USING (auth.uid() = user_id);

-- RLSポリシー: 公開リストは誰でも閲覧可能
CREATE POLICY lists_select_public ON lists
  FOR SELECT
  USING (is_public = true);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_lists_updated_at();

-- コメント
COMMENT ON TABLE lists IS 'ユーザーが作成するカスタムリスト';
COMMENT ON COLUMN lists.user_id IS 'リスト作成者';
COMMENT ON COLUMN lists.name IS 'リスト名（最大50文字）';
COMMENT ON COLUMN lists.description IS 'リスト説明（最大200文字）';
COMMENT ON COLUMN lists.is_public IS '公開設定（true=公開、false=非公開）';
