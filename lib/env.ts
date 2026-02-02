import { z } from 'zod';

// 環境変数スキーマ
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // YouTube API
  YOUTUBE_API_KEY: z.string().min(1),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

  // オプション
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Node環境
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// バリデーション実行（エラーハンドリング付き）
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
  });
} catch (error) {
  console.error('❌ Invalid environment variables:');
  console.error(error);

  // 開発環境でのみ詳細表示
  if (process.env.NODE_ENV === 'development') {
    console.error('\n📋 Required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('- YOUTUBE_API_KEY');
    console.error('- NEXTAUTH_SECRET');
    console.error('- NEXTAUTH_URL');
    console.error(
      '\n💡 Copy .env.example to .env.local and fill in the values'
    );
  }

  throw new Error('Environment validation failed');
}

// 型安全な環境変数として export
export { env };
export type Env = z.infer<typeof envSchema>;
