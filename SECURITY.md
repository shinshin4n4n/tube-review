# セキュリティポリシー

## 🔒 セキュリティ方針

TubeReviewプロジェクトでは、ユーザーデータの保護とアプリケーションのセキュリティを最優先事項としています。セキュリティに関する問題を発見された場合は、以下の手順に従って報告してください。

## 🚨 脆弱性の報告

### 報告方法

セキュリティ脆弱性を発見した場合は、**公開イシューで報告せず**、以下の方法で報告してください:

1. **GitHub Security Advisories** (推奨)
   - [Security Advisory作成ページ](https://github.com/shinshin4n4n/tube-review/security/advisories/new)
   - 非公開で報告可能
   - GitHub Security Lab が自動的に分析

2. **メール**
   - セキュリティチームまで直接連絡
   - 件名: `[Security] TubeReview - <簡単な説明>`

### 報告に含めるべき情報

脆弱性報告には以下の情報を含めてください:

- **脆弱性の種類** (XSS, SQLインジェクション, 権限昇格など)
- **影響範囲** (どの機能/ページが影響を受けるか)
- **再現手順** (できるだけ詳細に)
- **PoC (Proof of Concept)** (可能であれば)
- **影響度** (Critical / High / Medium / Low)
- **推奨される修正方法** (任意)

### 報告例

```markdown
## 脆弱性の種類
Cross-Site Scripting (XSS)

## 影響範囲
レビュー投稿機能 (/channels/[id]/reviews)

## 再現手順
1. ログインする
2. レビュー投稿フォームを開く
3. タイトルに `<script>alert('XSS')</script>` を入力
4. 投稿すると、ページ表示時にスクリプトが実行される

## 影響度
High - 他のユーザーのセッション情報が盗まれる可能性

## 推奨される修正方法
DOMPurifyでサニタイズするか、dangerouslySetInnerHTMLを使用しない
```

## ⏱️ 対応タイムライン

報告された脆弱性には、以下のタイムラインで対応します:

| 深刻度 | 初動対応 | 修正完了 | 公開 |
|--------|---------|---------|------|
| **Critical** | 24時間以内 | 3日以内 | 修正後7日 |
| **High** | 3日以内 | 7日以内 | 修正後14日 |
| **Medium** | 7日以内 | 14日以内 | 修正後30日 |
| **Low** | 14日以内 | 30日以内 | 修正後30日 |

### 対応フロー

1. **受領確認** (24時間以内)
   - 報告を受け取ったことを確認
   - 脆弱性の深刻度を評価

2. **調査・検証** (上記タイムライン参照)
   - 脆弱性の再現
   - 影響範囲の特定
   - 修正方法の検討

3. **修正実装**
   - セキュリティパッチの開発
   - テスト実施
   - デプロイ

4. **報告者への通知**
   - 修正完了の通知
   - CVE番号の発行 (該当する場合)

5. **公開**
   - セキュリティアドバイザリの公開
   - リリースノートに記載

## 🏆 報奨金プログラム (将来的に)

現在、報奨金プログラムは実施していませんが、将来的に以下のような報奨金制度を検討しています:

| 深刻度 | 報奨金 |
|--------|--------|
| Critical | ¥50,000 - ¥100,000 |
| High | ¥20,000 - ¥50,000 |
| Medium | ¥5,000 - ¥20,000 |
| Low | ¥1,000 - ¥5,000 |

## 🔐 サポートされているバージョン

以下のバージョンでセキュリティアップデートを提供しています:

| バージョン | サポート状況 |
|-----------|-------------|
| 0.1.x (最新) | ✅ サポート中 |
| < 0.1.0 | ❌ サポート終了 |

## 🛡️ セキュリティベストプラクティス

### 開発者向け

TubeReviewプロジェクトに貢献する開発者は、以下のセキュリティベストプラクティスに従ってください:

#### 1. 認証・認可

```typescript
// ✅ Good: Middleware で認証チェック
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// ❌ Bad: クライアント側のみで認証チェック
if (!session) {
  router.push('/login');
}
```

#### 2. データアクセス制御

```typescript
// ✅ Good: RLSポリシーで制御
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

// ❌ Bad: アプリケーションロジックのみで制御
if (userId === currentUser.id) {
  await updateUser(data);
}
```

#### 3. 入力バリデーション

```typescript
// ✅ Good: Zodでバリデーション
const schema = z.object({
  title: z.string().min(1).max(100),
  rating: z.number().min(1).max(5),
});
const data = schema.parse(input);

// ❌ Bad: バリデーションなし
const data = {
  title: input.title,
  rating: input.rating,
};
```

#### 4. XSS対策

```typescript
// ✅ Good: Reactの自動エスケープ
<div>{userInput}</div>

// ⚠️ 注意: dangerouslySetInnerHTML は避ける
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 例外: JSON-LD など安全な場合のみ
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
/>
```

#### 5. 環境変数管理

```typescript
// ✅ Good: 環境変数を使用
const apiKey = process.env.YOUTUBE_API_KEY;

// ❌ Bad: ハードコード
const apiKey = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX';

// ✅ Good: Zodでバリデーション
const envSchema = z.object({
  YOUTUBE_API_KEY: z.string().min(1),
});
const env = envSchema.parse(process.env);
```

#### 6. SQLインジェクション対策

```typescript
// ✅ Good: Supabase クエリビルダー
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

// ❌ Bad: 生のSQLクエリ（使用しない）
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

#### 7. セキュリティヘッダー

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

### ユーザー向け

TubeReviewを安全に使用するために、以下の点に注意してください:

1. **強力なパスワードを使用**
   - 12文字以上
   - 大文字・小文字・数字・記号を含む
   - 他のサイトで使い回さない

2. **二要素認証 (2FA) を有効化** (将来実装予定)
   - Google Authenticator推奨
   - SMS認証も利用可能

3. **公共のWi-Fiでは注意**
   - VPN使用を推奨
   - HTTPS接続を確認

4. **不審なメールに注意**
   - TubeReviewから送信されるメールは `@tube-review.vercel.app` ドメインのみ
   - リンクをクリックする前に、URLを確認

5. **定期的にアカウントアクティビティを確認**
   - 不審なログインがないか確認
   - セッション管理機能を活用 (将来実装予定)

## 🔍 セキュリティ監査履歴

| 日付 | 監査者 | バージョン | スコア | レポート |
|------|--------|-----------|--------|---------|
| 2026-02-08 | Claude Sonnet 4.5 | v0.1.0 | A+ (98/100) | [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) |

## 📚 セキュリティ関連ドキュメント

- [セキュリティ監査レポート](docs/SECURITY_AUDIT.md)
- [RLSポリシー一覧](docs/SECURITY_AUDIT.md#2-row-level-security-100100)
- [OWASP Top 10対応状況](docs/SECURITY_AUDIT.md#-owasp-top-10-対応状況)

## 🔗 外部リソース

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/headers)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/about-repository-security-advisories)

## ❓ よくある質問 (FAQ)

### Q: APIキーが漏洩した場合はどうすればよいですか？

A: 以下の手順に従ってください:

1. **即座に無効化**
   - Google Cloud Console / Supabase Dashboard でキーを無効化
   - 新しいキーを生成

2. **影響範囲の確認**
   - APIキーの使用ログを確認
   - 不正なアクセスがないかチェック

3. **セキュリティチームに報告**
   - 漏洩した経緯を報告
   - 再発防止策を検討

4. **環境変数を更新**
   - `.env.local` を更新
   - Vercelの環境変数を更新

### Q: 個人情報が漏洩した可能性がある場合は？

A: 以下の手順に従ってください:

1. **即座に報告**
   - セキュリティチームに連絡
   - 影響範囲を特定

2. **ユーザーに通知**
   - 影響を受けるユーザーに通知
   - 対応方法を案内

3. **対策実施**
   - 脆弱性を修正
   - セキュリティ監査を実施

4. **監督機関への報告** (必要に応じて)
   - 個人情報保護委員会への報告
   - GDPR対応 (該当する場合)

### Q: プルリクエストでセキュリティ問題が見つかった場合は？

A: 以下の手順に従ってください:

1. **プルリクエストを非公開化**
   - GitHub Security Advisory を使用
   - 公開リポジトリでは詳細を記載しない

2. **修正を優先**
   - セキュリティ問題を最優先で修正
   - テストを追加

3. **レビュー**
   - セキュリティ専門家によるレビュー
   - 自動スキャンツールで検証

4. **マージ後に公開**
   - 修正が完了してから公開
   - リリースノートに記載

## 📞 連絡先

- **GitHub Issues**: 一般的なバグ報告
- **GitHub Security Advisories**: 脆弱性報告 (非公開)
- **メール**: security@tube-review.example.com (将来設定予定)

---

**最終更新**: 2026-02-08
**ポリシーバージョン**: 1.0
