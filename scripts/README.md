# チャンネルデータ同期スクリプト

## 概要

このスクリプトは、データベースに保存されているチャンネルデータをYouTube Data APIから取得した最新情報で更新します。

seed.sqlで挿入されたチャンネルのサムネイル画像や統計情報（登録者数、動画数など）を最新の状態に同期できます。

## 前提条件

### 必須環境変数

`.env.local`ファイルに以下の環境変数が設定されている必要があります：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key
```

### YouTube API キーの取得方法

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「ライブラリ」から「YouTube Data API v3」を有効化
4. 「認証情報」→「認証情報を作成」→「APIキー」を選択
5. 作成されたAPIキーを`.env.local`にコピー

### Supabase Service Role Key の取得方法

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 「Settings」→「API」→「Service Role Key」をコピー
4. `.env.local`にコピー

⚠️ **注意**: Service Role Keyは管理者権限を持つため、絶対に公開しないでください！

## 使い方

### 1. seed.sqlを実行してチャンネルデータを挿入

まず、Supabase Studioまたはpsqlでseed.sqlを実行します：

```bash
# Supabase CLIを使用する場合
npx supabase db reset

# または、psqlを使用する場合
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/seed.sql
```

### 2. スクリプトを実行

```bash
npm run sync-channels
```

または

```bash
npx tsx scripts/sync-channels-from-youtube.ts
```

### 3. Materialized Viewを更新

スクリプト実行後、Supabase Studioで以下のSQLを実行してください：

```sql
REFRESH MATERIALIZED VIEW channel_stats;
```

## 実行結果の例

```
🚀 チャンネルデータの同期を開始します...

📊 12個のチャンネルを処理します

処理中: HikakinTV (UCZf__ehlCEBPop-_sldpBUQ)
✅ 成功: HikakinTV
   - サムネイル: https://yt3.googleusercontent.com/...
   - 登録者数: 5,500,000
   - 動画数: 2,800

処理中: 東海オンエア (UCutJqz56653xV2wwSvut_hQ)
✅ 成功: 東海オンエア
   - サムネイル: https://yt3.googleusercontent.com/...
   - 登録者数: 7,200,000
   - 動画数: 3,500

...

📝 次のステップ:
   Supabase Studioで以下のSQLを実行してください:
   REFRESH MATERIALIZED VIEW channel_stats;

==================================================
📈 同期結果
==================================================
✅ 成功: 12個
❌ 失敗: 0個
📊 合計: 12個
==================================================

✨ 同期が完了しました！
```

## トラブルシューティング

### エラー: "NEXT_PUBLIC_SUPABASE_URL が設定されていません"

`.env.local`ファイルに環境変数が設定されているか確認してください。

### エラー: "YouTube API error: 403"

- YouTube API キーが正しく設定されているか確認
- Google Cloud ConsoleでYouTube Data API v3が有効化されているか確認
- API キーに制限がかかっていないか確認

### エラー: "Channel not found"

seed.sqlのYouTubeチャンネルIDが正しいか確認してください。チャンネルが削除されている場合もあります。

### エラー: "Quota exceeded"

YouTube Data API v3には1日あたりのクォータ制限（デフォルト10,000ユニット）があります。

- チャンネル詳細取得: 1ユニット/回
- 12チャンネル取得: 12ユニット

制限内のはずですが、他のアプリケーションでAPIを使用している場合は注意してください。

## 注意事項

- スクリプトは既存のチャンネルデータを上書きします
- YouTube APIのレート制限を考慮して、各リクエスト間に1秒の待機時間を設けています
- Service Role Keyを使用するため、本番環境では慎重に扱ってください

## ファイル構成

```
scripts/
├── README.md                          # このファイル
└── sync-channels-from-youtube.ts      # 同期スクリプト
```

## 関連ファイル

- `supabase/seed.sql` - シードデータ（チャンネル初期データ）
- `lib/youtube/api.ts` - YouTube API クライアント
- `lib/youtube/types.ts` - YouTube API 型定義
