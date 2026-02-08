require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// シードデータのユーザーID
const userIds = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
];

// カテゴリー別のレビューテンプレート
const reviewTemplates = {
  education: [
    { rating: 5, title: '分かりやすい解説', content: '難しい内容も分かりやすく説明してくれて、とても勉強になります。' },
    { rating: 4, title: '教育系チャンネルの中では良質', content: '学びながら楽しめる内容で、継続して見たくなるチャンネルです。' },
    { rating: 5, title: '知識が身につく', content: '教養が深まる良いチャンネル。もっと早く知りたかった。' },
  ],
  cooking: [
    { rating: 5, title: 'レシピが参考になる', content: '実際に作ってみたら美味しくできました！分かりやすいレシピありがとうございます。' },
    { rating: 4, title: '料理の勉強になる', content: 'プロの技が学べて参考になります。料理が楽しくなりました。' },
    { rating: 5, title: '見ているだけでお腹が空く', content: '美味しそうな料理ばかりで、見ているだけで幸せになります。' },
  ],
  vlog: [
    { rating: 5, title: '日常が楽しい', content: '日常のVlogが癒されます。毎日の投稿を楽しみにしています。' },
    { rating: 4, title: 'ライフスタイルが参考になる', content: '丁寧な暮らしぶりが素敵です。真似したくなる要素がたくさん。' },
    { rating: 5, title: '見ていて癒される', content: '忙しい日常の中で癒しをもらえるチャンネルです。' },
  ],
  lifestyle: [
    { rating: 5, title: 'ライフスタイルが素敵', content: '暮らしの参考になります。見ているだけで癒されます。' },
    { rating: 4, title: '丁寧な暮らし', content: '生活の質を上げるヒントがたくさん。参考にしています。' },
    { rating: 5, title: '真似したくなる', content: '素敵な暮らしぶりに憧れます。少しずつ取り入れていきたい。' },
  ],
  gaming: [
    { rating: 5, title: 'ゲーム実況が面白い', content: 'トークも上手で見ていて飽きません。ゲームの選定も良いです。' },
    { rating: 4, title: '編集が丁寧', content: 'テンポの良い編集で最後まで楽しめます。' },
    { rating: 5, title: '笑える実況', content: 'リアクションが面白くて、ゲームをプレイしたくなります。' },
  ],
  music: [
    { rating: 5, title: '歌が上手い', content: '歌唱力が素晴らしい。何度も聞きたくなります。' },
    { rating: 4, title: '音楽の質が高い', content: 'クオリティの高い音楽を楽しめます。' },
    { rating: 5, title: '心に響く', content: '感動しました。こんな素敵な音楽をありがとうございます。' },
  ],
  tech: [
    { rating: 5, title: 'ガジェットレビューが詳しい', content: '購入の参考になります。レビューが的確で信頼できます。' },
    { rating: 4, title: '技術的な解説が分かりやすい', content: 'IT初心者でも理解できる説明で助かります。' },
    { rating: 5, title: '最新情報が早い', content: '常に最新の情報を提供してくれて、とても参考になります。' },
  ],
  sports: [
    { rating: 5, title: 'スポーツの魅力が伝わる', content: '試合のハイライトや解説が素晴らしい。スポーツ好きにはたまりません。' },
    { rating: 4, title: '分析が深い', content: '戦術の解説が分かりやすくて勉強になります。' },
    { rating: 5, title: '熱い試合が見られる', content: 'いつも熱戦を見せてくれてありがとう！' },
  ],
  news: [
    { rating: 5, title: 'ニュースが分かりやすい', content: '複雑なニュースも分かりやすく解説してくれます。' },
    { rating: 4, title: '情報が早い', content: '最新のニュースをいち早く届けてくれて助かります。' },
    { rating: 5, title: '信頼できる情報源', content: '正確な情報を提供してくれる信頼できるチャンネルです。' },
  ],
  travel: [
    { rating: 5, title: '旅行気分を味わえる', content: '行ったことのない場所を見られて楽しいです。' },
    { rating: 4, title: '旅行の参考になる', content: '次の旅行の参考にしています。素敵な場所を紹介してくれてありがとう。' },
    { rating: 5, title: '映像が美しい', content: '綺麗な映像で旅行している気分になれます。' },
  ],
  entertainment: [
    { rating: 5, title: '面白い企画', content: '毎回笑わせてもらっています。企画力が素晴らしい。' },
    { rating: 4, title: 'エンタメとして最高', content: '見ていて楽しいチャンネル。元気をもらえます。' },
    { rating: 5, title: '飽きないコンテンツ', content: 'いつも新鮮な企画で楽しませてくれます。' },
  ],
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

(async () => {
  console.log('すべてのチャンネルにレビューを追加します...\n');

  // レビューがないチャンネルを取得
  const { data: allChannels, error: channelsError } = await supabase
    .from('channels')
    .select('id, title, category');

  if (channelsError) {
    console.error('チャンネル取得エラー:', channelsError);
    process.exit(1);
  }

  console.log(`合計 ${allChannels.length} チャンネルを確認します...\n`);

  let addedCount = 0;
  let skipCount = 0;

  for (const channel of allChannels) {
    // 既存のレビュー数を確認
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channel.id);

    if (reviewCount > 0) {
      console.log(`⏭️  ${channel.title} - 既に${reviewCount}件のレビューあり`);
      skipCount++;
      continue;
    }

    // カテゴリーに応じたレビューテンプレートを取得
    const templates = reviewTemplates[channel.category] || reviewTemplates.entertainment;

    // 2-3個のレビューを追加
    const numReviews = Math.floor(Math.random() * 2) + 2; // 2 or 3
    console.log(`処理中: ${channel.title} (${channel.category})`);

    for (let i = 0; i < numReviews; i++) {
      const template = getRandomElement(templates);
      const userId = getRandomElement(userIds);
      const createdAt = getRandomDate(30); // 過去30日以内

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          channel_id: channel.id,
          rating: template.rating,
          title: template.title,
          content: template.content,
          helpful_count: Math.floor(Math.random() * 50),
          created_at: createdAt,
        });

      if (insertError) {
        console.error(`  ❌ レビュー追加エラー:`, insertError.message);
      }
    }

    console.log(`  ✅ ${numReviews}件のレビューを追加`);
    addedCount++;

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('処理完了:');
  console.log(`  レビュー追加: ${addedCount}チャンネル`);
  console.log(`  スキップ: ${skipCount}チャンネル`);

  // 統計情報を表示
  const { data: stats } = await supabase
    .from('channels')
    .select(`
      id,
      title,
      reviews:reviews(count)
    `);

  if (stats) {
    console.log('\nレビュー数統計:');
    const withReviews = stats.filter(ch => ch.reviews && ch.reviews.length > 0).length;
    const withoutReviews = stats.filter(ch => !ch.reviews || ch.reviews.length === 0).length;
    console.log(`  レビューあり: ${withReviews}チャンネル`);
    console.log(`  レビューなし: ${withoutReviews}チャンネル`);
  }
})();
