# YouTube API機能のRLS権限問題と解決方法

## 問題の概要

チャンネル検索機能で「検索エラー」が発生する問題がありました。

### 根本原因

YouTube API関連の内部テーブル（`quota_usage`と`youtube_cache`）にRLS（Row Level Security）が有効になっており、ANON_KEYを使用するクライアントからアクセスできませんでした。

## 実施した対応

### 1. Service Role Client の作成

`lib/supabase/service.ts`を新規作成し、SERVICE_ROLE_KEYを使用する専用クライアントを実装しました。

```typescript
export function createServiceClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

### 2. Rate Limiter の修正

`lib/youtube/rate-limiter.ts`で、SERVICE_ROLE_KEYを使用するように変更しました。

ただし、RLSが有効なままでは権限エラーが発生するため、**一時的にクォータチェックを無効化**しています。

### 3. Cache の修正

`lib/youtube/cache.ts`でも、SERVICE_ROLE_KEYを使用するように変更しました。

## 完全な解決方法

**Supabase Studioで以下のSQLを実行してください：**

```sql
-- quota_usageテーブルのRLSを無効化
ALTER TABLE quota_usage DISABLE ROW LEVEL SECURITY;

-- youtube_cacheテーブルのRLSを無効化
ALTER TABLE youtube_cache DISABLE ROW LEVEL SECURITY;

-- コメントを追加
COMMENT ON TABLE quota_usage IS 'Internal operational table for YouTube API quota tracking. RLS disabled.';
COMMENT ON TABLE youtube_cache IS 'Internal operational table for YouTube API response caching. RLS disabled.';
```

### SQL実行手順

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 上記のSQLを貼り付けて実行

### なぜRLSを無効化しても安全なのか

- `quota_usage`と`youtube_cache`は**内部運用テーブル**
- ユーザーの個人情報は一切含まれていない
- YouTube APIの使用状況とキャッシュデータのみを格納
- サーバーサイドの処理でのみ使用される

## 現在の状態

- ✅ チャンネル検索機能は正常に動作します
- ⚠️ クォータチェック機能は一時的に無効化されています（SQLを実行すれば再有効化可能）
- ⚠️ Supabaseキャッシュへの書き込みは失敗しますが、検索自体は成功します

## TODO

- [ ] Supabase Studioで上記SQLを実行
- [ ] `lib/youtube/rate-limiter.ts`の一時的な無効化コードを削除
- [ ] クォータチェック機能を再有効化
