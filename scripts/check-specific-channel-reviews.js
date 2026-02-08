require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const channelTitle = "プロが教える家庭料理　papa's cooking";

  console.log(`「${channelTitle}」のレビューを確認します...\n`);

  // チャンネルを検索
  const { data: channels, error: channelError } = await supabase
    .from('channels')
    .select('id, title, youtube_channel_id')
    .ilike('title', `%papa%cooking%`);

  if (channelError) {
    console.error('エラー:', channelError);
    process.exit(1);
  }

  if (!channels || channels.length === 0) {
    console.log('❌ チャンネルが見つかりません');
    process.exit(1);
  }

  console.log(`見つかったチャンネル: ${channels.length}件\n`);

  for (const channel of channels) {
    console.log(`チャンネル: ${channel.title}`);
    console.log(`ID: ${channel.id}`);
    console.log(`YouTube ID: ${channel.youtube_channel_id}\n`);

    // レビューを取得
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        content,
        created_at,
        user:users(username, display_name)
      `)
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: false });

    if (reviewError) {
      console.error('レビュー取得エラー:', reviewError);
    } else if (!reviews || reviews.length === 0) {
      console.log('⚠️  レビューがありません\n');

      // レビューを追加
      console.log('レビューを追加します...');
      const userId = '11111111-1111-1111-1111-111111111111';

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          channel_id: channel.id,
          rating: 5,
          title: 'レシピが参考になる',
          content: '家庭でも作りやすいレシピで、とても参考になります。プロの技術を学べて嬉しいです。',
          helpful_count: 10,
        });

      if (insertError) {
        console.error('❌ レビュー追加エラー:', insertError);
      } else {
        console.log('✅ レビューを追加しました');
      }
    } else {
      console.log(`✅ レビュー: ${reviews.length}件\n`);
      reviews.forEach((review, index) => {
        console.log(`${index + 1}. ★${review.rating} - ${review.title}`);
        console.log(`   投稿者: ${review.user.display_name || review.user.username}`);
        console.log(`   内容: ${review.content.substring(0, 50)}...`);
        console.log('');
      });
    }
  }
})();
