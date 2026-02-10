-- ============================================
-- チャンネルデータのデバッグクエリ
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================

-- 1. channelsテーブルのデータ件数を確認
SELECT
  COUNT(*) as total_channels,
  COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as channels_with_title
FROM channels;

-- 2. 最近追加されたチャンネルを確認（上位10件）
SELECT
  id,
  youtube_channel_id,
  title,
  subscriber_count,
  created_at,
  updated_at
FROM channels
ORDER BY created_at DESC
LIMIT 10;

-- 3. チャンネル検索のテスト（例：「料理」で検索）
SELECT
  id,
  youtube_channel_id,
  title,
  thumbnail_url,
  subscriber_count
FROM channels
WHERE title ILIKE '%料理%'
LIMIT 10;

-- 4. RLSポリシーの確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'channels';

-- 5. GRANT権限の確認
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'channels'
ORDER BY grantee, privilege_type;
