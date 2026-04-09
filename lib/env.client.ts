import { z } from "zod";

// クライアント用環境変数スキーマ（NEXT_PUBLIC_ のみ）
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// バリデーション実行
let clientEnv: z.infer<typeof clientEnvSchema>;

try {
  clientEnv = clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
} catch (error) {
  console.error("❌ Invalid client environment variables:");
  console.error(error);
  throw new Error("Client environment validation failed");
}

export { clientEnv };
export type ClientEnv = z.infer<typeof clientEnvSchema>;
