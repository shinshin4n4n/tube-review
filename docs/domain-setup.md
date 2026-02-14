# カスタムドメイン設定ガイド

## 概要
ちゅぶれびゅ！では、独自ドメイン `tube-review.com` を使用しています。

## ドメイン設定

### 1. ドメイン取得
- **ドメインレジストラ**: ムームードメイン
- **ドメイン名**: tube-review.com
- **取得日**: 2024年

### 2. DNS設定（Vercel DNS）

Vercel DNSを使用してドメインを管理しています。

#### ネームサーバー設定
ムームードメインの管理画面で以下のネームサーバーを設定：

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### DNS レコード設定
Vercel Dashboard > Domains で以下のレコードを設定：

| Type | Name | Value | 説明 |
|------|------|-------|------|
| A | @ | 76.76.21.21 | ルートドメイン |
| CNAME | www | cname.vercel-dns.com | wwwサブドメイン |
| TXT | @ | (SPF Record) | メール認証（Resend用） |
| TXT | resend._domainkey | (DKIM Record) | メール認証（Resend用） |
| MX | @ | feedback-smtp.us-east-1.amazonses.com (10) | メール受信 |

### 3. Vercel プロジェクト設定

#### ドメイン追加
1. Vercel Dashboard > Settings > Domains
2. `tube-review.com` を追加
3. `www.tube-review.com` を追加（リダイレクト設定）

#### 環境変数設定
Vercel Dashboard > Settings > Environment Variables で以下を設定：

```bash
NEXT_PUBLIC_SITE_URL=https://tube-review.com
```

**重要**:
- Production環境に設定
- Vercel上でビルドする際に使用される
- ローカル開発では `.env.local` に `http://localhost:3000` を設定

### 4. Supabase設定

#### Site URL設定
Supabase Dashboard > Authentication > URL Configuration で以下を設定：

```
Site URL: https://tube-review.com
```

#### Redirect URLs設定
許可するリダイレクトURLに以下を追加：

```
https://tube-review.com/auth/callback
https://tube-review.com/**
http://localhost:3000/auth/callback (開発用)
```

### 5. メール設定（Resend）

Resend を使用してメール送信を行っています。

#### ドメイン認証
1. Resend Dashboard > Domains
2. `tube-review.com` を追加
3. DNS レコード（SPF, DKIM, MX）をVercel DNSに追加
4. 認証完了まで待機（通常数時間）

#### SMTP設定
Supabase Dashboard > Project Settings > Auth > SMTP Settings:

```
Host: smtp.resend.com
Port: 465
Username: resend
Password: (Resend API Key)
From: noreply@tube-review.com
```

詳細は [email-setup.md](./email-setup.md) を参照。

## コード内での使用

### 環境変数
`.env.local` (ローカル開発):
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Vercel Environment Variables (本番環境):
```bash
NEXT_PUBLIC_SITE_URL=https://tube-review.com
```

### コード例
```typescript
// デフォルト値として本番ドメインを使用
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tube-review.com';

// メタデータ
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // ...
};

// 認証リダイレクト
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${siteUrl}/auth/callback`,
  },
});
```

## トラブルシューティング

### ドメインが反映されない
- DNS設定が完了してから、最大48時間かかる場合があります
- `dig tube-review.com` でDNS設定を確認
- Vercel Dashboard でドメインステータスを確認

### メールが届かない
- Resend Dashboard でドメイン認証ステータスを確認
- Supabase の SMTP 設定を確認
- [email-setup.md](./email-setup.md) のトラブルシューティングを参照

### リダイレクトループ
- Supabase の Site URL が正しく設定されているか確認
- Redirect URLs に認証コールバックURLが含まれているか確認
- ブラウザのCookieをクリア

## 関連ドキュメント
- [Email Setup Guide](./email-setup.md) - メール送信設定の詳細
- [Auth Troubleshooting](./auth-troubleshooting.md) - 認証関連のトラブルシューティング
- [Deployment Guide](./DEPLOYMENT.md) - デプロイメント手順
