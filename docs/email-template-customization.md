# メールテンプレートのカスタマイズ方法

## 現状の問題

現在、Magic Linkでログインする際に送信されるメールがSupabaseのデフォルトテンプレートになっています。

## Supabase Studioでのカスタマイズ手順

### 1. Supabase Studioにアクセス

https://supabase.com/dashboard/project/YOUR_PROJECT_ID

### 2. Email Templatesの設定

1. サイドバーから **Authentication** → **Email Templates** を選択
2. **Magic Link** テンプレートを選択
3. 以下のようなカスタムテンプレートに変更：

```html
<h2>ちゅぶれびゅ！へようこそ</h2>

<p>こんにちは、</p>

<p>ちゅぶれびゅ！へのログインリンクをお送りします。以下のボタンをクリックしてログインしてください。</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">ログインする</a></p>

<p>または、以下のURLをブラウザにコピー&ペーストしてください：</p>
<p>{{ .ConfirmationURL }}</p>

<p>このリンクは1時間有効です。</p>

<p>もしこのメールに心当たりがない場合は、無視してください。</p>

<p>よろしくお願いいたします。<br>
ちゅぶれびゅ！チーム</p>
```

### 3. 件名のカスタマイズ

**Subject** フィールドも変更：

```
ちゅぶれびゅ！ - ログインリンクのご案内
```

### 4. その他のテンプレート

必要に応じて以下のテンプレートもカスタマイズ：

- **Confirm Signup**: 新規登録確認メール
- **Invite User**: ユーザー招待メール
- **Reset Password**: パスワードリセットメール（現在未使用）
- **Change Email Address**: メールアドレス変更確認

## 新規ユーザー登録について

現在の実装（`signInWithOtp`）は：

- **既存ユーザー**: ログインリンクを送信
- **新規ユーザー**: 自動的にアカウント作成 + ログインリンクを送信

つまり、新規登録とログインが同じフローで処理されます。これは一般的なマジックリンク認証の仕様です。

## 確認用のメール設定

### SMTP設定の確認

Supabase Studioで **Settings** → **Project Settings** → **Email** を確認：

- デフォルトでは Supabase の SMTP サーバーを使用
- カスタムSMTPサーバーを設定することも可能（SendGrid, AWS SESなど）

### テストメール送信

設定後、実際にテストメールを送信して確認してください。

## 注意事項

- メールテンプレートはSupabase Studio上で管理（コードベースではない）
- プロジェクトごとに設定が必要
- 開発環境と本番環境で同じ設定を適用する必要がある
