require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Materialized Viewを更新します...\n');

  // channel_statsビューを更新
  const { error } = await supabase.rpc('refresh_channel_stats');

  if (error) {
    console.error('❌ エラー:', error);
    console.log('\n別の方法で更新を試みます...');

    // 直接SQLを実行
    const { error: sqlError } = await supabase
      .from('channel_stats')
      .select('*')
      .limit(1);

    if (sqlError) {
      console.error('SQL実行エラー:', sqlError);
    }
  } else {
    console.log('✅ channel_stats Materialized Viewを更新しました');
  }

  // 確認
  console.log('\n統計情報を確認中...');

  const { data: stats } = await supabase
    .from('channels')
    .select(`
      id,
      title,
      category
    `)
    .ilike('title', '%papa%cooking%')
    .single();

  if (stats) {
    console.log(`\nチャンネル: ${stats.title}`);

    // レビュー数を確認
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', stats.id);

    console.log(`レビュー数: ${count}件`);

    // 平均評価を計算
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('channel_id', stats.id);

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      console.log(`平均評価: ${avg.toFixed(1)}★`);
    }
  }
})();
