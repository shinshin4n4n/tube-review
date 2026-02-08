# トラブルシューティング

よくある問題と解決方法です。

## 🔍 ビルドエラー

### エラー: Environment variable validation failed

**原因**: 環境変数が不足または不正

**解決策**:
1. Vercel Dashboardで環境変数を確認
2. 必須変数が全て設定されているか確認
3. \`lib/env.ts\` のスキーマと照合

### エラー: Module not found

**原因**: 依存関係のインストール漏れ

**解決策**:
\`\`\`bash
npm install
\`\`\`

## 🗄️ データベースエラー

### エラー: Connection pool timeout

**原因**: 接続プールの枯渇

**解決策**:
1. 不要な接続を閉じる
2. 接続プールサイズを増やす
3. Supabase Dashboard で確認

### エラー: RLS policy violation

**原因**: Row Level Securityポリシー違反

**解決策**:
1. ポリシーを確認
2. ユーザー権限を確認
3. \`docs/SECURITY_AUDIT.md\` を参照

## 🔐 認証エラー

### エラー: OAuth redirect mismatch

**原因**: リダイレクトURIの不一致

**解決策**:
1. Google Cloud Console で Authorized redirect URIs を確認
2. Supabase の Callback URL を追加
3. 大文字小文字・スラッシュの有無を確認

### エラー: Magic link expired

**原因**: リンクの有効期限切れ

**解決策**:
- 新しいマジックリンクを送信

## 📸 画像アップロードエラー

### エラー: File size too large

**原因**: ファイルサイズが5MBを超えている

**解決策**:
- 画像を圧縮
- ファイルサイズ上限を変更（Supabase Storage設定）

### エラー: Invalid MIME type

**原因**: 許可されていないファイル形式

**解決策**:
- JPEG, PNG, GIF, WebPを使用
- Supabase Storage の Allowed MIME types を確認

## 🔍 デバッグ方法

### ログの確認

**Vercel**:
\`\`\`bash
vercel logs
\`\`\`

**Supabase**:
Supabase Dashboard → Logs

### ローカルデバッグ

\`\`\`bash
npm run dev
\`\`\`

Chrome DevTools でデバッグ。

## 📞 サポート

- GitHub Issues
- Supabase Support
- Vercel Support

---

**最終更新**: 2026-02-08
