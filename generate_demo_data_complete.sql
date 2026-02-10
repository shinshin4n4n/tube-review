-- ============================================
-- デモデータ完全生成スクリプト
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================

-- Step 1: ダミーユーザーを作成
DO $$
DECLARE
  user_names TEXT[] := ARRAY['ユウキ', 'サクラ', 'ハルト', 'アイ', 'ソウタ', 'ユイ', 'リク', 'ヒナ', 'ユウト', 'ミユ', 'ハル', 'アオイ', 'タクミ', 'メイ', 'ケンタ', 'リナ', 'カイト', 'ナナ', 'ショウ', 'エマ'];
  user_name TEXT;
BEGIN
  FOREACH user_name IN ARRAY user_names
  LOOP
    INSERT INTO users (username, display_name, avatar_url, email)
    VALUES (
      lower(user_name),
      user_name || 'さん',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_name,
      lower(user_name) || '@demo.example.com'
    )
    ON CONFLICT (username) DO NOTHING;
  END LOOP;

  RAISE NOTICE '✅ ダミーユーザーを作成しました';
END $$;

-- Step 2: 実在の人気チャンネルを追加（YouTube Channel IDを使用）
-- 注意: これらは実在のチャンネルIDです。YouTube APIで詳細情報を取得する必要があります。

-- エンタメ
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCZf__qAHMt0nwv9Xbq5KpWA', '東海オンエア', 'エンターテイメント系YouTuber', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 680000, 2500, 'entertainment', NOW(), NOW()),
  ('UCkJ5CfuB8LhLr_MFP25WPIQ', 'フィッシャーズ', 'エンターテイメント・チャレンジ企画', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 750000, 3000, 'entertainment', NOW(), NOW()),
  ('UUUM2nZxhgkTLcD8EYu93wnQ', 'ヒカル', 'エンターテイメント・企画系', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 480000, 1800, 'entertainment', NOW(), NOW()),
  ('UCLAhxyy4zWQrT7tlhCMmLbw', 'QuizKnock', '知的エンターテイメント', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 220000, 1200, 'entertainment', NOW(), NOW()),
  ('UCOhn8REcZ9XqbXPZ_rKs_zQ', 'すしらーめんりく', 'エンタメ・企画系', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 180000, 900, 'entertainment', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ゲーム
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCGwO-AJTXdfqZqUGvJQjtsw', 'ポッキー', 'ゲーム実況', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 320000, 2800, 'gaming', NOW(), NOW()),
  ('UC3vzQ7GiqKJrJKTLVELKLbw', 'まいぜんシスターズ', 'マイクラ実況', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 580000, 1500, 'gaming', NOW(), NOW()),
  ('UCiCJNLjUz3GtDoMp9FNxM3g', 'カズゲームズ', 'ゲーム実況', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 190000, 3500, 'gaming', NOW(), NOW()),
  ('UCjWod8-e4LBT1J8AOBgJDqA', 'キヨ', 'ゲーム実況', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 420000, 2200, 'gaming', NOW(), NOW()),
  ('UC7YaKYID1kXQjj6qkRZEcqg', 'レトルト', 'ゲーム実況', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 3000, 'gaming', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 音楽
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCJCyFxMQ3YcR9obNNh5bzyQ', 'まふまふ', '歌ってみた・音楽', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 350000, 800, 'music', NOW(), NOW()),
  ('UC_7HFdldYi_tUMY1dYL86TA', 'そらる', '歌ってみた・音楽', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 650, 'music', NOW(), NOW()),
  ('UCiUJhLBUg5vLNtILLHDM6cA', 'Goose house', '音楽', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 420000, 500, 'music', NOW(), NOW()),
  ('UCt0clH47IITjAB8fYGZZqKw', 'すとぷり', '音楽・エンタメ', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 380000, 700, 'music', NOW(), NOW()),
  ('UCpvU5tMKfUJXHQsJiEJRiZg', 'りぶ', '歌ってみた', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 150000, 400, 'music', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 教育
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCLAhxyy4zWQrT7tlhCMmLbw', '予備校のノリで学ぶ「大学の数学・物理」', '教育・数学', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 180000, 1000, 'education', NOW(), NOW()),
  ('UCqmWJJolqAgjIdLqK3zD1QQ', '中田敦彦のYouTube大学', '教育・解説', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 480000, 900, 'education', NOW(), NOW()),
  ('UCTcNVhVDwwWVYjFMJwuEz3Q', 'PASSLABO', '資格試験・教育', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 120000, 600, 'education', NOW(), NOW()),
  ('UC7I3QTra4_kC4TSu8f7rHkA', 'とある男が授業をしてみた', '教育・授業', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 220000, 5000, 'education', NOW(), NOW()),
  ('UCcp9uRaBwInrRPP4cpeFVmw', 'メンタリスト DaiGo', '心理学・教育', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 350000, 3000, 'education', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- テクノロジー
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCirb0N5rPyRQy_mVPY2epAw', 'Appleが大好きなんだよ', 'ガジェット・Apple', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 800, 'tech', NOW(), NOW()),
  ('UCoWBWaDZYDJCA2xNNs4V98A', 'トバログ', 'ガジェット・レビュー', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 190000, 600, 'tech', NOW(), NOW()),
  ('UCj1cqfbwwvqGLVtOjKkVcqw', 'カズチャンネル', 'ガジェット・先行レビュー', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 150000, 2000, 'tech', NOW(), NOW()),
  ('UC7pHkRrDN2hUTAu1kWfG8gA', 'VAIENCE バイエンス', 'テクノロジー・科学', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 220000, 400, 'tech', NOW(), NOW()),
  ('UCqGRKM1j5l2Ij5AXqdjZ1qA', 'せろりんね', 'プログラミング・IT', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 180000, 500, 'tech', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ライフスタイル
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCZxYWX2eFS_Ly4AMgLu7bCQ', 'きりまる', '美容・ライフスタイル', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 250000, 900, 'lifestyle', NOW(), NOW()),
  ('UC1d3ygoAY5DhHs6qJq_vxKA', 'Koh Gen Do', '美容・メイク', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 180000, 600, 'lifestyle', NOW(), NOW()),
  ('UC-E7hL89kjJkxF_zqLxaUdA', 'くまみき', 'ライフスタイル・ファッション', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 320000, 800, 'lifestyle', NOW(), NOW()),
  ('UCVCc_dkjLj2ZV7FXXnpHlvw', 'さぁや', 'ライフスタイル', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 210000, 700, 'lifestyle', NOW(), NOW()),
  ('UCaxBzJGw66uXC8MmhDbMQ1g', '会社員J', 'ミニマリスト・ライフスタイル', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 500, 'lifestyle', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- スポーツ
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCjmPpGD83tqoPN5UMN4N9NA', 'なかやまきんに君', 'フィットネス・筋トレ', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 380000, 1200, 'sports', NOW(), NOW()),
  ('UCpqIH_C7kZEZTnbMEgAc3Ig', 'メトロンブログ', 'フィットネス・トレーニング', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 420000, 800, 'sports', NOW(), NOW()),
  ('UCVr4wQQZfvgmSMD2ZIqDT8w', 'Kawahara Takuji', 'サッカー・スポーツ', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 150000, 600, 'sports', NOW(), NOW()),
  ('UCxJ6U53_RK9pWQxaWTjzTTw', 'ザ・きんにくTV', 'フィットネス', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 900, 'sports', NOW(), NOW()),
  ('UCMQhUv9nTvKudPPvcHswgbQ', 'コアラ小嵐', 'サッカー', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 190000, 1000, 'sports', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ニュース
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCnAN19GtNGzF-YwMUWjJ4dA', 'ABEMA NEWS', 'ニュース・報道', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 480000, 8000, 'news', NOW(), NOW()),
  ('UCr5Cpf8H5P5tIiLkDLmgRqA', '日経テレ東大学', 'ビジネス・経済ニュース', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 320000, 1200, 'news', NOW(), NOW()),
  ('UCNHuCvQv53g7YKbLw5-_i6Q', 'NewsPicksチャンネル', 'ビジネス・ニュース解説', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 600, 'news', NOW(), NOW()),
  ('UCw6dPT62bVOFWlJwGlkWh7Q', 'THE FIRST TIMES', 'ニュース・解説', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 150000, 400, 'news', NOW(), NOW()),
  ('UC6AG81pAkf6Lbi_1VC5NmPA', 'ANNnewsCH', 'ニュース', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 380000, 10000, 'news', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 料理
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UC2MCBE8cvUX8NOOHX3SRdCQ', 'きまぐれクック', '料理・魚さばき', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 580000, 1500, 'cooking', NOW(), NOW()),
  ('UCaak9sggUeIBPOd8iK_BXcQ', 'cook kafemaru', '料理・レシピ', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 1200, 'cooking', NOW(), NOW()),
  ('UCq2hFwXYT_lToV6UqvZ5ieg', 'くまの限界食堂', '料理・グルメ', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 420000, 600, 'cooking', NOW(), NOW()),
  ('UC5WiAy_fZjAm_8Laa7CkMJA', 'はるあん', '料理・お菓子作り', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 350000, 800, 'cooking', NOW(), NOW()),
  ('UCPUdq4qZYWKDRxRQYwbZLvA', 'Party Kitchen', '料理・パーティー', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 190000, 900, 'cooking', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 旅行
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UCgVxkUgAyLNR8o_S03nxXhA', 'スーツ 旅行', '旅行・鉄道', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 380000, 2000, 'travel', NOW(), NOW()),
  ('UCe3w8hx6bjQfM0hG_1AoCCw', 'SUSURU TV', '旅行・グルメ', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 420000, 1500, 'travel', NOW(), NOW()),
  ('UCHvI_OV_yoeMJSDc-Q9uNSQ', 'タケヤキ翔', '旅行・冒険', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 800, 'travel', NOW(), NOW()),
  ('UCo6JiWOI8lPjSQ8c3Jmm_TA', '三原慧悟', '旅行Vlog', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 220000, 600, 'travel', NOW(), NOW()),
  ('UCTy2sUwIUm_s3vKyGMt3eWg', 'ナスD', '旅行・冒険', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 350000, 400, 'travel', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- Vlog
INSERT INTO channels (youtube_channel_id, title, description, thumbnail_url, subscriber_count, video_count, category, cache_updated_at, updated_at)
VALUES
  ('UC8RgMN8LJjm3qTY8cfgBz6w', 'Emma Chamberlain', 'Vlog・日常', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 180000, 500, 'vlog', NOW(), NOW()),
  ('UCP4nMSTdwU1KqYWu3_3z15Q', 'PDRさん', 'Vlog・ルーティン', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 320000, 1200, 'vlog', NOW(), NOW()),
  ('UCo9xE1D3FRz1G1p8P3Vy3Nw', 'コムドット', 'Vlog・日常', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 480000, 800, 'vlog', NOW(), NOW()),
  ('UCqqE91B6a7lKqc-IxCjNF3g', 'バイリンガール英会話', 'Vlog・英会話', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 420000, 1000, 'vlog', NOW(), NOW()),
  ('UC-mf3s-9vKdGRIOcLkwdGuw', 'おるたなChannel', 'Vlog・日常', 'https://yt3.ggpht.com/ytc/AIdro_k8rQ-example', 280000, 900, 'vlog', NOW(), NOW())
ON CONFLICT (youtube_channel_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- Step 3: ダミーレビューを生成
DO $$
DECLARE
  channel_record RECORD;
  random_user_id UUID;
  user_ids UUID[];
  rating_val INTEGER;
  review_title TEXT;
  review_content TEXT;
  reviews_count INTEGER;
  random_days_ago INTEGER;
  review_date TIMESTAMPTZ;
  i INTEGER;

  -- レビューテンプレート
  positive_templates TEXT[] := ARRAY[
    'このチャンネルは本当に素晴らしいです！解説がとても分かりやすく、初心者でも理解しやすい内容になっています。特に最新の動画はクオリティが高く、何度も見返してしまいました。これからも応援しています！',
    '登録して本当に良かったです。独自の視点や切り口が新鮮で、毎回新しい発見があります。毎回新しい動画が楽しみで仕方ありません。友達にもおすすめしています！編集のテンポも良く、飽きずに最後まで見られます。',
    '最高のチャンネルです！実用的な情報が多く、すぐに役立てることができました。編集も丁寧で、内容も充実しています。もっと多くの人に知ってもらいたいです。プロフェッショナルな仕上がりに感動しました。',
    'いつも楽しく視聴しています。エンターテイメント性が高く、楽しみながら学べる内容です。このチャンネルのおかげで新しい知識や発見がたくさんありました。感謝しています！コメント欄での交流も活発で素晴らしいです。',
    '素晴らしいコンテンツをありがとうございます。投稿者の人柄が伝わってきて、親しみやすい雰囲気が良いです。これからも質の高い動画を期待しています！更新頻度も安定していて定期的に楽しめます。'
  ];

  neutral_templates TEXT[] := ARRAY[
    '全体的に良いチャンネルだと思います。幅広いテーマを扱っていて、飽きることがありません。ただ、もう少し更新頻度が上がると嬉しいです。今後に期待しています。クオリティは高いので、継続して視聴したいと思います。',
    '面白いコンテンツが多いです。編集のテンポが良く、飽きずに最後まで見られます。たまに内容が薄い回もありますが、基本的には楽しめています。もう少し深掘りした内容も見たいです。それでも十分満足しています。',
    '安定して見られるチャンネルです。実用的な情報が多く、すぐに役立てることができました。特に目立った欠点はありませんが、もう少し個性があると良いかもしれません。それでも継続して視聴する価値はあります。',
    '興味深い内容が多いです。解説がとても分かりやすく、初心者でも理解しやすい内容になっています。ただ、説明がもう少し詳しいと助かります。それでも十分楽しめていますし、今後の成長に期待しています。'
  ];
BEGIN
  -- ユーザーIDを取得
  SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE email LIKE '%@demo.example.com';

  -- 各チャンネルにレビューを追加
  FOR channel_record IN
    SELECT id, title FROM channels WHERE category IS NOT NULL
  LOOP
    -- 3-5件のレビューを生成
    reviews_count := 3 + floor(random() * 3)::INTEGER;

    FOR i IN 1..reviews_count LOOP
      -- ランダムなユーザーIDを選択
      random_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::INTEGER];

      -- 4-5の評価（ポジティブ多め）
      rating_val := 4 + floor(random() * 2)::INTEGER;

      -- テンプレートを選択
      IF rating_val >= 4 THEN
        review_content := positive_templates[1 + floor(random() * array_length(positive_templates, 1))::INTEGER];
      ELSE
        review_content := neutral_templates[1 + floor(random() * array_length(neutral_templates, 1))::INTEGER];
      END IF;

      -- タイトルを生成
      review_title := substring(review_content, 1, 30) || '...';

      -- ランダムな日時（過去7日間）
      random_days_ago := floor(random() * 7)::INTEGER;
      review_date := NOW() - (random_days_ago || ' days')::INTERVAL;

      -- レビューを挿入
      INSERT INTO reviews (user_id, channel_id, rating, title, content, is_spoiler, created_at)
      VALUES (random_user_id, channel_record.id, rating_val, review_title, review_content, false, review_date)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ レビューデータを生成しました';
END $$;

-- 完了メッセージ
SELECT '🎉 デモデータの生成が完了しました！' AS status;

-- 確認: 生成されたデータ
SELECT
  'ユーザー' AS type,
  COUNT(*)::TEXT AS count
FROM users WHERE email LIKE '%@demo.example.com'
UNION ALL
SELECT
  'チャンネル' AS type,
  COUNT(*)::TEXT AS count
FROM channels WHERE category IS NOT NULL
UNION ALL
SELECT
  'レビュー' AS type,
  COUNT(*)::TEXT AS count
FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.example.com');
