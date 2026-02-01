# TubeReview テスト & セキュリティ設計

## 参照Skills（推奨構成）

TubeReviewでは、**Obra Superpowers**と**Anthropic公式**の両方のSkillsを活用します。  
詳細な比較は [`docs/SKILLS_COMPARISON.md`](./SKILLS_COMPARISON.md) を参照。

### テスト関連Skills

#### 1. Unit/Integration Test: `test-driven-development`
- **提供元**: Obra Superpowers  
- **URL**: https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md
- **適用タイミング**: 全ての機能実装・バグ修正時
- **コア原則**: 
  - テストを先に書く（RED）
  - 最小限のコードで通す（GREEN）
  - リファクタリング（REFACTOR）
  - **「テストが失敗するのを見なければ、正しいテストかどうか分からない」**
- **特徴**: 
  - 厳格なTDD思想（テスト前のコードは削除）
  - 例外なし：新機能、バグ修正、リファクタリング全てにTDD適用

#### 2. E2E Test: `webapp-testing`
- **提供元**: Anthropic公式  
- **URL**: https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md
- **適用タイミング**: E2Eテスト自動化
- **コア原則**:
  - Playwright E2Eテストに特化
  - 静的HTML vs 動的Webappの自動判定
  - サーバー起動・停止の自動化
- **特徴**: 
  - 本番実績あり（Claude.aiでも使用の可能性）
  - Playwrightスクリプト生成が得意

### セキュリティ関連Skills

#### Defense-in-Depth (多層防御)
- **提供元**: Obra Superpowers  
- **URL**: https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/defense-in-depth.md
- **適用タイミング**: セキュリティ実装時、バグ修正後の再発防止
- **コア原則**:
  - 単一の防御層に依存しない
  - 複数のレイヤーでバリデーション
  - 各層で異なる検証を行う
- **特徴**: 
  - 具体的な実装パターンを提示
  - デバッグ時の検証ポイントが明確

---

## テスト戦略（TDD + E2E）

### テストピラミッド

```
        /\
       /E2E\       ← 少（webapp-testing skill）
      /------\
     /Integration\ ← 中（test-driven-development skill）
    /------------\
   /    Unit      \ ← 多（test-driven-development skill）
  /----------------\
```

### Skills適用マッピング

| テストレベル | 使用Skill | ツール | カバレッジ目標 |
|-------------|-----------|--------|---------------|
| Unit | `test-driven-development` | Vitest | 80%以上 |
| Integration | `test-driven-development` | Vitest + Testing Library | 中程度 |
| E2E | `webapp-testing` | Playwright | クリティカルパスのみ |

---

### 1. Unit Test（80%以上）- TDD Skill

**使用Skill**: `test-driven-development` (Obra Superpowers)  
**ツール**: Vitest  
**対象**: ビジネスロジック、バリデーション、ユーティリティ

**TDDサイクル（RED-GREEN-REFACTOR）**:
```typescript
// バリデーション関数のテスト
describe('validateReview', () => {
  // RED: まずテストを書く
  it('should reject review with rating < 1', () => {
    expect(() => validateReview({ rating: 0, content: 'test' }))
      .toThrow('Rating must be between 1 and 5');
  });
  
  // GREEN: 最小限の実装
  // REFACTOR: リファクタリング
});
```

### 2. Integration Test（中程度）

**ツール**: Vitest + Testing Library  
**対象**: Server Actions、コンポーネント

**例**:
```typescript
// Server Actionのテスト
describe('createReview', () => {
  it('should create review with valid data', async () => {
    // Arrange
    const validData = { channelId: 'xxx', rating: 5, content: 'Great!' };
    
    // Act
    const result = await createReview(validData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ rating: 5 });
  });
  
  it('should reject duplicate review from same user', async () => {
    // ... 異常系のテスト
  });
});
```

### 3. E2E Test（最小限）- webapp-testing Skill

**使用Skill**: `webapp-testing` (Anthropic公式)  
**ツール**: Playwright  
**対象**: クリティカルユーザーフロー

**webapp-testing skillのワークフロー**:
```
User task → Is it static HTML?
├─ Yes → Read HTML file directly to identify selectors
│   ├─ Success → Write Playwright script using selectors
│   └─ Fails/Incomplete → Treat as dynamic (below)
│
└─ No (dynamic webapp) → Is the server already running?
    ├─ No → Run: python scripts/with_server.py --help
    │       Then use the helper + write simplified Playwright script
    └─ Yes → Reconnaissance-then-action:
            1. Visit page
            2. Identify selectors
            3. Write Playwright script
```

**クリティカルパス**:
1. ユーザー登録 → ログイン
2. チャンネル検索 → 詳細閲覧
3. レビュー投稿 → マイリスト追加

---

## セキュリティ設計（Defense-in-Depth）

### 多層防御の原則

各セキュリティ機能は**3層以上**の防御を持つ：

```
┌─────────────────────────────────┐
│ Layer 1: クライアント側検証      │ ← UX向上（軽量）
├─────────────────────────────────┤
│ Layer 2: サーバー側バリデーション│ ← 必須（Zod）
├─────────────────────────────────┤
│ Layer 3: データベース制約        │ ← 最終防衛線（NOT NULL, CHECK）
├─────────────────────────────────┤
│ Layer 4: Row Level Security (RLS)│ ← アクセス制御
└─────────────────────────────────┘
```

### 実装例: レビュー投稿

#### Layer 1: クライアント側（React Hook Form）
```typescript
const schema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10).max(5000)
});

// フロントエンドでリアルタイムバリデーション
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

#### Layer 2: Server Action（Zod）
```typescript
'use server';

export async function createReview(formData: FormData) {
  // 再度サーバー側でバリデーション
  const validated = reviewSchema.parse({
    rating: Number(formData.get('rating')),
    content: formData.get('content')
  });
  
  // 認証チェック
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  
  // サニタイゼーション（XSS対策）
  const sanitized = DOMPurify.sanitize(validated.content);
  
  // DB操作
  return await supabase.from('reviews').insert({
    user_id: user.id,
    channel_id: validated.channelId,
    rating: validated.rating,
    content: sanitized
  });
}
```

#### Layer 3: データベース制約
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  channel_id UUID NOT NULL REFERENCES channels(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 10 AND 5000),
  UNIQUE(user_id, channel_id) -- 重複防止
);
```

#### Layer 4: Row Level Security
```sql
-- 自分のレビューのみ編集可能
CREATE POLICY reviews_update_own ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- 削除されていないレビューのみ閲覧可能
CREATE POLICY reviews_select_active ON reviews
  FOR SELECT USING (deleted_at IS NULL);
```

---

## OWASP Top 10 対策マトリックス

| 脅威 | 対策Layer1 | 対策Layer2 | 対策Layer3 | 対策Layer4 |
|------|-----------|-----------|-----------|-----------|
| **1. インジェクション** | Zod検証 | Supabase Client | Prepared Statement | RLS |
| **2. 認証の不備** | UI制限 | Supabase Auth | Session管理 | httpOnly Cookie |
| **3. 機密データ露出** | 環境変数 | .env.local | Secrets Manager | HTTPS強制 |
| **4. XXE** | JSON使用 | XML禁止 | - | - |
| **5. アクセス制御** | UI権限 | Server Action認証 | DB制約 | RLS |
| **6. セキュリティ設定ミス** | ESLint | Security Headers | Vercel設定 | - |
| **7. XSS** | React自動エスケープ | DOMPurify | CSP Header | - |
| **8. デシリアライゼーション** | 型検証 | JSON.parse + Zod | - | - |
| **9. 既知の脆弱性** | npm audit | Dependabot | - | - |
| **10. ロギング不足** | エラー境界 | Sentry | Vercel Analytics | - |

---

## パフォーマンス設計

### レンダリング戦略（Next.js App Router）

| ページ種別 | 戦略 | 理由 | キャッシュ |
|-----------|------|------|-----------|
| トップページ | SSG | SEO重要、更新頻度低 | 1時間 |
| チャンネル詳細 | SSR | SEO重要、動的 | なし |
| ランキング | ISR | SEO必要、定期更新 | 10分 |
| マイリスト | CSR | 認証必須、SEO不要 | SWR |
| レビュー投稿 | CSR | インタラクティブ | なし |

### キャッシュ戦略（4層）

```
CDN (Vercel Edge) ← 静的アセット（永続）
     ↓
SWR (Client) ← APIレスポンス（5分）
     ↓
Supabase ← チャンネル情報（1日）
     ↓
YouTube API ← 元データ（週1回）
```

### パフォーマンス目標

**Core Web Vitals**:
- LCP (Largest Contentful Paint): < 2.5秒
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**バンドルサイズ**:
- 初期JS: < 200KB (gzip)
- ページごとの増分: < 50KB

**データフェッチング**:
- API応答: < 500ms (p95)
- DBクエリ: < 100ms (p95)

---

## アーキテクチャ設計

### ディレクトリ構造

```
app/
├── (auth)/              # 認証関連ページ
│   ├── login/
│   └── register/
├── (marketing)/         # 公開ページ（SEO重視）
│   ├── page.tsx        # トップページ（SSG）
│   ├── channels/
│   │   └── [id]/page.tsx  # チャンネル詳細（SSR）
│   └── ranking/page.tsx   # ランキング（ISR）
├── (dashboard)/         # ログイン後（CSR）
│   ├── my-list/
│   └── settings/
├── _actions/            # Server Actions
│   ├── channel.ts
│   ├── review.ts
│   └── user.ts
├── _components/         # 共通コンポーネント
│   ├── ui/             # shadcn/ui
│   ├── channel-card.tsx
│   └── review-card.tsx
└── _lib/                # ユーティリティ
    ├── supabase/
    ├── youtube/
    ├── validation/     # Zodスキーマ
    └── utils/
```

### データフロー

```
User Action
    ↓
Client Component ("use client")
    ↓
Server Action (app/_actions/)
    ↓
Validation (Zod)
    ↓
Supabase Client (RLS適用)
    ↓
PostgreSQL (制約チェック)
    ↓
Response
    ↓
SWR Revalidation
    ↓
UI Update
```

---

## イシュー作成時のチェックリスト

### ✅ テスト要件（TDD準拠）
- [ ] テストを先に書く（RED-GREEN-REFACTOR）
- [ ] Unit Test追加（カバレッジ80%以上）
- [ ] Integration Test追加（Server Actions）
- [ ] E2E Test追加（クリティカルパスのみ）
- [ ] 異常系のテストケース追加

### ✅ セキュリティ要件（Defense-in-Depth）
- [ ] Layer 1: クライアント側検証実装
- [ ] Layer 2: サーバー側バリデーション（Zod）
- [ ] Layer 3: データベース制約設定
- [ ] Layer 4: RLSポリシー実装
- [ ] XSS対策確認（DOMPurify）
- [ ] CSRF対策確認（Next.js標準）

### ✅ パフォーマンス要件
- [ ] レンダリング戦略決定（SSG/SSR/ISR/CSR）
- [ ] キャッシュ戦略実装
- [ ] 画像最適化（Next/Image）
- [ ] バンドルサイズ確認（< 50KB増加）
- [ ] Core Web Vitals計測

### ✅ アクセシビリティ要件
- [ ] キーボード操作対応
- [ ] ARIA属性設定
- [ ] カラーコントラスト確認（4.5:1以上）
- [ ] スクリーンリーダーテスト

---

## 参考資料

### 公式ドキュメント
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

### セキュリティガイドライン
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### 採用Skills
- [Obra Superpowers - test-driven-development](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md)
- [Obra Superpowers - defense-in-depth](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/defense-in-depth.md)
- [Anthropic公式 - webapp-testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)
- [Skills比較ドキュメント](./SKILLS_COMPARISON.md)
