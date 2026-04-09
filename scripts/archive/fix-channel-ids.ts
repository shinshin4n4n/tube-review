/**
 * チャンネルID修正スクリプト
 *
 * 失敗したチャンネルを名前で検索し、正しいチャンネルIDを取得して更新します
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface ChannelSearchResult {
  id: { channelId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: any;
  };
}

/**
 * チャンネル名で検索して正しいIDを取得
 */
async function searchChannelByName(channelName: string): Promise<string | null> {
  try {
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(channelName)}&maxResults=5&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok || !data.items || data.items.length === 0) {
      return null;
    }

    // 検索結果の最初のチャンネルを返す
    const firstResult: ChannelSearchResult = data.items[0];
    return firstResult.id.channelId;
  } catch (error) {
    console.error(`  ❌ 検索エラー:`, error);
    return null;
  }
}

/**
 * チャンネルIDの存在確認
 */
async function verifyChannelId(channelId: string): Promise<boolean> {
  try {
    const url = `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    return response.ok && data.items && data.items.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 失敗したチャンネルのID修正を開始します...\n');

  // 失敗したチャンネルのリスト（スクリプト実行結果から）
  const failedChannels = [
    'ABEMA NEWS',
    'Appleが大好きなんだよ',
    'Emma Chamberlain',
    'Goose house',
    'Kawahara Takuji',
    'Koh Gen Do',
    'NewsPicksチャンネル',
    'Party Kitchen',
    'PASSLABO',
    'PDRさん',
    'SUSURU TV',
    'THE FIRST TIMES',
    'VAIENCE バイエンス',
    'おるたなChannel',
    'カズゲームズ',
    'カズチャンネル',
    'きまぐれクック',
    'キヨ',
    'きりまる',
    'くまの限界食堂',
    'くまみき',
    'コアラ小嵐',
    'コムドット',
    'ザ・きんにくTV',
    'さぁや',
    'スーツ 旅行',
    'すしらーめんりく',
    'すとぷり',
    'せろりんね',
    'そらる',
    'タケヤキ翔',
    'トバログ',
    'なかやまきんに君',
    'ナスD',
    'バイリンガール英会話',
    'はるあん',
    'ヒカル',
    'フィッシャーズ',
    'ポッキー',
    'まいぜんシスターズ',
    'まふまふ',
    'メトロンブログ',
    'メンタリスト DaiGo',
    'りぶ',
    'レトルト',
    '三原慧悟',
    '予備校のノリで学ぶ「大学の数学・物理」',
    '会社員J',
    '日経テレ東大学',
    '東海オンエア',
  ];

  let successCount = 0;
  let notFoundCount = 0;
  const updates: Array<{ title: string; oldId: string; newId: string }> = [];

  for (let i = 0; i < failedChannels.length; i++) {
    const channelName = failedChannels[i];
    const progress = `[${i + 1}/${failedChannels.length}]`;

    console.log(`${progress} ${channelName}`);

    // データベースから現在のIDを取得
    const { data: channel } = await supabase
      .from('channels')
      .select('id, youtube_channel_id')
      .eq('title', channelName)
      .single();

    if (!channel) {
      console.log(`  ⚠️  データベースに見つかりません\n`);
      notFoundCount++;
      continue;
    }

    const oldId = channel.youtube_channel_id;

    // まず現在のIDが有効か確認
    const isValid = await verifyChannelId(oldId);
    if (isValid) {
      console.log(`  ✅ 現在のIDは有効です\n`);
      successCount++;
      continue;
    }

    // 名前で検索して新しいIDを取得
    console.log(`  🔍 名前で検索中...`);
    const newId = await searchChannelByName(channelName);

    if (!newId) {
      console.log(`  ❌ 検索結果なし\n`);
      notFoundCount++;
      continue;
    }

    if (newId === oldId) {
      console.log(`  ⚠️  同じIDが見つかりました（おそらく削除済み）\n`);
      notFoundCount++;
      continue;
    }

    // 新しいIDを検証
    const isNewIdValid = await verifyChannelId(newId);
    if (!isNewIdValid) {
      console.log(`  ❌ 検索結果のIDも無効です\n`);
      notFoundCount++;
      continue;
    }

    console.log(`  ✅ 新しいIDを発見: ${newId}`);

    // データベースを更新
    const { error } = await supabase
      .from('channels')
      .update({
        youtube_channel_id: newId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', channel.id);

    if (error) {
      console.log(`  ❌ 更新失敗: ${error.message}\n`);
      notFoundCount++;
    } else {
      console.log(`  ✅ ID更新成功\n`);
      successCount++;
      updates.push({ title: channelName, oldId, newId });
    }

    // APIレート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 チャンネルID修正が完了しました！\n');
  console.log('📊 実行結果:');
  console.log(`  - 成功: ${successCount}チャンネル`);
  console.log(`  - 失敗/未発見: ${notFoundCount}チャンネル`);

  if (updates.length > 0) {
    console.log('\n📝 更新されたチャンネル:');
    updates.forEach(u => {
      console.log(`  - ${u.title}`);
      console.log(`    旧: ${u.oldId}`);
      console.log(`    新: ${u.newId}`);
    });
  }

  console.log('\n✨ npm run update-thumbnails を実行してサムネイルを更新してください！');
}

main().catch(console.error);
