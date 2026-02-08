import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数から Supabase 接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function updateCategories() {
  console.log('カテゴリーの更新を開始します...\n');

  try {
    // エンタメ系チャンネル
    console.log('エンタメ系チャンネルを更新中...');
    const { error: entertainmentError } = await supabase
      .from('channels')
      .update({ category: 'entertainment' })
      .in('id', [
        'c1111111-1111-1111-1111-111111111111',
        'c2222222-2222-2222-2222-222222222222',
        'c3333333-3333-3333-3333-333333333333',
        'c4444444-4444-4444-4444-444444444444',
        'c5555555-5555-5555-5555-555555555555',
        'c7777777-7777-7777-7777-777777777777',
        'c8888888-8888-8888-8888-888888888888',
        'ca111111-1111-1111-1111-111111111111',
      ]);

    if (entertainmentError) {
      console.error('エンタメ系チャンネルの更新エラー:', entertainmentError);
    } else {
      console.log('✓ エンタメ系チャンネルを更新しました');
    }

    // 教育系チャンネル
    console.log('教育系チャンネルを更新中...');
    const { error: educationError } = await supabase
      .from('channels')
      .update({ category: 'education' })
      .in('id', [
        'c6666666-6666-6666-6666-666666666666',
        'c9999999-9999-9999-9999-999999999999',
      ]);

    if (educationError) {
      console.error('教育系チャンネルの更新エラー:', educationError);
    } else {
      console.log('✓ 教育系チャンネルを更新しました');
    }

    // 料理系チャンネル
    console.log('料理系チャンネルを更新中...');
    const { error: cookingError } = await supabase
      .from('channels')
      .update({ category: 'cooking' })
      .in('id', [
        'ca222222-2222-2222-2222-222222222222',
        'ca333333-3333-3333-3333-333333333333',
      ]);

    if (cookingError) {
      console.error('料理系チャンネルの更新エラー:', cookingError);
    } else {
      console.log('✓ 料理系チャンネルを更新しました');
    }

    // Vlog系チャンネル
    console.log('Vlog系チャンネルを更新中...');
    const { error: vlogError } = await supabase
      .from('channels')
      .update({ category: 'vlog' })
      .in('id', [
        'cb111111-1111-1111-1111-111111111111',
        'cb222222-2222-2222-2222-222222222222',
        'cb333333-3333-3333-3333-333333333333',
        'cb444444-4444-4444-4444-444444444444',
        'cb555555-5555-5555-5555-555555555555',
      ]);

    if (vlogError) {
      console.error('Vlog系チャンネルの更新エラー:', vlogError);
    } else {
      console.log('✓ Vlog系チャンネルを更新しました');
    }

    // 更新結果を確認
    console.log('\n更新結果を確認中...');
    const { data: categoryCounts, error: countError } = await supabase
      .from('channels')
      .select('category')
      .order('category');

    if (countError) {
      console.error('カテゴリー集計エラー:', countError);
    } else {
      const counts = {};
      categoryCounts.forEach((row) => {
        counts[row.category] = (counts[row.category] || 0) + 1;
      });

      console.log('\nカテゴリー別チャンネル数:');
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count}チャンネル`);
        });
    }

    console.log('\n✓ カテゴリーの更新が完了しました！');
  } catch (error) {
    console.error('\nエラーが発生しました:', error);
    process.exit(1);
  }
}

updateCategories();
