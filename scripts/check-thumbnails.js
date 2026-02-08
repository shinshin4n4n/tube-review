require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('チャンネルのサムネイル情報を確認します...\n');

  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, title, thumbnail_url')
    .order('title');

  if (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }

  console.log(`チャンネル数: ${channels.length}\n`);

  channels.forEach((c, index) => {
    console.log(`${index + 1}. ${c.title}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Thumbnail: ${c.thumbnail_url || '(なし)'}`);
    console.log('');
  });

  // サムネイルURLがnullのチャンネルを確認
  const noThumbnail = channels.filter(c => !c.thumbnail_url);
  if (noThumbnail.length > 0) {
    console.log(`⚠️  サムネイルURLがないチャンネル: ${noThumbnail.length}件`);
    noThumbnail.forEach(c => console.log(`   - ${c.title}`));
  } else {
    console.log('✅ すべてのチャンネルにサムネイルURLが設定されています');
  }
})();
