# ちゅぶれびゅ！ エピック・イシュー分解

## 並行開発の原則

### ✅ DO（推奨）
- **ファイル単位で分離**: 1イシュー = 1つの新規ファイルまたは独立したファイル群
- **明確な依存関係**: 依存イシューを明記
- **段階的リリース**: Phase単位で統合テスト
- **早期統合**: 各Phase完了時にmainへマージ

### ❌ DON'T（避ける）
- 同じファイルを複数イシューで編集
- 循環依存の作成
- 巨大なイシュー（3時間以上）
- 依存関係の不明確なイシュー

---

## エピック一覧

| ID | エピック名 | 優先度 | 依存 | 期間 |
|----|----------|--------|------|------|
| E1 | プロジェクト基盤 | 🔥 最高 | なし | Week 1 |
| E2 | 認証・ユーザー管理 | 🔥 高 | E1 | Week 1-2 |
| E3 | チャンネル検索・表示 | 🔥 高 | E1, E2 | Week 2-3 |
| E4 | レビュー機能 | 中 | E2, E3 | Week 3-4 |
| E5 | マイリスト機能 | 中 | E2, E3 | Week 3-4 |
| E6 | ランキング・発見 | 低 | E3, E4 | Week 4-5 |
| E7 | デプロイ準備 | 🔥 高 | E1-E6 | Week 5-6 |

---

## Phase 1: プロジェクト基盤（Week 1）

**目標**: 並行開発の土台を整える

### E1-1: プロジェクト初期セットアップ ⏱️ 1h

**優先度**: 🔥 最高  
**依存**: なし  
**担当ファイル**: 設定ファイルのみ

**作業内容**:
- Next.js 16プロジェクト作成
- 依存関係インストール
- TypeScript設定
- ESLint/Prettier設定
- `.gitignore`設定

**成果物**:
```
tube-review/
├── package.json
├── tsconfig.json
├── next.config.ts
├── .eslintrc.json
├── .prettierrc
└── .gitignore
```

**受入基準**:
- [ ] `npm run dev`でローカル起動
- [ ] `npm run lint`でエラーなし
- [ ] TypeScript strict mode有効

---

### E1-2: 環境変数設定 ⏱️ 1h

**優先度**: 🔥 最高  
**依存**: E1-1  
**担当ファイル**: 環境変数関連のみ

**作業内容**:
- `.env.example`作成
- `.env.local`設定（gitignore済み）
- 環境変数バリデーション実装

**成果物**:
```
tube-review/
├── .env.example
├── .env.local (gitignore)
└── lib/
    └── env.ts (Zodバリデーション)
```

**受入基準**:
- [ ] 必須環境変数が未設定時にエラー
- [ ] `lib/env.ts`で型安全にアクセス可能
- [ ] `.env.example`に全変数を記載

**参照**: `docs/ENVIRONMENT_VARIABLES.md`

---

### E1-3: Supabase初期化 ⏱️ 2h

**優先度**: 🔥 最高  
**依存**: E1-2  
**担当ファイル**: Supabase設定のみ

**作業内容**:
- Supabaseプロジェクト作成
- データベーススキーマ適用
- Supabaseクライアント設定

**成果物**:
```
tube-review/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── seed.sql (開発用データ)
```

**受入基準**:
- [ ] Supabaseプロジェクト作成完了
- [ ] 全12テーブル作成完了
- [ ] RLSポリシー設定完了
- [ ] クライアント/サーバー両方で接続確認

**参照**: `docs/DATABASE_DESIGN.md`

---

### E1-4: CI/CD基本設定 ⏱️ 2h

**優先度**: 🔥 高  
**依存**: E1-1  
**担当ファイル**: GitHub Actions設定のみ

**作業内容**:
- GitHub Actionsワークフロー作成
- Vercel連携
- 基本的なCI（Lint, Type Check）

**成果物**:
```
tube-review/
└── .github/
    └── workflows/
        ├── ci.yml
        └── vercel-preview.yml
```

**受入基準**:
- [ ] PR作成時に自動CI実行
- [ ] Lint, Type Checkが通る
- [ ] VercelにPreview Deployされる

**参照**: `docs/CICD.md`

---

## Phase 2: 認証・ユーザー管理（Week 1-2）

**目標**: ログイン機能を完成させる

### E2-1: 認証基盤実装 ⏱️ 3h

**優先度**: 🔥 最高  
**依存**: E1-3  
**担当ファイル**: 認証関連のみ（**並行開発可能**）

**作業内容**:
- Supabase Auth設定
- Magic Link実装
- Middleware認証チェック

**成果物**:
```
tube-review/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   └── _actions/
│       └── auth.ts (signOut)
├── middleware.ts
└── lib/
    └── auth.ts (getUser, requireAuth)
```

**受入基準**:
- [ ] Magic Linkでログイン可能
- [ ] ログアウト機能動作
- [ ] Middleware未認証時リダイレクト
- [ ] E2Eテスト（Playwright）作成

**参照**: `docs/AUTH_FLOW.md`

---

### E2-2: Google OAuth実装 ⏱️ 2h

**優先度**: 中  
**依存**: E2-1  
**担当ファイル**: `app/(auth)/login/page.tsx`のみ（修正）

**作業内容**:
- Google OAuthプロバイダー設定
- ログインページにボタン追加

**成果物**:
- `app/(auth)/login/page.tsx`に「Googleでログイン」ボタン

**受入基準**:
- [ ] Googleでログイン可能
- [ ] 初回ログイン時にusersテーブル作成
- [ ] E2Eテスト追加

**参照**: `docs/AUTH_FLOW.md`

---

### E2-3: プロフィール表示 ⏱️ 2h

**優先度**: 低  
**依存**: E2-1  
**担当ファイル**: 新規ファイルのみ（**並行開発可能**）

**作業内容**:
- プロフィールページ作成
- アバター表示

**成果物**:
```
tube-review/
└── app/
    └── profile/
        └── page.tsx
```

**受入基準**:
- [ ] ログイン済みユーザーのプロフィール表示
- [ ] アバター、名前、メールアドレス表示
- [ ] RLSで自分のデータのみアクセス可能

---

## Phase 3: チャンネル検索・表示（Week 2-3）

**目標**: YouTubeチャンネルを検索・表示できる

### E3-1: YouTube API統合 ⏱️ 3h

**優先度**: 🔥 最高  
**依存**: E1-2, E1-3  
**担当ファイル**: YouTube API関連のみ（**並行開発可能**）

**作業内容**:
- YouTube Data API設定
- レート制限実装
- チャンネル検索API実装

**成果物**:
```
tube-review/
├── lib/
│   └── youtube/
│       ├── api.ts (検索、詳細取得)
│       ├── rate-limiter.ts (Token Bucket)
│       └── cache.ts (Supabaseキャッシュ)
└── app/
    └── _actions/
        └── youtube.ts (Server Action)
```

**受入基準**:
- [ ] チャンネル検索動作（クォータ消費）
- [ ] レート制限動作（10,000ユニット/日）
- [ ] キャッシュ機能動作（1日TTL）
- [ ] Unit Test作成（rate-limiter）

**参照**: `docs/RATE_LIMITING.md`

---

### E3-2: チャンネル検索UI ⏱️ 3h

**優先度**: 🔥 高  
**依存**: E3-1  
**担当ファイル**: 検索UI関連のみ（**並行開発可能**）

**作業内容**:
- 検索ページ作成
- 検索フォーム実装
- 検索結果表示

**成果物**:
```
tube-review/
└── app/
    ├── search/
    │   └── page.tsx
    └── _components/
        ├── search-form.tsx
        └── channel-card.tsx
```

**受入基準**:
- [ ] キーワード検索機能
- [ ] 検索結果一覧表示（カード形式）
- [ ] ローディング状態表示
- [ ] エラーハンドリング（クォータ超過等）
- [ ] E2Eテスト作成

**参照**: `docs/API_DESIGN.md`

---

### E3-3: チャンネル詳細ページ ⏱️ 3h

**優先度**: 🔥 高  
**依存**: E3-1  
**担当ファイル**: チャンネル詳細のみ（**並行開発可能**）

**作業内容**:
- 動的ルート作成
- チャンネル詳細情報表示
- 統計情報表示

**成果物**:
```
tube-review/
└── app/
    └── channels/
        └── [id]/
            ├── page.tsx
            └── loading.tsx
```

**受入基準**:
- [ ] チャンネル詳細表示（SSR）
- [ ] 登録者数、動画数、視聴回数表示
- [ ] YouTube埋め込み動画表示
- [ ] SEO最適化（メタタグ）
- [ ] Lighthouse Score 90+

**参照**: `docs/ARCHITECTURE_AND_PERFORMANCE.md`

---

## Phase 4: レビュー機能（Week 3-4）

**目標**: チャンネルにレビューを投稿できる

### E4-1: レビュー投稿機能 ⏱️ 3h

**優先度**: 🔥 高  
**依存**: E2-1, E3-3  
**担当ファイル**: レビュー関連のみ（**並行開発可能**）

**作業内容**:
- レビュー投稿フォーム作成
- Server Action実装
- バリデーション（Zod）

**成果物**:
```
tube-review/
├── app/
│   ├── _actions/
│   │   └── review.ts (createReview)
│   └── _components/
│       └── review-form.tsx
└── lib/
    └── validations/
        └── review.ts (Zodスキーマ)
```

**受入基準**:
- [ ] レビュー投稿機能動作
- [ ] 星5段階評価
- [ ] タイトル・本文入力
- [ ] ネタバレフラグ
- [ ] バリデーションエラー表示
- [ ] TDD（テスト先行）で実装
- [ ] Unit Test作成

**参照**: 
- `docs/API_DESIGN.md`
- `docs/TESTING_AND_SECURITY.md`

---

### E4-2: レビュー一覧表示 ⏱️ 2h

**優先度**: 🔥 高  
**依存**: E4-1  
**担当ファイル**: `app/channels/[id]/page.tsx`修正（**E3-3完了後**）

**作業内容**:
- チャンネル詳細ページにレビュー一覧追加
- ページネーション実装

**成果物**:
- `app/_components/review-list.tsx`
- `app/channels/[id]/page.tsx`（レビュー一覧追加）

**受入基準**:
- [ ] レビュー一覧表示（新しい順）
- [ ] ページネーション（10件/ページ）
- [ ] ネタバレは折りたたみ表示
- [ ] 自分のレビューは編集・削除ボタン表示

---

### E4-3: レビュー編集・削除 ⏱️ 2h

**優先度**: 中  
**依存**: E4-2  
**担当ファイル**: レビュー編集のみ（**並行開発可能**）

**作業内容**:
- レビュー編集フォーム
- ソフトデリート実装

**成果物**:
```
tube-review/
├── app/
│   ├── _actions/
│   │   └── review.ts (updateReview, deleteReview)
│   └── _components/
│       └── review-edit-form.tsx
└── app/
    └── reviews/
        └── [id]/
            └── edit/
                └── page.tsx
```

**受入基準**:
- [ ] 自分のレビューのみ編集可能（RLS）
- [ ] 編集フォーム動作
- [ ] ソフトデリート実装（deleted_at）
- [ ] Unit Test作成

---

### E4-4: 「参考になった」機能 ⏱️ 2h

**優先度**: 低
**依存**: E4-2
**担当ファイル**: 参考になったボタンのみ（**並行開発可能**）
**GitHub Issue**: [#56](https://github.com/shinshin4n4n/tube-review/issues/56)

**作業内容**:
- 「参考になった」ボタン実装
- review_helpfulテーブル連携
- 投票数表示
- 楽観的UI更新

**成果物**:
```
tube-review/
├── app/
│   ├── _actions/
│   │   └── review.ts (toggleHelpful)
│   └── _components/
│       └── helpful-button.tsx
```

**受入基準**:
- [ ] 「参考になった」ボタンクリックで投票
- [ ] 投票数表示
- [ ] 自分の投票状態を視覚化
- [ ] 重複投票防止（UNIQUE制約）
- [ ] ログイン必須（未ログインは誘導）
- [ ] Unit Test作成
- [ ] E2E Test作成

---

## Phase 5: マイリスト機能（Week 3-4）

**目標**: チャンネルを「見たい」「見ている」「見た」で管理

### E5-1: マイリスト追加機能 ⏱️ 3h

**優先度**: 🔥 高  
**依存**: E2-1, E3-3  
**担当ファイル**: マイリスト関連のみ（**並行開発可能**）

**作業内容**:
- マイリスト追加ボタン実装
- ステータス選択UI
- Server Action実装

**成果物**:
```
tube-review/
├── app/
│   ├── _actions/
│   │   └── user-channel.ts (addToMyList)
│   └── _components/
│       └── add-to-list-button.tsx
```

**受入基準**:
- [ ] 「見たい」「見ている」「見た」選択可能
- [ ] マイリストに追加
- [ ] 重複追加防止
- [ ] Unit Test作成

---

### E5-2: マイリスト一覧ページ ⏱️ 3h

**優先度**: 🔥 高  
**依存**: E5-1  
**担当ファイル**: マイリストページのみ（**並行開発可能**）

**作業内容**:
- マイリストページ作成
- ステータス別タブ表示

**成果物**:
```
tube-review/
└── app/
    └── my-list/
        ├── page.tsx
        └── layout.tsx
```

**受入基準**:
- [ ] 自分のマイリスト一覧表示
- [ ] 「見たい」「見ている」「見た」タブ切り替え
- [ ] ステータス変更ボタン
- [ ] ソート機能（追加日順、登録者数順）

---

### E5-3: カスタムリスト機能 ⏱️ 3h

**優先度**: 低  
**依存**: E5-2  
**担当ファイル**: カスタムリスト関連のみ（**並行開発可能**）

**作業内容**:
- リスト作成・編集機能
- リストにチャンネル追加

**成果物**:
```
tube-review/
├── app/
│   ├── _actions/
│   │   └── list.ts (createList, addChannelToList)
│   └── lists/
│       ├── page.tsx (リスト一覧)
│       ├── new/
│       │   └── page.tsx (リスト作成)
│       └── [id]/
│           └── page.tsx (リスト詳細)
```

**受入基準**:
- [ ] リスト作成（名前、説明、公開設定）
- [ ] リストにチャンネル追加
- [ ] リスト一覧表示
- [ ] リスト詳細表示

---

## Phase 6: ランキング・発見（Week 4-5）

**目標**: チャンネルを発見しやすくする

### E6-1: トップページ（ランキング） ⏱️ 3h

**優先度**: 中  
**依存**: E4-2  
**担当ファイル**: トップページのみ（**並行開発可能**）

**作業内容**:
- トップページ作成
- 人気チャンネルランキング表示

**成果物**:
```
tube-review/
└── app/
    └── page.tsx
```

**受入基準**:
- [ ] 「今週の人気」ランキング表示（ISR 10分）
- [ ] 「新着レビュー」表示
- [ ] Materialized View活用
- [ ] Lighthouse Score 90+

**参照**: `docs/ARCHITECTURE_AND_PERFORMANCE.md`

---

### E6-2: カテゴリー分類 ⏱️ 2h

**優先度**: 低  
**依存**: E3-3  
**担当ファイル**: カテゴリーページのみ（**並行開発可能**）

**作業内容**:
- カテゴリー一覧ページ
- カテゴリー別チャンネル一覧

**成果物**:
```
tube-review/
└── app/
    └── categories/
        ├── page.tsx (カテゴリー一覧)
        └── [slug]/
            └── page.tsx (カテゴリー詳細)
```

**受入基準**:
- [ ] カテゴリー一覧表示
- [ ] カテゴリー別チャンネル一覧
- [ ] SEO最適化

---

## Phase 7: デプロイ準備（Week 5-6）

**目標**: 本番環境にデプロイし、安全・高速・発見されやすいサービスを提供

### E7-1: CI/CD基本設定 ⏱️ 2h

**優先度**: 🔥 高
**依存**: E1-1
**担当ファイル**: GitHub Actions設定のみ（**並行開発可能**）
**GitHub Issue**: [#57](https://github.com/shinshin4n4n/tube-review/issues/57)

**作業内容**:
- GitHub Actionsワークフロー作成
- Vercel連携設定
- CI実行（Lint, Type Check, Test, Build）
- 自動デプロイ設定

**成果物**:
```
tube-review/
└── .github/
    └── workflows/
        ├── ci.yml
        └── e2e.yml (オプション)
```

**受入基準**:
- [ ] GitHub Actionsワークフロー作成完了
- [ ] PR作成時にCI自動実行
- [ ] Lint, Type Check, Test, Buildが全てパス
- [ ] Vercel Preview Deploy動作
- [ ] mainマージでProduction Deploy
- [ ] CI実行時間5分以内
- [ ] ドキュメント作成（.github/workflows/README.md）

**参照**:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment](https://vercel.com/docs)

---

### E7-2: 本番環境設定 ⏱️ 3h

**優先度**: 🔥 高
**依存**: E7-1
**担当ファイル**: 環境設定のみ（**並行開発可能**）
**GitHub Issue**: [#58](https://github.com/shinshin4n4n/tube-review/issues/58)

**作業内容**:
- 本番用Supabaseプロジェクト作成
- マイグレーション実行
- YouTube API本番キー作成
- Vercel環境変数設定

**成果物**:
```
tube-review/
├── docs/
│   ├── DEPLOYMENT.md
│   └── ENVIRONMENT_SETUP.md
└── .env.example (更新)
```

**受入基準**:
- [ ] 本番用Supabaseプロジェクト作成完了
- [ ] 全マイグレーション実行完了
- [ ] RLSポリシー動作確認
- [ ] Storage設定完了
- [ ] YouTube API本番キー作成・設定
- [ ] Vercel環境変数設定完了
- [ ] デプロイ成功確認
- [ ] デプロイ手順書作成

**参照**:
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- `docs/ENVIRONMENT_VARIABLES.md`

---

### E7-3: エラーハンドリング強化 ⏱️ 2h

**優先度**: 中
**依存**: E7-1
**担当ファイル**: エラーページのみ（**並行開発可能**）
**GitHub Issue**: [#59](https://github.com/shinshin4n4n/tube-review/issues/59)

**作業内容**:
- エラーページ作成（404, 500）
- エラーログ設定
- Vercel Analytics連携

**成果物**:
```
tube-review/
├── app/
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── search/error.tsx
│   ├── channels/[id]/error.tsx
│   └── profile/error.tsx
└── lib/
    └── logger.ts
```

**受入基準**:
- [ ] 404ページ実装完了
- [ ] グローバルエラーページ実装完了
- [ ] 主要ページ個別エラーページ実装
- [ ] エラーログ実装完了
- [ ] Vercel Analytics連携
- [ ] エラーハンドリング方針ドキュメント作成

**参照**:
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

---

### E7-4: SEO対応 ⏱️ 3h

**優先度**: 中
**依存**: E6-1, E3-3
**担当ファイル**: SEO関連のみ（**並行開発可能**）
**GitHub Issue**: [#60](https://github.com/shinshin4n4n/tube-review/issues/60)

**作業内容**:
- メタタグ設定（Metadata API）
- OGP設定
- sitemap.xml作成
- robots.txt作成
- OG画像作成

**成果物**:
```
tube-review/
├── app/
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── opengraph-image.tsx
│   ├── layout.tsx (metadata追加)
│   └── channels/[id]/
│       ├── page.tsx (metadata追加)
│       └── opengraph-image.tsx
└── public/
    └── og-image.png
```

**受入基準**:
- [ ] グローバルメタデータ設定完了
- [ ] 動的ページメタデータ設定完了
- [ ] OGP設定完了
- [ ] sitemap.xml生成完了
- [ ] robots.txt設定完了
- [ ] OG画像作成完了
- [ ] Lighthouse SEOスコア 90+
- [ ] Google Search Console登録

**参照**:
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)

---

### E7-5: パフォーマンス最適化 ⏱️ 3h

**優先度**: 中
**依存**: E7-1
**担当ファイル**: 最適化関連（**並行開発可能**）
**GitHub Issue**: [#61](https://github.com/shinshin4n4n/tube-review/issues/61)

**作業内容**:
- 画像最適化（Next.js Image）
- バンドルサイズ削減
- キャッシュ戦略最適化
- Core Web Vitals改善

**成果物**:
```
tube-review/
├── next.config.ts (最適化設定)
├── scripts/
│   └── analyze-bundle.js
├── docs/
│   └── PERFORMANCE.md
└── app/_components/*.tsx (Image最適化)
```

**受入基準**:
- [ ] 全画像がNext.js Imageコンポーネント
- [ ] Bundle Analyzer実行完了
- [ ] 動的インポート適用
- [ ] Lighthouse Performance 90+
- [ ] Core Web Vitals全て合格
- [ ] First Load JS < 200KB
- [ ] パフォーマンス最適化ガイド作成

**参照**:
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- `docs/ARCHITECTURE_AND_PERFORMANCE.md`

---

### E7-6: セキュリティ監査 ⏱️ 3h

**優先度**: 🔥 高
**依存**: E7-2
**担当ファイル**: セキュリティ設定のみ（**並行開発可能**）
**GitHub Issue**: [#62](https://github.com/shinshin4n4n/tube-review/issues/62)

**作業内容**:
- RLSポリシー全件確認
- セキュリティヘッダー設定
- 脆弱性スキャン
- セキュリティ監査レポート作成

**成果物**:
```
tube-review/
├── next.config.ts (セキュリティヘッダー)
├── middleware.ts (確認)
└── docs/
    ├── SECURITY.md
    └── SECURITY_AUDIT.md
```

**受入基準**:
- [ ] 全テーブルのRLSポリシー確認完了
- [ ] セキュリティヘッダー全て設定
- [ ] npm audit実行（Critical/High: 0）
- [ ] 手動セキュリティテスト完了
- [ ] 他人のデータにアクセスできないことを確認
- [ ] セキュリティポリシー作成
- [ ] 監査レポート作成

**参照**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- `docs/TESTING_AND_SECURITY.md`

---

### E7-7: デプロイドキュメント整備 ⏱️ 2h

**優先度**: 中
**依存**: E7-1～E7-6
**担当ファイル**: ドキュメントのみ（**並行開発可能**）
**GitHub Issue**: [#63](https://github.com/shinshin4n4n/tube-review/issues/63)

**作業内容**:
- README.md更新
- デプロイ手順書作成
- 運用マニュアル作成
- トラブルシューティングガイド作成

**成果物**:
```
tube-review/
├── README.md (更新)
└── docs/
    ├── DEPLOYMENT.md (更新)
    ├── OPERATION.md
    ├── TROUBLESHOOTING.md
    ├── CONTRIBUTING.md
    └── CHANGELOG.md
```

**受入基準**:
- [ ] README.md更新完了
- [ ] DEPLOYMENT.md作成完了
- [ ] OPERATION.md作成完了
- [ ] TROUBLESHOOTING.md作成完了
- [ ] CONTRIBUTING.md作成完了
- [ ] CHANGELOG.md作成完了
- [ ] リンク切れチェック完了
- [ ] ドキュメント通りにセットアップ可能

**参照**:
- [Make a README](https://www.makeareadme.com/)
- [Keep a Changelog](https://keepachangelog.com/)

---

## 並行開発スケジュール例

### Week 1

| メンバー | 月 | 火 | 水 | 木 | 金 |
|---------|---|---|---|---|---|
| あなた | E1-1,2 | E1-3 | E1-4 | E2-1 | E2-2 |

### Week 2（並行開発開始）

| メンバー | 月 | 火 | 水 | 木 | 金 |
|---------|---|---|---|---|---|
| あなた | E3-1 | E3-2 | E3-3 | E4-1 | 統合 |
| （将来）| E2-3 | - | - | E5-1 | テスト |

### Week 3-4

| メンバー | 月 | 火 | 水 | 木 | 金 |
|---------|---|---|---|---|---|
| あなた | E4-2,3 | E4-4 | E5-2 | E5-3 | 統合 |

### Week 5-6（デプロイ準備）

| メンバー | 月 | 火 | 水 | 木 | 金 |
|---------|---|---|---|---|---|
| あなた | E7-1,2 | E7-3,4 | E7-5,6 | E7-7 | 🚀デプロイ |

---

## ファイル競合マトリックス

### ✅ 並行開発可能（ファイル競合なし）

| イシュー | イシュー | 競合 |
|---------|---------|------|
| E2-1 認証基盤 | E3-1 YouTube API | ✅ なし |
| E2-1 認証基盤 | E7-1 CI/CD | ✅ なし |
| E3-1 YouTube API | E4-1 レビュー投稿 | ✅ なし |
| E4-1 レビュー投稿 | E5-1 マイリスト追加 | ✅ なし |
| E7-1 CI/CD | E7-3 エラーハンドリング | ✅ なし |
| E7-3 エラーハンドリング | E7-4 SEO対応 | ✅ なし |
| E7-4 SEO対応 | E7-5 パフォーマンス | ✅ なし |

### ⚠️ 並行開発不可（ファイル競合あり）

| イシュー | イシュー | 競合ファイル |
|---------|---------|-------------|
| E3-3 チャンネル詳細 | E4-2 レビュー一覧 | `app/channels/[id]/page.tsx` |
| E2-1 Magic Link | E2-2 Google OAuth | `app/(auth)/login/page.tsx` |

**解決策**: 依存関係を設定し、順次実施

---

## GitHub Projects ラベル

```
優先度:
- 🔴 priority-critical: 優先度: Critical（緊急・最優先）
- 🔥 priority-high: 優先度: 高
- 🟡 priority-medium: 優先度: 中
- 🟢 priority-low: 優先度: 低

種類:
- feature: 新機能
- enhancement: 既存機能の改善
- bug: バグ修正
- documentation: ドキュメント

サイズ:
- XS: ~1時間
- S: 1-2時間
- M: 2-3時間
- L: 3-5時間

Phase/Epic（既存）:
- phase-1, phase-2, phase-3, phase-7
- epic-1, epic-2, epic-3, epic-4, epic-5, epic-6, epic-7

その他:
- ui: UI/UX
- design: デザイン
- auth: 認証
- database: データベース
```

---

## イシューテンプレート

```markdown
## 📋 概要
（何を実装するか、なぜ必要か）

## 🎯 目的
（このイシューで達成したいこと）

## 📐 設計
### データフロー
（データの流れ）

### UI設計
（画面イメージ、Figma等）

## 🔒 セキュリティ要件
- [ ] 認証チェック実装
- [ ] バリデーション実装（Zod）
- [ ] RLSポリシー確認
- [ ] XSS対策

## ⚡ パフォーマンス要件
- [ ] レンダリング戦略決定（SSG/ISR/SSR/CSR）
- [ ] キャッシュ戦略決定
- [ ] Lighthouse Score 90+

## 🧪 テスト要件
- [ ] Unit Test作成（カバレッジ80%+）
- [ ] E2E Test作成（クリティカルパス）
- [ ] TDDで実装（RED-GREEN-REFACTOR）

## 📦 成果物
- `path/to/file1.ts`
- `path/to/file2.tsx`

## ✅ 受入基準
- [ ] 機能要件1
- [ ] 機能要件2
- [ ] テスト完了
- [ ] レビュー承認

## 🔗 依存イシュー
- Blocked by: #XX
- Blocks: #XX

## 📚 参考資料
- `docs/API_DESIGN.md`
- `docs/TESTING_AND_SECURITY.md`
```

---

## 次のアクション

### Phase 1-6完了後（現在地）

✅ **完了したPhase**:
- Phase 1: プロジェクト基盤
- Phase 2: 認証・ユーザー管理
- Phase 3: チャンネル検索・表示
- Phase 4: レビュー機能（E4-4を除く）
- Phase 5: マイリスト機能
- Phase 6: ランキング・発見

📋 **次に取り組むべきイシュー**:

1. **E4-4: 「参考になった」機能** (#56)
   - Phase 4の残り機能
   - 優先度: 低
   - 見積もり: 2時間

2. **Phase 7: デプロイ準備** (#57-#63)
   - E7-1: CI/CD基本設定 (#57) - 優先度: 高
   - E7-2: 本番環境設定 (#58) - 優先度: 高
   - E7-3: エラーハンドリング強化 (#59)
   - E7-4: SEO対応 (#60)
   - E7-5: パフォーマンス最適化 (#61)
   - E7-6: セキュリティ監査 (#62) - 優先度: 高
   - E7-7: デプロイドキュメント整備 (#63)

### 推奨実装順序

```
Week 5:
月: E4-4, E7-1 (CI/CD基本設定)
火: E7-2 (本番環境設定)
水: E7-6 (セキュリティ監査)
木: E7-3 (エラーハンドリング), E7-4 (SEO対応)
金: E7-5 (パフォーマンス最適化)

Week 6:
月: E7-7 (ドキュメント整備)
火: 最終テスト・統合
水: 🚀 本番デプロイ
```

### 実装開始例

```bash
# E4-4: 「参考になった」機能
git checkout -b feature/E4-4-helpful-button
# 実装...
git commit -m "feat(E4-4): 「参考になった」ボタン実装

- HelpfulButtonコンポーネント作成
- toggleHelpful Server Action実装
- 重複投票防止
- Unit Test追加

Closes #56"

# E7-1: CI/CD設定
git checkout -b feature/E7-1-ci-cd-setup
# 実装...
git commit -m "feat(E7-1): CI/CD基本設定

- GitHub Actionsワークフロー追加
- Vercel連携設定
- 自動テスト・デプロイ設定

Closes #57"
```

---

🚀 **デプロイに向けて、準備を始めましょう！**
