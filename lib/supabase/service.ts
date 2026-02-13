import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Service Role用のSupabaseクライアントを作成
 * RLSをバイパスして内部テーブルにアクセスする
 * 
 * 注意: このクライアントはサーバーサイドの内部処理でのみ使用すること
 * クライアントに公開してはいけない
 */
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
