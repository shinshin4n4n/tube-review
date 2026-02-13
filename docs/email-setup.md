# メール送信設定ドキュメント

このドキュメントでは、ちゅぶれびゅ！でのメール認証（Magic Link）を実現するために行った設定を記録します。

## 概要

- **メール送信サービス**: Resend
- **DNS管理**: Vercel DNS
- **独自ドメイン**: ムームードメインで取得
- **認証方式**: Magic Link（パスワードレス認証）

## 背景

### 問題点
Supabaseのデフォルトメール送信は、無料プランでは **1時間に2通まで** という厳しい制限があり、開発・テストが困難でした。

### 解決策
- **Resend** を使用してカスタムSMTP設定
- 無料プラン: **月3,000通** まで送信可能
- 独自ドメインを認証することで、任意のユーザーにメール送信可能

---

## 設定手順

### 1. 独自ドメインの取得

1. **ムームードメイン**で独自ドメインを取得
2. ドメイン名: `[your-domain.com]`

### 2. Vercel DNSの設定

独自ドメインをVercel DNSで管理することで、Vercelでのデプロイとメール認証のDNS設定を一元化しました。

#### 2-1. Vercelにドメイン追加

1. [Vercel Dashboard](https://vercel.com/dashboard) → tube-reviewプロジェクト
2. **Settings** → **Domains**
3. 独自ドメインを入力して **Add**
4. **「Use Vercel DNS (Recommended)」** を選択
5. Vercelのネームサーバーが表示される：
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

#### 2-2. ムームードメインでネームサーバー変更

1. ムームードメイン管理画面にログイン
2. **「ドメイン管理」** → **「ドメイン操作」** → **「ネームサーバー設定変更」**
3. **「GMOペパボ以外のネームサーバーを使用する」** を選択
4. ネームサーバーを入力：
   - ネームサーバー1: `ns1.vercel-dns.com`
   - ネームサーバー2: `ns2.vercel-dns.com`
5. **「ネームサーバー設定変更」** をクリック

**反映時間**: 数分～24時間

### 3. Resendの設定

#### 3-1. Resendアカウント作成

1. [Resend](https://resend.com/) にアクセス
2. GitHubアカウントまたはメールアドレスでサインアップ
3. 無料プラン: 月3,000通まで送信可能

#### 3-2. API Key取得

1. Resend Dashboard → **「API Keys」**
2. **「Create API Key」** をクリック
3. 名前: `tube-review-production`
4. Permission: **「Sending access」**
5. **「Create」**
6. 表示されるAPI Keyをコピー（`re_...` で始まる文字列）

#### 3-3. ドメイン認証

1. Resend Dashboard → **「Domains」**
2. **「Add Domain」** をクリック
3. 独自ドメイン（例: `your-domain.com`）を入力
4. Resendが表示するDNSレコードをコピー：
   - `TXT` レコード（SPF認証用）
   - `TXT` レコード（DKIM認証用）
   - `MX` レコード（オプション）

#### 3-4. Vercel DNSにレコード追加

1. Vercel Dashboard → Settings → Domains
2. 追加したドメインをクリック
3. **「DNS Records」** セクションを開く
4. **「Add Record」** でResendが指示するレコードを追加：

**例:**

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | @ | `v=spf1 include:_spf.resend.com ~all` | - |
| TXT | resend._domainkey | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4...` | - |
| MX | @ | `feedback-smtp.resend.com` | 10 |

5. **保存**して、Resend Dashboardで **「Verify」** をクリック
6. 数分～数時間で **「Verified」** になる

### 4. Supabase SMTP設定

#### 4-1. SMTP設定を有効化

1. [Supabase Dashboard - Auth Settings](https://supabase.com/dashboard/project/hhpvymgwuonvzqbflfqz/settings/auth)
2. **「SMTP Settings」** セクションまでスクロール
3. **「Enable Custom SMTP」** をオン

#### 4-2. Resend情報を入力

```
Host: smtp.resend.com
Port: 465
Username: resend
Password: [ResendのAPI Key]
Sender email: noreply@your-domain.com
Sender name: ちゅぶれびゅ！
```

4. **「Save」** をクリック

### 5. メールテンプレートの修正

デフォルトのメールテンプレートでは、`/auth/callback` が正しくリダイレクトされない問題があったため、テンプレートを直接修正しました。

#### 5-1. Magic Linkテンプレート修正

1. Supabase Dashboard → **Authentication** → **Email Templates** → **Magic Link**
2. 以下のテンプレートに変更：

```html
<h2>ちゅぶれびゅ！へのログイン</h2>

<p>こんにちは、</p>

<p>ちゅぶれびゅ！へのログインリンクをお送りします。<br>
以下のボタンをクリックしてログインしてください。</p>

<p style="margin: 30px 0;">
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink"
     style="display: inline-block;
            padding: 12px 24px;
            background-color: #3B82F6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;">
    ログインする
  </a>
</p>

<p>ボタンが動作しない場合は、以下のURLをコピーしてブラウザに貼り付けてください:</p>
<p style="word-break: break-all; color: #666;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink</p>

<p style="margin-top: 30px; font-size: 14px; color: #666;">
  このリンクは1時間有効です。<br>
  もしこのメールに心当たりがない場合は、無視してください。
</p>

<p style="margin-top: 40px; font-size: 14px;">
  よろしくお願いいたします。<br>
  <strong>ちゅぶれびゅ！チーム</strong>
</p>
```

**件名:**
```
ちゅぶれびゅ！ - ログインリンクのご案内
```

3. **「Save」** をクリック

### 6. Supabase URL Configuration

1. [Supabase Dashboard - URL Configuration](https://supabase.com/dashboard/project/hhpvymgwuonvzqbflfqz/auth/url-configuration)

**Site URL:**
```
https://tube-review.vercel.app
```

**Redirect URLs:**
```
https://tube-review.vercel.app/auth/callback
https://tube-review.vercel.app/**
http://localhost:3000/**
```

独自ドメインを使用する場合は追加：
```
https://your-domain.com/auth/callback
https://your-domain.com/**
```

---

## 結果

✅ メール送信が安定して動作
✅ 1時間に2通 → 月3,000通に拡大
✅ 開発・テストが快適に
✅ 独自ドメインからのメール送信
✅ `/auth/callback` 経由で正しくセッション作成
✅ ログイン状態が維持される

---

## 重要なポイント

### Vercel DNSを使う理由
- Vercelでのデプロイ設定とメール認証のDNS設定を一元化
- Vercel Dashboard内でDNSレコードを簡単に管理
- ムームードメインのDNS設定より柔軟

### メールテンプレート修正の理由
- Supabaseのデフォルト `{{ .ConfirmationURL }}` では `/auth/callback` が含まれない
- `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink` を直接指定することで確実に `/auth/callback` を経由

### なぜnoreply@your-domain.comで受信不要？
- Magic Linkは送信専用
- Resendが送信を代行してくれる
- 実際にメールサーバーを立てる必要はない

---

## トラブルシューティング

### メールが届かない場合

1. **Resendのログを確認**
   - [Resend Logs](https://resend.com/logs)
   - メール送信の試行が記録されているか確認

2. **ドメイン認証状態を確認**
   - Resend Dashboard → Domains
   - 「Verified」になっているか確認

3. **DNSレコードの反映を確認**
   - DNS反映には最大24時間かかる場合がある
   - `nslookup -type=TXT resend._domainkey.your-domain.com` で確認

4. **スパムフォルダを確認**
   - 初回送信時はスパムに振り分けられることがある

### セッションが作成されない場合

1. **メールのリンクが `/auth/callback` を含むか確認**
   - URLに `auth/callback` が含まれていない場合、メールテンプレートの修正が必要

2. **Supabase URL Configurationを確認**
   - Site URLが正しいか
   - Redirect URLsに `/auth/callback` が含まれているか

3. **`/debug-auth` で状態確認**
   - Cookie情報を確認
   - セッション情報を確認

---

## コスト

- **ムームードメイン**: 年間 約1,000円～
- **Resend**: 無料プラン（月3,000通まで）
- **Vercel**: 無料プラン
- **Supabase**: 無料プラン

**合計: 年間約1,000円** でメール認証が実現できます。

---

## 参考リンク

- [Resend Documentation](https://resend.com/docs)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel DNS](https://vercel.com/docs/projects/domains/working-with-dns)
- [ムームードメイン](https://muumuu-domain.com/)

---

## まとめ

この設定により、以下が実現できました：

1. ✅ 独自ドメインからのメール送信
2. ✅ Vercel DNSで一元管理
3. ✅ Resendで安定したメール送信（月3,000通）
4. ✅ Magic Link認証の正常動作
5. ✅ セッション管理の確立

開発・本番環境ともに快適にメール認証が使えるようになりました。
