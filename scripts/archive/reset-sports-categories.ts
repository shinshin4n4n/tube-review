/**
 * 剣道・ビリヤード関連チャンネルのカテゴリーをリセット
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 剣道関連のチャンネルを取得
  const { data: kendoChannels } = await supabase
    .from('channels')
    .select('id, title')
    .or('title.ilike.%剣道%,description.ilike.%剣道%');

  // ビリヤード関連のチャンネルを取得
  const { data: billiardChannels } = await supabase
    .from('channels')
    .select('id, title')
    .or('title.ilike.%ビリヤード%,description.ilike.%ビリヤード%');

  const allChannels = [...(kendoChannels || []), ...(billiardChannels || [])];

  console.log(`🔄 ${allChannels.length}件のスポーツ関連チャンネルを再分類します\n`);

  for (const channel of allChannels) {
    console.log(`リセット中: ${channel.title}`);
    await supabase
      .from('channels')
      .update({ category: null })
      .eq('id', channel.id);
  }

  console.log(`\n✅ ${allChannels.length}件のカテゴリーをリセットしました`);
}

main().catch(console.error);
