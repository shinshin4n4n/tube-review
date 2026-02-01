# ADR-001: Next.js App Router採用

## ステータス
承認

## 決定日
2026-01-31

## コンテキスト

TubeReview はYouTubeチャンネルのレビュープラットフォームとして、以下の要件がある：
- SEO最適化（検索エンジンでチャンネルレビューが見つかる必要がある）
- 高速な初期表示（ユーザー体験向上）
- サーバー・クライアント両方のデータフェッチング
- 将来的なスケーラビリティ

Next.js の選択肢として、App Router（Next.js 13+）と Pages Router がある。

## 決定内容

**Next.js 16 App Router を採用し、Pages Router は使用しない。**

## 理由

### 1. Server Components によるパフォーマンス向上
- サーバー側でレンダリングし、JavaScriptバンドルサイズを削減
- チャンネル一覧、レビュー表示などの読み取り専用UIに最適
- 初期表示が高速（LCP改善）

### 2. Server Actions によるAPI簡素化
- API Routes を作る必要がなく、サーバー処理を直接呼び出せる
- フォーム送信（レビュー投稿、マイリスト追加）が簡潔に書ける
- Progressive Enhancement（JavaScriptオフでも動作）

### 3. レイアウト・ネスティングの改善
- ヘッダー・サイドバーの共有が自然に書ける
- Route Groups で認証前後のレイアウトを分離しやすい

### 4. 将来性
- Vercel が App Router を推奨（Pages Router は保守モード）
- 新機能は App Router 優先で追加される
- 2026年時点で App Router は安定版

### 5. ストリーミング・Suspense 対応
- Streaming SSR でページの一部だけ先に表示
- `loading.tsx` でローディング状態を簡潔に実装

## 代替案と却下理由

### Pages Router
**却下理由:**
- レガシー化している（新機能追加なし）
- API Routes を別途作る必要がある
- Server Components が使えない
- 学習コストは低いが、将来性がない

### Remix
**却下理由:**
- 優れたフレームワークだが、Next.js より小規模なエコシステム
- Vercel デプロイの最適化が Next.js ほど良くない
- 学習曲線が Next.js より急

### SPA（Vite + React Router）
**却下理由:**
- SEO 対応が困難（SSR なし）
- 初期表示が遅い（クライアント側で全てレンダリング）
- Supabase との相性は良いが、パフォーマンスで劣る

## 結果・影響

### ポジティブ
- SEO 最適化が容易
- パフォーマンスが向上
- コード量削減（API Routes 不要）

### ネガティブ・制約
- Server Components / Client Components の使い分けが必要
  - `"use client"` ディレクティブの理解必須
  - useState, useEffect などは Client Components のみ
- 学習曲線がやや急（Pages Router より複雑）
- 一部のライブラリが Server Components 非対応
  - → Client Components でラップすれば解決

### 開発ルール
- デフォルトは Server Components
- インタラクティブな要素のみ Client Components
- データフェッチングは Server Components で行う
- フォーム送信は Server Actions を使う

## 参考資料

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
