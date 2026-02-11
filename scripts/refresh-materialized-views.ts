/**
 * マテリアライズドビュー リフレッシュスクリプト
 *
 * channel_statsマテリアライズドビューを最新のデータで更新します。
 * GitHub Actionsで定期実行されます。
 *
 * 実行方法:
 * npm run refresh-stats (開発環境)
 * npm run refresh-stats:prod (本番環境)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// NODE_ENV=productionの場合は.env.production.localを読み込む
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production.local'
  : '.env.local';

config({ path: resolve(process.cwd(), envFile) });
console.log(`📝 環境変数ファイル: ${envFile}`);

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * マテリアライズドビューをリフレッシュ
 */
async function refreshMaterializedViews() {
  console.log('🔄 マテリアライズドビューのリフレッシュを開始します...\n');

  const startTime = Date.now();

  try {
    // refresh_channel_stats()関数を実行
    const { error } = await supabase.rpc('refresh_channel_stats');

    if (error) {
      console.error('❌ リフレッシュ失敗:', error.message);
      console.error('詳細:', error);
      process.exit(1);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ リフレッシュ完了！');
    console.log(`⏱️  実行時間: ${duration}秒`);
    console.log(`🕒 更新日時: ${new Date().toISOString()}`);
    console.log('\n📊 channel_statsマテリアライズドビューが最新のデータで更新されました。');
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  }
}

// 実行
refreshMaterializedViews().catch((error) => {
  console.error('❌ スクリプト実行エラー:', error);
  process.exit(1);
});
