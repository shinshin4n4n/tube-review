-- ============================================
-- RLS権限修正: レビュー投稿と参考になった投票の権限を追加
-- ============================================

-- 1. reviews テーブル: INSERT/UPDATE/DELETE権限を追加
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- reviews テーブルに認証ユーザー用のGRANT権限を追加
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;

-- 2. review_helpful テーブル: INSERT/DELETE権限を追加
DROP POLICY IF EXISTS "review_helpful_crud_own" ON review_helpful;
CREATE POLICY "review_helpful_crud_own" ON review_helpful
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_helpful_select_all" ON review_helpful;
CREATE POLICY "review_helpful_select_all" ON review_helpful
  FOR SELECT
  USING (true);

-- review_helpful テーブルに認証ユーザー用のGRANT権限を追加
GRANT SELECT ON review_helpful TO anon;
GRANT SELECT, INSERT, DELETE ON review_helpful TO authenticated;

-- 3. channels テーブル: 誰でも閲覧可能、認証ユーザーは追加・更新可能
DROP POLICY IF EXISTS "channels_select_all" ON channels;
CREATE POLICY "channels_select_all" ON channels
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "channels_insert_authenticated" ON channels;
CREATE POLICY "channels_insert_authenticated" ON channels
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "channels_update_authenticated" ON channels;
CREATE POLICY "channels_update_authenticated" ON channels
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- channels テーブルにSELECT/INSERT/UPDATE権限を追加
GRANT SELECT ON channels TO anon;
GRANT SELECT, INSERT, UPDATE ON channels TO authenticated;

-- 4. users テーブル: 自分のプロフィールを更新可能にする
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- users テーブルに認証ユーザー用のUPDATE権限を追加
GRANT UPDATE ON users TO authenticated;

-- 確認メッセージ
SELECT 'Reviews, review_helpful, and users permissions fixed successfully' AS status;
