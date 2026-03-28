# /implement — Issue 実装フロー

指定された Issue を計画→TDD実装→PR作成→自動レビューまで一貫して実行する。

**⚠️ Phase 4 完了まで終了しないこと。**

## 使い方

```
/implement <Issue番号>
```

---

## Phase 1: 計画

1. `gh issue view $ARGUMENTS` で Issue 内容を取得
2. Plan mode に入り、実装計画を作成
3. 計画に以下を **必須** で含める:
   ```
   ## 推定サイズ
   - 推定変更行数: XXX行
   - 推定変更ファイル数: XX ファイル
   - 300行超の場合の分割計画: （該当する場合のみ）
   ```
4. 推定300行超の場合: 分割計画を記載してから続行
5. ユーザーの承認を待つ

## Phase 2: TDD 実装

`/tdd` コマンドの Red-Green-Refactor サイクルに従って実装する。

1. 🔴 RED: 失敗するテストを先に書く
2. 🟢 GREEN: テストを通す最小限の実装
3. 🔵 REFACTOR: テストを維持しながら改善

実装完了後、以下を全て実行:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

全て通過するまで修正を続ける。

## Phase 3: PR 作成

`/create-pr` コマンドを実行する。

## Phase 4: 自動品質サイクル

code-reviewer サブエージェントによる自動レビュー→修正ループを実行する。

### ループ処理（最大3回）

```
loop_count = 0

while loop_count < 3:
  1. code-reviewer サブエージェントでレビュー実行
  2. 結果が LGTM → Phase 5 へ
  3. 指摘あり → 修正を実施
     - 修正の差分を確認（git diff --stat）
     - 5ファイル超 or 50行超の場合:
       → 修正を巻き戻し（git checkout .）
       → 「自動修正の閾値を超えました。手動で対応してください。」と表示
       → 停止
     - 閾値以内: コミット + プッシュ
  4. loop_count += 1

loop_count >= 3 の場合:
  → 「レビューサイクルが上限（3回）に達しました。残りの指摘は手動で対応してください。」と表示
  → 停止
```

## Phase 5: 完了

```
✅ LGTM — Issue #$ARGUMENTS の実装が完了しました。
```
