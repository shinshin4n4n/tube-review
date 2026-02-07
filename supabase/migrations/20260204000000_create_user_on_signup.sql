-- ============================================
-- ユーザー自動作成トリガー
-- ============================================

-- 認証時にpublic.usersにレコードを自動作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  counter INTEGER := 0;
  base_username TEXT;
BEGIN
  -- メールアドレスからベースとなるユーザー名を生成
  base_username := split_part(NEW.email, '@', 1);
  username_value := base_username;

  -- ユーザー名が既に存在する場合は数字を付加
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = username_value) LOOP
    counter := counter + 1;
    username_value := base_username || counter::TEXT;
  END LOOP;

  -- public.usersテーブルにレコードを作成
  INSERT INTO public.users (
    id,
    email,
    username,
    display_name,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    username_value,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', username_value),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );

  -- デフォルトのユーザー設定も作成
  INSERT INTO public.user_settings (
    user_id,
    is_public,
    email_notifications,
    preferences,
    updated_at
  ) VALUES (
    NEW.id,
    true,
    true,
    '{}'::jsonb,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成（auth.usersテーブルにレコードが追加されたときに実行）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLSポリシーの追加（ユーザー自身がレコードを作成できるようにする）
-- ============================================

-- ユーザーが自分のレコードを作成できるポリシーを追加
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 既存ユーザーのマイグレーション
-- ============================================

-- 既存のauth.usersで、public.usersにレコードがないユーザーを作成
DO $$
DECLARE
  auth_user RECORD;
  username_value TEXT;
  counter INTEGER;
  base_username TEXT;
BEGIN
  FOR auth_user IN
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.users.id
    )
  LOOP
    -- メールアドレスからベースとなるユーザー名を生成
    base_username := split_part(auth_user.email, '@', 1);
    username_value := base_username;
    counter := 0;

    -- ユーザー名が既に存在する場合は数字を付加
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = username_value) LOOP
      counter := counter + 1;
      username_value := base_username || counter::TEXT;
    END LOOP;

    -- public.usersテーブルにレコードを作成
    INSERT INTO public.users (
      id,
      email,
      username,
      display_name,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      auth_user.id,
      auth_user.email,
      username_value,
      COALESCE(
        auth_user.raw_user_meta_data->>'name',
        auth_user.raw_user_meta_data->>'full_name',
        username_value
      ),
      auth_user.raw_user_meta_data->>'avatar_url',
      auth_user.created_at,
      NOW()
    );

    -- デフォルトのユーザー設定も作成
    INSERT INTO public.user_settings (
      user_id,
      is_public,
      email_notifications,
      preferences,
      updated_at
    ) VALUES (
      auth_user.id,
      true,
      true,
      '{}'::jsonb,
      NOW()
    );
  END LOOP;
END $$;
