---
description: "TDD Red-Green-Refactor サイクルで実装を進める。テスト駆動開発が必要な場合にトリガー。"
---

# /tdd — TDD Red-Green-Refactor サイクル

テスト駆動開発の3フェーズに従って実装を進める。

## 使い方

```
/tdd <実装対象の説明>
```

---

## 🔴 RED: 失敗するテストを先に書く

1. テストファイルを作成（`{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`）
2. 正常系・異常系・エッジケースのテストを記述
3. テスト実行して **FAIL を確認**:

```bash
npm run test:unit
```

→ テストが失敗することを確認してから次へ進む。

## 🟢 GREEN: テストを通す最小限の実装

1. テストを通す **最小限** のコードを書く
2. パターンに従う:
   - Server Actions: `ApiResponse<T>` を返す、`handleApiError()` でエラー処理
   - バリデーション: Zod スキーマで検証
   - 認証: `requireAuth()` を使用
   - RLS: データベースクエリが RLS で保護されていることを確認
3. テスト実行して **PASS を確認**:

```bash
npm run test:unit
```

→ 全テストが通ることを確認してから次へ進む。

## 🔵 REFACTOR: テストを維持しながら改善

1. コードを改善（重複除去、命名改善、責務分離）
2. `any` 型があれば型ガードに置き換え
3. データ更新後は `revalidatePath()` を呼ぶ
4. テスト実行して **PASS を維持**:

```bash
npm run test:unit
```

→ リファクタリング後もテストが通ることを確認。

## 完了チェック

カバレッジを確認（80%以上必須）:

```bash
npm run test:coverage
```
