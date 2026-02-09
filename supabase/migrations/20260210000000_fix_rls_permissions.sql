-- ============================================
-- RLS権限修正: 公開データと認証データへのアクセスを許可
-- ============================================

-- 1. reviews テーブル: 誰でも閲覧可能
DROP POLICY IF EXISTS "reviews_select_active" ON reviews;
CREATE POLICY "reviews_select_active" ON reviews
  FOR SELECT
  USING (true);

GRANT SELECT ON reviews TO anon;
GRANT SELECT ON reviews TO authenticated;

-- 2. channels テーブル: 誰でも閲覧可能
DROP POLICY IF EXISTS "channels_select_all" ON channels;
CREATE POLICY "channels_select_all" ON channels
  FOR SELECT
  USING (true);

GRANT SELECT ON channels TO anon;
GRANT SELECT ON channels TO authenticated;

-- 3. users テーブル: 誰でも閲覧可能
DROP POLICY IF EXISTS "users_select_public" ON users;
CREATE POLICY "users_select_public" ON users
  FOR SELECT
  USING (true);

GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- 4. channels_with_stats ビュー: SELECT権限を付与
GRANT SELECT ON channels_with_stats TO anon;
GRANT SELECT ON channels_with_stats TO authenticated;

-- 5. channel_stats: テーブルまたはビューに応じて処理
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channel_stats') THEN
    EXECUTE 'DROP POLICY IF EXISTS "channel_stats_select_all" ON channel_stats';
    EXECUTE 'CREATE POLICY "channel_stats_select_all" ON channel_stats FOR SELECT USING (true)';
    EXECUTE 'GRANT SELECT ON channel_stats TO anon';
    EXECUTE 'GRANT SELECT ON channel_stats TO authenticated';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'channel_stats') THEN
    EXECUTE 'GRANT SELECT ON channel_stats TO anon';
    EXECUTE 'GRANT SELECT ON channel_stats TO authenticated';
  END IF;
END $$;

-- 6. user_channels テーブル: 自分のデータは読み書き可能
DROP POLICY IF EXISTS "user_channels_select_own" ON user_channels;
CREATE POLICY "user_channels_select_own" ON user_channels
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_channels_insert_own" ON user_channels;
CREATE POLICY "user_channels_insert_own" ON user_channels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_channels_update_own" ON user_channels;
CREATE POLICY "user_channels_update_own" ON user_channels
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_channels_delete_own" ON user_channels;
CREATE POLICY "user_channels_delete_own" ON user_channels
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON user_channels TO authenticated;

-- 7. lists テーブル: 自分のリストは読み書き可能、公開リストは誰でも閲覧可能
DROP POLICY IF EXISTS "lists_select_own" ON lists;
CREATE POLICY "lists_select_own" ON lists
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "lists_insert_own" ON lists;
CREATE POLICY "lists_insert_own" ON lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lists_update_own" ON lists;
CREATE POLICY "lists_update_own" ON lists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lists_delete_own" ON lists;
CREATE POLICY "lists_delete_own" ON lists
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON lists TO authenticated;

-- 8. list_channels テーブル: リストの所有者または公開リストのみアクセス可能
DROP POLICY IF EXISTS "list_channels_select_own" ON list_channels;
CREATE POLICY "list_channels_select_own" ON list_channels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_channels.list_id
      AND (lists.user_id = auth.uid() OR lists.is_public = true)
    )
  );

DROP POLICY IF EXISTS "list_channels_insert_own" ON list_channels;
CREATE POLICY "list_channels_insert_own" ON list_channels
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_channels.list_id
      AND lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "list_channels_update_own" ON list_channels;
CREATE POLICY "list_channels_update_own" ON list_channels
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_channels.list_id
      AND lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "list_channels_delete_own" ON list_channels;
CREATE POLICY "list_channels_delete_own" ON list_channels
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_channels.list_id
      AND lists.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON list_channels TO authenticated;

-- 9. user_settings テーブル: 自分の設定は読み書き可能
DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert_own" ON user_settings;
CREATE POLICY "user_settings_insert_own" ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_own" ON user_settings;
CREATE POLICY "user_settings_update_own" ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;

-- 確認メッセージ
SELECT 'All RLS permissions and GRANT privileges configured successfully' AS status;
