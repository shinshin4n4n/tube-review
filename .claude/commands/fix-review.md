# /fix-review — レビュー指摘の修正

指定された PR のレビュー指摘を修正してください。

## 使い方

```
/fix-review <PR番号>
```

---

## Step 1: レビューコメント取得

```bash
gh pr view $ARGUMENTS --comments
```

## Step 2: 優先度分類

指摘事項を以下の優先度に分類:

- 🔴 **Must Fix**: セキュリティ、バグ、Critical Rules 違反
- 🟡 **Should Fix**: コード品質、テスト不足、命名の問題
- 🟢 **Nice to have**: スタイル、好みの問題

## Step 3: 修正

1. 全ての 🔴 と 🟡 を修正
2. 🟢 は可能な範囲で対応
3. 修正時の注意:
   - `deleted_at IS NULL` フィルタ欠落の指摘があれば、他のクエリにも同様の問題がないか確認
   - スコープ外の変更が混入している場合は revert して別 PR にする
   - `as` 型アサーションの指摘があれば型ガード関数への置き換えを検討
   - Server Action の戻り値チェック + ユーザーフィードバック（toast）の欠落指摘は必ず対応

## Step 4: 品質チェック

```bash
npm run typecheck
npm run lint
npm run test:unit
```

- テストカバレッジが 80% を下回らないことを確認
- 修正で新たに 300行を超える場合は分割を検討

## Step 5: コミット + プッシュ

```bash
git add <修正ファイル>
git commit -m "fix: PR #$ARGUMENTS レビュー指摘対応"
git push
```

## Step 6: 修正サマリー

修正内容のサマリーを表示すること。
