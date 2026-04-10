---
description: "Server Actions のルールとパターン"
globs: "app/_actions/**"
---

# Server Actions ルール

## 配置

- `app/_actions/{domain}.ts` に配置
- 命名: `{verb}{Noun}` 形式（例: `createReview`, `deleteChannel`）

## 戻り値

- 必ず `ApiResponse<T>` を返す
- 成功: `{ success: true, data: T }`
- 失敗: `{ success: false, error: string }`

## エラーハンドリング

- `lib/api/error.ts` の `handleApiError()` を使用
- エラーレスポンスに `details`, `stack` を含めない

## 認証

- `lib/auth.ts` の `getUser()` を使用
- 認証が必要な操作は先頭で認証チェック

## バリデーション

- Zod 4 スキーマでユーザー入力を検証
- スキーマ定義は Server Action ファイル内または `lib/validations/` に配置

## データ更新後

- `revalidatePath()` を呼んでキャッシュを無効化

## バレルファイル（re-export）の注意点

- re-export のみのバレルファイルには "use server" を付けない
- "use server" は実際にロジックを含む分割先ファイル（-queries.ts, -commands.ts）にのみ付ける
- Turbopack は "use server" + re-export の組み合わせでモジュールのエクスポートを認識できない

## クライアントからの呼び出し

- 呼び出し元で戻り値チェック + ユーザーフィードバック（toast/alert）必須
