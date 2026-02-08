require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('カテゴリーがnullのチャンネルを修正します...\n');

  // えつこ 育児生活 チャンネルをlifestyleカテゴリーに設定
  const { error } = await supabase
    .from('channels')
    .update({ category: 'lifestyle' })
    .eq('id', '4a27c7e1-0fb2-4c15-8ff9-fcf360d40e7a');

  if (error) {
    console.error('❌ 更新エラー:', error);
    process.exit(1);
  } else {
    console.log('✅ 「えつこ 育児生活」チャンネルをlifestyleカテゴリーに設定しました');

    // 確認
    const { data: channels } = await supabase
      .from('channels')
      .select('category')
      .is('category', null);

    if (channels && channels.length === 0) {
      console.log('✅ すべてのチャンネルにカテゴリーが設定されました！');
    }
  }
})();
