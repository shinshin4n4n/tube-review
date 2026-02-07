-- YouTube cache テーブルに INSERT/UPDATE/DELETE ポリシーを追加
-- キャッシュは全員が書き込み可能（サーバーサイドから使用）

-- INSERT ポリシー（全員が挿入可能）
CREATE POLICY youtube_cache_insert_all ON youtube_cache
  FOR INSERT
  WITH CHECK (true);

-- UPDATE ポリシー（全員が更新可能）
CREATE POLICY youtube_cache_update_all ON youtube_cache
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE ポリシー（全員が削除可能）
CREATE POLICY youtube_cache_delete_all ON youtube_cache
  FOR DELETE
  USING (true);
