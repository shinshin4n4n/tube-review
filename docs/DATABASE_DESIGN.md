# ちゅぶれびゅ！ データベース設計

## 設計方針

### スケーラビリティ
- 適切なインデックス配置でクエリパフォーマンスを最適化
- 集計データは非正規化して高速化（views/materialized views活用）
- パーティショニングを見据えたテーブル設計

### 拡張性
- 将来の機能追加に備えたメタデータカラム（JSONB）
- ソフトデリート対応（deleted_at）
- 柔軟なタグ・カテゴリシステム

### Supabase活用
- Row Level Security (RLS) でセキュリティ担保
- リアルタイム機能対応
- PostgreSQL拡張機能（uuid-ossp, pg_trgmなど）

---

## ER図

```
┌─────────────────┐
│     users       │ ←───────┐
├─────────────────┤         │
│ id (PK)         │         │
│ email           │         │
│ username        │         │
│ display_name    │         │
│ avatar_url      │         │
│ bio             │         │
│ created_at      │         │
│ updated_at      │         │
│ deleted_at      │         │
└─────────────────┘         │
        │                   │
        │                   │
┌───────┴──────────┐   ┌────┴────────────────┐
│  user_settings   │   │   user_follows      │
├──────────────────┤   ├─────────────────────┤
│ user_id (PK,FK)  │   │ follower_id (PK,FK) │
│ is_public        │   │ followee_id (PK,FK) │
│ email_notif      │   │ created_at          │
│ preferences      │   └─────────────────────┘
│ (JSONB)          │
│ updated_at       │
└──────────────────┘


┌──────────────────────┐
│      channels        │ ←──────────────┐
├──────────────────────┤                │
│ id (PK)              │                │
│ youtube_channel_id   │ (UNIQUE)       │
│ title                │                │
│ description          │                │
│ thumbnail_url        │                │
│ banner_url           │                │
│ subscriber_count     │                │
│ video_count          │                │
│ published_at         │                │
│ latest_video_at      │                │
│ category             │                │
│ tags (JSONB)         │                │
│ metadata (JSONB)     │ ← 拡張用       │
│ cache_updated_at     │                │
│ created_at           │                │
│ updated_at           │                │
└──────────────────────┘                │
        │                               │
        │                               │
┌───────┴─────────────┐                 │
│   top_videos        │                 │
├─────────────────────┤                 │
│ id (PK)             │                 │
│ channel_id (FK)     │                 │
│ youtube_video_id    │                 │
│ title               │                 │
│ thumbnail_url       │                 │
│ view_count          │                 │
│ rank                │ ← 1-3位保持    │
│ created_at          │                 │
│ updated_at          │                 │
└─────────────────────┘                 │
                                        │
                                        │
┌─────────────────────┐                 │
│      reviews        │                 │
├─────────────────────┤                 │
│ id (PK)             │                 │
│ user_id (FK) ───────┼─────────────────┘
│ channel_id (FK) ────┤
│ rating (1-5)        │
│ title               │
│ content             │
│ is_spoiler          │ ← 将来用
│ helpful_count       │ ← 集計用非正規化
│ metadata (JSONB)    │ ← 構造化レビュー用
│ created_at          │
│ updated_at          │
│ deleted_at          │
└─────────────────────┘
        │
        │
┌───────┴──────────────┐
│   review_helpful     │ ← 「参考になった」
├──────────────────────┤
│ review_id (PK,FK)    │
│ user_id (PK,FK)      │
│ created_at           │
└──────────────────────┘


┌──────────────────────┐
│    user_channels     │ ← 「見たい」「見ている」「見た」
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)         │
│ channel_id (FK)      │
│ status               │ ← enum: want, watching, watched
│ started_at           │ ← watching開始日
│ finished_at          │ ← watched完了日
│ private_memo         │ ← 個人メモ
│ created_at           │
│ updated_at           │
│                      │
│ UNIQUE(user_id, channel_id)
└──────────────────────┘


┌──────────────────────┐
│        lists         │ ← テーマ別リスト
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)         │
│ title                │
│ description          │
│ is_public            │
│ slug                 │ ← URL用
│ view_count           │ ← 閲覧数
│ like_count           │ ← いいね数
│ created_at           │
│ updated_at           │
│ deleted_at           │
└──────────────────────┘
        │
        │
┌───────┴──────────────┐
│    list_channels     │
├──────────────────────┤
│ id (PK)              │
│ list_id (FK)         │
│ channel_id (FK)      │
│ order_index          │ ← 並び順
│ comment              │ ← チャンネルごとのコメント
│ created_at           │
└──────────────────────┘


┌──────────────────────┐
│      list_likes      │
├──────────────────────┤
│ list_id (PK,FK)      │
│ user_id (PK,FK)      │
│ created_at           │
└──────────────────────┘


┌──────────────────────┐
│    channel_stats     │ ← Materialized View候補
├──────────────────────┤
│ channel_id (PK,FK)   │
│ review_count         │
│ average_rating       │
│ want_count           │
│ watching_count       │
│ watched_count        │
│ updated_at           │
└──────────────────────┘
```

---

## テーブル定義

### 1. users（ユーザー）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

**拡張性:**
- Supabase Authと連携（id = auth.users.id）
- ソフトデリート対応（deleted_at）

---

### 2. user_settings（ユーザー設定）

```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB例: {"theme": "light", "language": "ja", "auto_list_update": true}
CREATE INDEX idx_user_settings_preferences ON user_settings USING gin(preferences);
```

**拡張性:**
- preferences (JSONB) で任意の設定を追加可能
- 将来的なプレミアム機能フラグもここに追加

---

### 3. user_follows（フォロー関係）

```sql
CREATE TABLE user_follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_followee ON user_follows(followee_id);
```

**スケーラビリティ:**
- 複合主キーでユニーク保証 + 高速検索
- 自己参照チェック制約

---

### 4. channels（チャンネル）

```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_channel_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  subscriber_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  latest_video_at TIMESTAMPTZ,
  category TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  cache_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_channels_youtube_id ON channels(youtube_channel_id);
CREATE INDEX idx_channels_category ON channels(category);
CREATE INDEX idx_channels_tags ON channels USING gin(tags);
CREATE INDEX idx_channels_latest_video ON channels(latest_video_at DESC);
CREATE INDEX idx_channels_subscriber ON channels(subscriber_count DESC);

-- 全文検索用（日本語対応）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_channels_title_trgm ON channels USING gin(title gin_trgm_ops);
```

**拡張性:**
- tags (JSONB配列) でカテゴリタグを柔軟に管理
- metadata (JSONB) で将来の拡張データ保存
- YouTube Data APIキャッシュ戦略に対応

---

### 5. top_videos（代表作動画）

```sql
CREATE TABLE top_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  view_count BIGINT DEFAULT 0,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, rank)
);

CREATE INDEX idx_top_videos_channel ON top_videos(channel_id, rank);
```

**スケーラビリティ:**
- チャンネルごとに上位3動画のみ保持（API節約）
- UNIQUE制約でランク重複防止

---

### 6. reviews（レビュー）

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_reviews_channel ON reviews(channel_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_user ON reviews(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful ON reviews(helpful_count DESC);
```

**拡張性:**
- metadata (JSONB) で構造化レビュー（「こんな人におすすめ」タグなど）
- helpful_count は非正規化（頻繁に表示されるため）
- ユーザーは1チャンネルにつき1レビューのみ

---

### 7. review_helpful（参考になったボタン）

```sql
CREATE TABLE review_helpful (
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

CREATE INDEX idx_review_helpful_user ON review_helpful(user_id);
```

---

### 8. user_channels（マイリスト管理）

```sql
CREATE TYPE channel_status AS ENUM ('want', 'watching', 'watched');

CREATE TABLE user_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  status channel_status NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  private_memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_user_channels_user ON user_channels(user_id, status);
CREATE INDEX idx_user_channels_channel ON user_channels(channel_id);
CREATE INDEX idx_user_channels_status ON user_channels(status);
```

**スケーラビリティ:**
- ENUM型でステータス管理（型安全）
- 複合インデックスでユーザーのリスト取得を高速化

---

### 9. lists（テーマ別リスト）

```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  slug TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lists_user ON lists(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_slug ON lists(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_public ON lists(is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_popular ON lists(like_count DESC) WHERE deleted_at IS NULL;
```

**拡張性:**
- slug でSEOフレンドリーなURL
- view_count, like_count は非正規化（頻繁に表示）

---

### 10. list_channels（リスト内チャンネル）

```sql
CREATE TABLE list_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, channel_id)
);

CREATE INDEX idx_list_channels_list ON list_channels(list_id, order_index);
CREATE INDEX idx_list_channels_channel ON list_channels(channel_id);
```

**スケーラビリティ:**
- order_index で並び順を明示的に管理
- カスタムコメント機能

---

### 11. list_likes（リストいいね）

```sql
CREATE TABLE list_likes (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX idx_list_likes_user ON list_likes(user_id);
```

---

### 12. channel_stats（チャンネル統計 - Materialized View）

```sql
-- マテリアライズドビュー: パフォーマンス最適化のため
CREATE MATERIALIZED VIEW channel_stats AS
SELECT
  c.id AS channel_id,
  COUNT(DISTINCT r.id) AS review_count,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(DISTINCT CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN r.id END) AS recent_review_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'want' THEN uc.user_id END) AS want_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'watching' THEN uc.user_id END) AS watching_count,
  COUNT(DISTINCT CASE WHEN uc.status = 'watched' THEN uc.user_id END) AS watched_count,
  NOW() AS updated_at
FROM channels c
LEFT JOIN reviews r ON c.id = r.channel_id AND r.deleted_at IS NULL
LEFT JOIN user_channels uc ON c.id = uc.channel_id
GROUP BY c.id;

-- インデックス（CONCURRENTLYリフレッシュに必須）
CREATE UNIQUE INDEX idx_channel_stats_channel_id ON channel_stats(channel_id);
CREATE INDEX idx_channel_stats_review_count ON channel_stats(review_count DESC);
CREATE INDEX idx_channel_stats_average_rating ON channel_stats(average_rating DESC);

-- channels_with_stats ビュー: アプリケーション層で使用
CREATE VIEW channels_with_stats AS
SELECT
  c.*,
  COALESCE(cs.review_count, 0) AS review_count,
  COALESCE(cs.average_rating, 0) AS average_rating,
  COALESCE(cs.recent_review_count, 0) AS recent_review_count,
  COALESCE(cs.want_count, 0) AS want_count,
  COALESCE(cs.watching_count, 0) AS watching_count,
  COALESCE(cs.watched_count, 0) AS watched_count
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id;

-- 定期更新関数（GitHub Actionsで実行）
CREATE OR REPLACE FUNCTION refresh_channel_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY channel_stats;
END;
$$;

-- 権限設定
GRANT SELECT ON channel_stats TO anon;
GRANT SELECT ON channel_stats TO authenticated;
GRANT SELECT ON channels_with_stats TO anon;
GRANT SELECT ON channels_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_channel_stats() TO service_role;
```

**スケーラビリティ:**
- Materialized View で集計クエリを高速化
- CONCURRENTLY オプションでロックなし更新
- 定期的なバッチ更新でリアルタイム性と性能を両立

---

### 13. quota_usage（YouTube API クォータ管理）

```sql
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

-- RLS無効化（内部運用テーブルのため）
ALTER TABLE quota_usage DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE quota_usage IS 'Internal table for YouTube API quota tracking. RLS disabled for service operations.';

-- updated_at自動更新トリガー
CREATE TRIGGER update_quota_usage_updated_at
BEFORE UPDATE ON quota_usage
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**用途:**
- YouTube Data API v3 のクォータ使用量追跡
- 1日10,000ユニットの制限管理
- operations (JSONB) で操作種別ごとの使用量を記録

---

### 14. youtube_cache（YouTube API キャッシュ）

```sql
-- YouTube API レスポンスキャッシュ
CREATE TABLE youtube_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_youtube_cache_expires ON youtube_cache(expires_at);

-- RLS有効化（読み取りは全員許可）
ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY youtube_cache_select_all ON youtube_cache FOR SELECT USING (true);
CREATE POLICY youtube_cache_insert_service ON youtube_cache FOR INSERT WITH CHECK (false);
CREATE POLICY youtube_cache_update_service ON youtube_cache FOR UPDATE USING (false);
CREATE POLICY youtube_cache_delete_service ON youtube_cache FOR DELETE USING (false);

-- 期限切れキャッシュ削除関数
CREATE OR REPLACE FUNCTION delete_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM youtube_cache WHERE expires_at < NOW();
END;
$$;
```

**用途:**
- YouTube Data API のレスポンスキャッシュ
- API クォータ節約
- Upstash Redis と併用した2層キャッシュ戦略

---

## 拡張機能（将来追加候補）

### 通知システム

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

### コメント・返信機能

```sql
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### タグシステム

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- channel, list, etc
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE channel_tags (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, tag_id)
);
```

---

## Row Level Security (RLS)

### users

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールは読み書き可能
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- 他人のプロフィールは読み取りのみ（削除されていない場合）
CREATE POLICY users_select_others ON users FOR SELECT USING (deleted_at IS NULL);
```

### reviews

```sql
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 自分のレビューは読み書き可能
CREATE POLICY reviews_crud_own ON reviews FOR ALL USING (auth.uid() = user_id);

-- 他人のレビューは読み取りのみ（削除されていない場合）
CREATE POLICY reviews_select_others ON reviews FOR SELECT USING (deleted_at IS NULL);
```

### user_channels

```sql
ALTER TABLE user_channels ENABLE ROW LEVEL SECURITY;

-- 自分のマイリストは読み書き可能
CREATE POLICY user_channels_crud_own ON user_channels FOR ALL USING (auth.uid() = user_id);

-- 公開設定によっては他人も閲覧可能（user_settingsと結合）
CREATE POLICY user_channels_select_public ON user_channels FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_id = user_channels.user_id 
    AND is_public = true
  )
);
```

---

## パフォーマンス最適化

### N+1問題対策

```sql
-- チャンネル一覧 + 統計情報を1クエリで取得
CREATE VIEW channels_with_stats AS
SELECT 
  c.*,
  cs.review_count,
  cs.average_rating,
  cs.want_count,
  cs.watching_count,
  cs.watched_count
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id;
```

### ページネーション

```sql
-- カーソルベースページネーション用インデックス
CREATE INDEX idx_channels_cursor ON channels(created_at DESC, id);
CREATE INDEX idx_reviews_cursor ON reviews(created_at DESC, id) WHERE deleted_at IS NULL;
```

---

## マイグレーション戦略

1. **初期マイグレーション**: 基本テーブル作成
2. **段階的追加**: 拡張機能は後から追加
3. **バージョン管理**: Supabase Migration機能活用
4. **ロールバック対応**: 各マイグレーションにダウンスクリプト用意

---

## 次のステップ

1. Supabase CLI でマイグレーションファイル作成
2. RLSポリシー詳細設計
3. シードデータ作成
4. パフォーマンステスト計画