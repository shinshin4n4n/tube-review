# /review — PR レビュー

指定された PR の差分を取得し、チェックリスト観点でレビューする。

## 使い方

```
/review <PR番号>
```

---

## Step 1: 差分取得

```bash
gh pr diff $ARGUMENTS
```

## Step 2: レビュー観点

以下の観点で差分をチェックする。

### Critical Rules（CLAUDE.md）

- [ ] Server Actions は `ApiResponse<T>` を返しているか
- [ ] エラーは `handleApiError()` で処理されているか
- [ ] テストカバレッジ 80%以上か
- [ ] `any` 型を使用していないか
- [ ] RLS が有効化されているか
- [ ] PRサイズが 300行以下 / 10ファイル以下か

### セキュリティ

- [ ] ユーザー入力は Zod スキーマでバリデーションされているか
- [ ] エラーレスポンスに `details`, `stack` を含めていないか
- [ ] `console.log` が残っていないか（`[Debug]` プレフィックス付きは除く）
- [ ] 環境変数・シークレットがハードコードされていないか
- [ ] `.env.example` に機密情報が含まれていないか
- [ ] IDOR（他ユーザーのリソースへの不正アクセス）が防止されているか
- [ ] Soft Delete パターン（`deleted_at IS NULL`）が適用されているか

### TubeReview 固有

- [ ] YouTube Data API はキャッシュ（Upstash Redis）経由で使用しているか
- [ ] Materialized Views（`channel_stats_mv` 等）に影響する変更か → 影響がある場合、リフレッシュの考慮が必要
- [ ] API Routes のレスポンスは `NextResponse.json` + 適切なステータスコードか
- [ ] `scripts/` 配下は ESM 形式（`import`/`export`）か

### コード品質

- [ ] 命名は明確で一貫しているか
- [ ] コードの重複はないか
- [ ] 責務が適切に分離されているか
- [ ] 不要なコメントやデッドコードがないか

## Step 3: 結果投稿

### 指摘がある場合

```bash
gh pr review $ARGUMENTS --request-changes --body "レビュー内容"
```

### 指摘がない場合

```bash
gh pr review $ARGUMENTS --approve --body "LGTM ✅"
```
