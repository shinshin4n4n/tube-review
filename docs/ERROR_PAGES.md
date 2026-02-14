# エラーページガイド

ちゅぶれびゅ！プロジェクトのエラーページ実装とロガーの使用方法です。

## 📋 目次

- [エラーページ一覧](#エラーページ一覧)
- [ロガーの使用方法](#ロガーの使用方法)
- [エラーIDについて](#エラーidについて)
- [トラブルシューティング](#トラブルシューティング)

## 📄 エラーページ一覧

### 1. グローバル404ページ

**ファイル**: `app/not-found.tsx`

**表示条件**:
- 存在しないURLにアクセスした時
- `notFound()`関数を呼び出した時

**機能**:
- ホームへ戻るボタン
- チャンネル検索へのリンク
- サポート情報へのリンク

**使用例**:
```typescript
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
  const data = await fetchData(params.id);

  if (!data) {
    notFound(); // 404ページを表示
  }

  return <div>{data.title}</div>;
}
```

### 2. グローバルエラーページ

**ファイル**: `app/error.tsx`

**表示条件**:
- アプリケーション内で未処理のエラーが発生した時
- Server ComponentまたはClient Componentでエラーが発生した時

**機能**:
- エラーIDの生成と表示
- 再試行ボタン（`reset()`関数を呼び出し）
- ホームへ戻るリンク
- エラーログ自動送信（本番環境）
- 開発環境でのスタックトレース表示

**特徴**:
- クライアントコンポーネント（'use client'）
- エラーが発生するたびに新しいエラーIDを生成
- Vercel Analyticsへの自動送信（本番環境のみ）

### 3. ルートレイアウトエラーページ

**ファイル**: `app/global-error.tsx`

**表示条件**:
- `app/layout.tsx`でエラーが発生した時
- 最も外側のエラーバウンダリ

**機能**:
- 完全なHTML/Bodyタグを含む
- インラインスタイルでスタイリング
- 最小限の依存関係

**注意点**:
- `html`と`body`タグを自分で定義する必要がある
- 通常のコンポーネントやスタイルが使えない可能性があるため、インラインスタイルを使用
- アプリケーション全体がクラッシュした場合の最後の砦

### 4. 検索ページエラー

**ファイル**: `app/search/error.tsx`

**表示条件**: チャンネル検索中のエラー

**機能**:
- 検索を再試行ボタン
- 検索のヒント表示
- YouTube APIクォータ制限の案内

**考えられるエラー**:
- YouTube API接続エラー
- APIクォータ超過
- ネットワークエラー

### 5. チャンネル詳細エラー

**ファイル**: `app/channels/[id]/error.tsx`

**表示条件**: チャンネル情報取得中のエラー

**機能**:
- 再読み込みボタン
- 別のチャンネルを探すリンク
- 考えられる原因の表示

**考えられるエラー**:
- チャンネルが削除された
- YouTube APIエラー
- データベース接続エラー

### 6. プロフィールエラー

**ファイル**: `app/profile/error.tsx`

**表示条件**: プロフィール情報の読み込みエラー

**機能**:
- 再読み込みボタン
- ログイン確認の案内
- トラブルシューティングヒント

**考えられるエラー**:
- 未ログイン状態
- セッション期限切れ
- データベースエラー

## 📊 ロガーの使用方法

### インポート

```typescript
import { logger, generateErrorId } from '@/lib/logger';
```

### ログレベル

#### デバッグログ（開発環境のみ）

```typescript
logger.debug('User action', { action: 'click', button: 'submit' });
```

#### 情報ログ

```typescript
logger.info('User logged in', { userId: '123' });
```

#### 警告ログ

```typescript
logger.warn('API rate limit approaching', { remaining: 100 });
```

#### エラーログ

```typescript
logger.error('Failed to fetch data', error, {
  userId: '123',
  endpoint: '/api/channels',
});
```

### エラーID生成

```typescript
import { generateErrorId } from '@/lib/logger';

const errorId = generateErrorId();
// 例: "lm3x8k9-abc123d"
```

エラーIDは以下の形式で生成されます:
- タイムスタンプ（36進数）+ ランダム文字列（7文字）
- ユニーク性が高く、問い合わせ時の参照に使用

### セキュリティ機能

ロガーは自動的に以下のキーを含む値を`[REDACTED]`に置き換えます:

- `password`
- `token`
- `apiKey`
- `secret`
- `authorization`
- `cookie`

**例**:
```typescript
logger.info('User data', {
  username: 'john',
  password: 'secret123', // 自動的に [REDACTED] に置き換え
  email: 'john@example.com',
});

// 出力: { username: 'john', password: '[REDACTED]', email: 'john@example.com' }
```

### 環境変数

`.env.local`または環境変数で設定:

```bash
# ログレベル（debug, info, warn, error）
LOG_LEVEL=info

# 本番環境（自動設定）
NODE_ENV=production
```

### Vercel Analytics連携

本番環境では、エラーログが自動的にVercel Analyticsに送信されます:

- エラーレベルのログのみ送信
- `navigator.sendBeacon`を使用（非同期）
- Analytics送信エラーはアプリケーションに影響しない

## 🔢 エラーIDについて

### エラーIDとは

ユーザーがサポートに問い合わせる際、エラーを特定するための一意の識別子です。

### エラーIDの形式

```
lm3x8k9-abc123d
```

- 前半: タイムスタンプ（36進数変換）
- 後半: ランダム文字列（7文字）

### エラーIDの用途

1. **サポート問い合わせ**: ユーザーがエラーIDを伝えることで、具体的なエラーを特定
2. **ログ検索**: ログシステムでエラーIDを検索して詳細を確認
3. **デバッグ**: エラーが発生した正確な時刻とコンテキストを把握

### エラーページでの表示

すべてのエラーページでエラーIDが自動的に生成・表示されます:

```typescript
const [errorId, setErrorId] = useState<string>('');

useEffect(() => {
  const id = generateErrorId();
  setErrorId(id);

  logger.error('Error occurred', error, {
    errorId: id,
    page: 'channel-detail',
  });
}, [error]);
```

## 🐛 トラブルシューティング

### エラーページが表示されない

**症状**: エラーが発生してもエラーページが表示されない

**確認事項**:
1. エラーが`error.tsx`と同じまたは下位階層で発生しているか
2. エラーが正しく`throw`されているか
3. ブラウザのコンソールでエラーを確認

**解決策**:
```typescript
// エラーを明示的にthrow
if (!data) {
  throw new Error('Data not found');
}

// または notFound() を使用
if (!data) {
  notFound();
}
```

### エラーログが記録されない

**症状**: エラーが発生してもログに記録されない

**確認事項**:
1. `LOG_LEVEL`環境変数の設定
2. ログレベルが適切か（debug < info < warn < error）
3. ブラウザのコンソールを確認

**解決策**:
```bash
# .env.local
LOG_LEVEL=debug  # すべてのログを表示
```

### 開発環境でスタックトレースが表示されない

**症状**: エラーページでスタックトレースが表示されない

**確認事項**:
1. `NODE_ENV=development`が設定されているか
2. `error.tsx`の`details`要素を確認

**解決策**:
```typescript
// error.tsxで開発環境チェック
{process.env.NODE_ENV === 'development' && (
  <details>
    <summary>開発者向け詳細情報</summary>
    <pre>{error.stack}</pre>
  </details>
)}
```

### YouTube APIエラーが頻発する

**症状**: 検索やチャンネル詳細でエラーが頻発

**確認事項**:
1. YouTube API keyが正しく設定されているか
2. APIクォータを超過していないか（10,000ユニット/日）
3. Google Cloud ConsoleでAPIが有効化されているか

**解決策**:
1. [Google Cloud Console](https://console.cloud.google.com/) でクォータ状況を確認
2. クォータ超過の場合は翌日（UTC 00:00）まで待つ
3. APIキーの制限設定を確認

### プロフィールエラーが表示される

**症状**: プロフィールページでエラーが発生

**確認事項**:
1. ログインしているか
2. セッションが有効か
3. データベース接続は正常か

**解決策**:
1. 再ログイン
2. ブラウザのキャッシュとCookieをクリア
3. 別のブラウザで試す

## 📞 サポート

### エラーを報告する

エラーが解決しない場合は、以下の情報を含めて[GitHubイシュー](https://github.com/shinshin4n4n/tube-review/issues)で報告してください:

```markdown
## エラー情報

- **エラーID**: lm3x8k9-abc123d
- **発生日時**: 2026-02-08 10:30 JST
- **ページ**: /channels/UC123456
- **操作**: チャンネル詳細を表示しようとした

## 再現手順

1. ログインする
2. 検索でチャンネルを検索
3. チャンネル詳細をクリック
4. エラーページが表示される

## 期待される動作

チャンネル詳細ページが表示される

## 実際の動作

エラーページが表示される

## スクリーンショット

[エラーページのスクリーンショットを添付]

## 環境

- ブラウザ: Chrome 120
- OS: Windows 11
- デバイス: デスクトップ
```

---

**最終更新**: 2026-02-08
