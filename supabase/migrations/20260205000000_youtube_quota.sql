-- YouTube API Quota Usage テーブル
CREATE TABLE quota_usage (
  date TEXT PRIMARY KEY,
  used INTEGER NOT NULL DEFAULT 0,
  operations JSONB NOT NULL DEFAULT '{"search": 0, "details": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_quota_usage_date ON quota_usage(date DESC);

-- RLS有効化（管理者のみアクセス可能）
ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY quota_usage_admin_only ON quota_usage FOR ALL USING (false);

-- updated_at自動更新トリガー
CREATE TRIGGER update_quota_usage_updated_at
BEFORE UPDATE ON quota_usage
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
