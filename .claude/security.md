# Security Rules

TubeReview プロジェクトのセキュリティルールとベストプラクティスを記載します。

## 🚨 Critical Security Rules

### 1. Error Handling Security

**ルール:**

- ❌ エラーレスポンスに `details`, `stack` を含めない
- ❌ ユーザーのメールアドレス、個人情報をログに出力しない
- ✅ 全エラーは `handleApiError()` で処理
- ✅ API エラーコードは `lib/types/api.ts` の定数を使用

**Bad Example:**

```typescript
catch (error) {
  return {
    success: false,
    error: error.message,
    details: error.stack,  // ❌ スタックトレース露出
    user: user.email,      // ❌ 個人情報露出
  };
}
```

**Good Example:**

```typescript
catch (error) {
  return handleApiError(error);  // ✅ 安全にエラー処理
}
```

### 2. Logging Security

**ルール:**

- ❌ No `console.log` in production
- ✅ Only `console.error` and `console.warn`
- ✅ デバッグログには `[Debug]` プレフィックス

**実装:**

```typescript
// next.config.ts
const config = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
};
```

**Good Example:**

```typescript
// 開発時のデバッグ
console.log("[Debug] API response:", data); // 本番では自動削除

// エラーログ（本番でも残る）
console.error("Failed to fetch channel:", error);

// 警告ログ（本番でも残る）
console.warn("Rate limit approaching:", remainingQuota);
```

### 3. Authentication Security

**認証方式:**

- **Magic Link**: メールアドレスのみで認証
- **Google OAuth**: Supabase の設定済みプロバイダー
- **セッション**: Supabase が自動管理

**Auth Check Functions:**

```typescript
import { getUser, requireAuth } from "@/lib/auth";

// オプショナルな認証チェック
export async function getProfile() {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  // ... 処理
}

// 必須の認証チェック
export async function updateProfile(data: ProfileInput) {
  const user = await requireAuth(); // 未認証なら例外をスロー
  // ... 処理
}
```

**実装例:**

```typescript
// lib/auth.ts
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new ApiError(API_ERROR_CODES.UNAUTHORIZED, "ログインが必要です", 401);
  }
  return user;
}
```

### 4. Row Level Security (RLS)

**全テーブルでRLSを有効化:**

**User Data Policy (SQL):**

```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can access own data"
ON reviews
FOR ALL
USING (auth.uid() = user_id);

-- 作成時は自動的にユーザーIDを設定
CREATE POLICY "Users can create own reviews"
ON reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Public Data Policy (SQL):**

```sql
-- 公開データは誰でも閲覧可能
CREATE POLICY "Public reviews are viewable"
ON reviews
FOR SELECT
USING (deleted_at IS NULL);

-- チャンネル情報は全員閲覧可能
CREATE POLICY "Channels are public"
ON channels
FOR SELECT
USING (true);
```

**実装パターン:**

```typescript
// RLS により自動的にフィルタリング
const { data } = await supabase.from("reviews").select("*"); // 自分のデータのみ取得される
```

### 5. Input Validation

**全入力は Zod でバリデーション:**

```typescript
import { z } from "zod";

const reviewSchema = z.object({
  channelId: z.string().min(1, "チャンネルIDは必須です"),
  rating: z.number().min(1).max(5, "評価は1-5の範囲で指定してください"),
  comment: z.string().max(500, "コメントは500文字以内です").optional(),
});

export async function createReview(data: unknown) {
  // バリデーション（失敗時は ZodError をスロー）
  const validated = reviewSchema.parse(data);
  // ... 処理
}
```

**Common Validation Patterns:**

```typescript
// メールアドレス
const emailSchema = z.string().email("有効なメールアドレスを入力してください");

// URL
const urlSchema = z.string().url("有効なURLを入力してください");

// 日付
const dateSchema = z.string().datetime("有効な日時を入力してください");

// 列挙型
const categorySchema = z.enum(["tech", "gaming", "vlog"], {
  errorMap: () => ({ message: "有効なカテゴリを選択してください" }),
});
```

### 6. API Security

**Rate Limiting:**

```typescript
// YouTube API レート制限
const YOUTUBE_QUOTA_LIMIT = 10000; // 1日あたり
const REQUESTS_PER_MINUTE = 100;

// Upstash Redis でレート制限
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

const { success } = await ratelimit.limit(userId);
if (!success) {
  throw new ApiError(
    API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    "レート制限を超えました",
    429
  );
}
```

**CORS Configuration:**

```typescript
// next.config.ts
const config = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_SITE_URL,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE",
          },
        ],
      },
    ];
  },
};
```

**API Key Security:**

```typescript
// 環境変数から取得（クライアント側に露出しない）
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ❌ クライアント側で使用しない
// const key = process.env.NEXT_PUBLIC_API_KEY;  // 危険！
```

### 7. Environment Variables

**Public vs Private:**

```bash
# Public (クライアント側でアクセス可能)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Private (サーバー側のみ)
SUPABASE_SERVICE_ROLE_KEY=xxx
YOUTUBE_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
```

**Validation:**

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

### 8. XSS Protection

**Dangerous Patterns:**

```typescript
// ❌ dangerouslySetInnerHTML は使用しない
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ eval() は使用しない
eval(userInput);
```

**Safe Patterns:**

```typescript
// ✅ React が自動的にエスケープ
<div>{userInput}</div>

// ✅ サニタイズライブラリを使用（必要な場合のみ）
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### 9. SQL Injection Protection

**Supabase は自動的にパラメータ化:**

```typescript
// ✅ 安全（パラメータ化されたクエリ）
const { data } = await supabase
  .from("channels")
  .select("*")
  .eq("id", channelId);

// ❌ 生のSQLは使用しない（Supabaseでは通常不要）
// const { data } = await supabase.rpc('raw_sql', { query: `SELECT * FROM channels WHERE id = '${channelId}'` });
```

### 10. Secrets Management

**GitHub Secrets:**

- Supabase credentials
- YouTube API Key
- Anthropic API Key

**Vercel Environment Variables:**

- Production, Preview, Development 環境ごとに設定
- 本番環境のシークレットは絶対に共有しない

**Local Development:**

```bash
# .env.local (Git に含めない)
NEXT_PUBLIC_SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
YOUTUBE_API_KEY=xxx

# .env.example (Git に含める)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
YOUTUBE_API_KEY=your_youtube_api_key
```

## Security Checklist

### Before Every Commit

- [ ] `console.log` を削除（デバッグログを除く）
- [ ] 個人情報をログに出力していないか確認
- [ ] ハードコードされたシークレットがないか確認
- [ ] エラーメッセージに機密情報が含まれていないか確認

### Before Every Deploy

- [ ] 環境変数が正しく設定されているか確認
- [ ] RLS ポリシーが有効か確認
- [ ] 全テストがパス
- [ ] Lighthouse セキュリティスコア確認

### Monthly Security Review

- [ ] 依存パッケージの脆弱性チェック（`npm audit`）
- [ ] Supabase ログのレビュー
- [ ] 異常なアクセスパターンの確認
- [ ] API レート制限の見直し

## Common Security Vulnerabilities to Avoid

### 1. Authentication Bypass

```typescript
// ❌ クライアント側の認証チェックのみ
if (localStorage.getItem("isLoggedIn")) {
  // 危険！改ざん可能
}

// ✅ サーバー側で必ず認証チェック
export async function updateProfile(data: ProfileInput) {
  const user = await requireAuth(); // サーバー側チェック
  // ... 処理
}
```

### 2. Information Disclosure

```typescript
// ❌ 詳細なエラー情報を返す
return {
  error: "Database connection failed",
  details: error.stack, // スタックトレース露出
  query: sqlQuery, // SQLクエリ露出
};

// ✅ 一般的なエラーメッセージ
return {
  error: "サーバーエラーが発生しました",
};
```

### 3. Mass Assignment

```typescript
// ❌ ユーザー入力をそのまま使用
const { data } = await supabase.from("users").update(req.body); // role, permissions も更新される可能性

// ✅ 許可されたフィールドのみ更新
const { name, bio } = validatedData;
const { data } = await supabase.from("users").update({ name, bio });
```

### 4. IDOR (Insecure Direct Object Reference)

```typescript
// ❌ IDのみで削除（他人のデータも削除可能）
const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

// ✅ ユーザーIDも確認
const user = await requireAuth();
const { error } = await supabase
  .from("reviews")
  .delete()
  .eq("id", reviewId)
  .eq("user_id", user.id); // 自分のデータのみ削除
```

---

**Last Updated:** 2026-02-17
**Next Review:** 2026-05-17
**Update Triggers:**

- セキュリティ脆弱性発見
- 認証方式変更
- 定期セキュリティ監査
