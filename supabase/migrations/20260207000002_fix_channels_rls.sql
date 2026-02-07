-- channelsテーブルのRLSポリシーを修正
-- 既存のSELECTポリシーは保持し、INSERT/UPDATEポリシーを追加

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "channels_insert_all" ON channels;
DROP POLICY IF EXISTS "channels_update_all" ON channels;

-- 誰でもチャンネル情報を挿入・更新できるようにする（開発環境用）
-- 本番環境では、サービスロール経由でのみ挿入すべき
CREATE POLICY "channels_insert_all" ON channels
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "channels_update_all" ON channels
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ポリシーの説明
COMMENT ON POLICY "channels_insert_all" ON channels IS 'Allow anyone to insert channel data (for development)';
COMMENT ON POLICY "channels_update_all" ON channels IS 'Allow anyone to update channel data (for development)';
