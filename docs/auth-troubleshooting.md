# 認証トラブルシューティング

## Magic Link送信が失敗する場合のチェックリスト

### 1. Supabase側の設定確認

[Supabase Dashboard](https://supabase.com/dashboard/project/hhpvymgwuonvzqbflfqz) で以下を確認：

#### Authentication → Providers
- **Email** プロバイダーが有効になっているか
- **Enable Email Provider** がオンになっているか

#### Authentication → Email Templates
- **Magic Link** テンプレートが設定されているか
- 件名とHTMLが正しく入力されているか

#### Authentication → URL Configuration
- **Site URL** が正しく設定されているか
  - 開発: `http://localhost:3000`
  - 本番: `https://tube-review.vercel.app`
- **Redirect URLs** に以下が含まれているか
  - `http://localhost:3000/auth/callback`
  - `https://tube-review.vercel.app/auth/callback`

#### Authentication → Rate Limits
- **Email OTP** のレート制限を確認
- 開発中は緩和推奨: 例）60 requests per hour

### 2. 環境変数の確認

本番環境（Vercel）で以下の環境変数が設定されているか：

```
NEXT_PUBLIC_SUPABASE_URL=https://hhpvymgwuonvzqbflfqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://tube-review.vercel.app
```

確認方法：
- https://tube-review.vercel.app/api/auth/check-env にアクセス
- `allEnvVarsSet: true` になっているか確認

### 3. よくあるエラーとその対処法

#### "email rate limit exceeded"
**原因**: 同じメールアドレスに短時間で複数回送信
**解決**:
- 60秒待つ
- 別のメールアドレス（エイリアス）を使う
- Supabaseのレート制限を緩和

#### "Invalid email"
**原因**: メールアドレスの形式が不正
**解決**:
- 正しいメールアドレス形式か確認
- `+`記号が正しくエンコードされているか確認

#### "Email sending failed"
**原因**: Supabaseのメール送信設定の問題
**解決**:
- Supabase Dashboard → Project Settings → Email で設定確認
- カスタムSMTPを使っている場合は認証情報を確認

#### "SMTP not configured"
**原因**: Supabaseのメール送信設定が未完了
**解決**:
- 無料プランの場合、Supabaseのデフォルトメールを使用
- Project Settings → Email で "Enable Custom SMTP" がオフになっているか確認

### 4. デバッグ手順

1. **環境変数チェック**
   ```
   https://tube-review.vercel.app/api/auth/check-env
   ```

2. **ブラウザの開発者ツールでエラー確認**
   - F12 → Network → `magic-link` リクエスト → Response
   - `details` フィールドのエラーメッセージを確認

3. **Vercelのログ確認**
   - Vercel Dashboard → Functions → Logs
   - `[Magic Link]` で始まるログを検索

4. **Supabaseのログ確認**
   - Supabase Dashboard → Logs → Auth
   - OTP送信のエラーログを確認

### 5. 開発環境での対処法

開発中にメール確認を回避する方法：

#### 方法A: Googleログインを使う（推奨）
最も簡単。既に有効化済み。

#### 方法B: 別のメールアドレスを使う
Gmailの `+` エイリアスを活用：
- `yourname+test1@gmail.com`
- `yourname+test2@gmail.com`

#### 方法C: レート制限を緩和
Supabase Dashboard → Authentication → Rate Limits

#### 方法D: Confirm emailを無効化（開発環境のみ）
⚠️ 本番では必ず有効に戻すこと
- Supabase Dashboard → Authentication → Email
- "Confirm email" をオフ

### 6. 本番環境での推奨設定

- **Email Provider**: 有効
- **Confirm email**: 有効（セキュリティのため）
- **Rate Limits**: デフォルト（1 request per 60 seconds）
- **Site URL**: `https://tube-review.vercel.app`
- **Redirect URLs**:
  - `https://tube-review.vercel.app/auth/callback`
  - `https://tube-review.vercel.app/**` (ワイルドカード)

### 7. 緊急時の代替手段

Magic Linkが動作しない場合の代替ログイン方法：
1. **Googleログイン**を使用（既に有効）
2. 一時的にSupabaseの管理画面からユーザーを直接作成

## トラブルが解決しない場合

1. Supabaseのステータスページを確認: https://status.supabase.com/
2. Supabaseのコミュニティで質問: https://github.com/supabase/supabase/discussions
3. エラーメッセージの全文をコピーして検索
