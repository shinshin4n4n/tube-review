---
description: "Supabase (PostgreSQL, Auth, Storage) と Upstash Redis のルール"
globs: "lib/supabase/**,supabase/**"
---

# Supabase ルール

## クライアント生成

```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

- クライアント側から直接 Supabase クエリを実行しない（Server Actions を使用）

## RLS (Row Level Security)

- 全テーブルで RLS 有効化必須
- ユーザーデータ: `auth.uid() = user_id` ポリシー
- 公開データ: `deleted_at IS NULL` ポリシー

## Soft Delete

- `deleted_at IS NULL` パターンを使用
- 物理削除は行わない

## Materialized Views

- `channel_stats_mv` 等は GitHub Actions (6h cron) でリフレッシュ
- MV に影響する変更時はリフレッシュの考慮が必要

## Auth

- Supabase Auth を使用（NextAuth や better-auth は不使用）
- Magic Link + Google OAuth
- 認証チェック: `lib/auth.ts` の `getUser()`, `requireAuth()` を使用

## Upstash Redis キャッシュ

- YouTube Data API は高コスト → 必ず Redis キャッシュ経由
- TTL: 24時間
- 2層キャッシュ: メモリ（短期） + Redis（長期）
