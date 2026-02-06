-- ============================================
-- プロフィールフィールド追加
-- ============================================

-- usersテーブルにプロフィール関連カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 制約とインデックス追加
ALTER TABLE users ADD CONSTRAINT users_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

ALTER TABLE users ADD CONSTRAINT users_occupation_length CHECK (char_length(occupation) <= 100);
ALTER TABLE users ADD CONSTRAINT users_prefecture_length CHECK (char_length(prefecture) <= 10);
ALTER TABLE users ADD CONSTRAINT users_website_url_length CHECK (char_length(website_url) <= 500);
ALTER TABLE users ADD CONSTRAINT users_bio_length CHECK (char_length(bio) <= 500);
