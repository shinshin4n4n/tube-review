# ステージング環境構築ガイド

TubeReview プロジェクトのステージング環境構築オプションと推奨構成をまとめたドキュメントです。

## 📋 目次

- [概要](#概要)
- [理想形: Vercel Preview + Supabase Branching](#理想形-vercel-preview--supabase-branching)
- [Supabase Branching の制約](#supabase-branching-の制約)
- [代替案](#代替案)
- [推奨構成](#推奨構成)
- [実装手順](#実装手順)
- [比較表](#比較表)

---

## 🎯 概要

### 現在の構成

- **Production**: Vercel + Supabase（本番環境）
- **Preview**: Vercel Preview Deployment（PR毎に作成）
- **Development**: localhost + Supabase または Docker

### 課題

Vercel Preview と Supabase を組み合わせた場合、**全てのPreview環境が同じ本番データベースを参照**してしまいます。

### あるべき姿

**Vercel Preview + Supabase Branching** を組み合わせて、PR毎に独立したデータベース環境を提供することが理想です。

---

## 💎 理想形: Vercel Preview + Supabase Branching

### 構成図

```
┌─────────────────────────────────────┐
│ GitHub PR #123                      │
├─────────────────────────────────────┤
│ Vercel Preview Deployment           │
│ https://tube-review-pr123.vercel.app│
│         ↓                           │
│ Supabase Preview Branch (auto)      │
│ - スキーマコピー                      │
│ - 独立したデータ環境                  │
│ - PR Close で自動削除                │
└─────────────────────────────────────┘
```

### メリット

- ✅ PR毎に完全に独立した環境
- ✅ 本番データへの影響ゼロ
- ✅ マイグレーションテストが安全
- ✅ 複数PRの並行開発が可能

---

## 🚫 Supabase Branching の制約

### 料金プラン

Supabase Branching は **Pro Plan 以上が必要**です。

| プラン         | 月額              | Branching   |
| -------------- | ----------------- | ----------- |
| **Free**       | $0                | ❌ 利用不可 |
| **Pro**        | $25/月 + 従量課金 | ✅ 利用可能 |
| **Team**       | $599/月           | ✅ 利用可能 |
| **Enterprise** | カスタム          | ✅ 利用可能 |

### 従量課金の詳細

- **Preview Branch 自体**: 固定料金なし
- **Micro Compute**: $0.01344/時間から
- **ディスク/ネットワーク/ストレージ**: 使用量に応じて課金
- ⚠️ **Spend Cap の対象外**（予算超過の可能性あり）

**月額コスト見積もり:**

- Pro Plan基本料金: $25
- Preview Branch稼働コスト: ~$5-15（稼働時間次第）
- **合計: $30-40/月**

### 機能的制約

- **スキーマのみコピー**（データはコピーされない）
- データは `supabase/seed.sql` で手動注入が必要
- Pro Plan の $10 クレジットは**ブランチには適用されない**

---

## 🆓 代替案

### 1. Neon（最もおすすめの無料代替）

[Neon](https://neon.tech/) は**無料でデータベースブランチングが使える**PostgreSQLサービスです。

#### 特徴

- ✅ **Free Tier でブランチング機能込み**
- ✅ データも含めて完全コピー（Copy-on-Write）
- ✅ Scale-to-Zero（使わない時は自動停止）
- ✅ Vercel との公式連携あり
- ✅ 0.5GB ストレージ無料

#### TubeReview での活用方法

```
┌─────────────────────┐
│ Vercel Preview      │ → Neon Preview Branch (auto-created)
├─────────────────────┤
│ Vercel Production   │ → Neon Main Branch
├─────────────────────┤
│ Auth & Storage      │ → Supabase Auth + Storage（無料）
└─────────────────────┘
```

**構成のポイント:**

- **Database**: Neon（ブランチング対応）
- **Auth**: Supabase Auth（無料で継続利用）
- **Storage**: Supabase Storage または Cloudflare R2

#### 移行の影響

- Supabase SDK は PostgreSQL 互換なので**コード変更は最小限**
- Auth と Storage は Supabase のまま継続可能
- 環境変数の変更のみで移行可能

---

### 2. Supabase 別プロジェクト方式（現実的な無料運用）

Supabase Free Tier は **2プロジェクトまで無料** です。

#### 構成

```
┌─────────────────────┐
│ Vercel Preview      │ → Supabase Project 2 (Staging)
├─────────────────────┤
│ Vercel Production   │ → Supabase Project 1 (Production)
├─────────────────────┤
│ Local Development   │ → Docker Supabase (localhost)
└─────────────────────┘
```

#### メリット

- ✅ **完全無料**
- ✅ Production と Staging が完全分離
- ✅ 既存構成をそのまま利用可能
- ✅ Auth/Storage も完全分離

#### デメリット

- ❌ **PR毎のブランチは作れない**（全PRが同じStaging環境を共有）
- ❌ データ同期は手動
- ⚠️ 7日間アクセスなしで自動停止（定期的にアクセスが必要）

#### 環境変数設定例

```bash
# Vercel Environment Variables

# Preview 環境
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-role-key

# Production 環境
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
```

---

### 3. Xata（PII マスキング重視）

[Xata](https://xata.io/) は本番データを自動マスキングしてブランチを作成できます。

#### 特徴

- ブランチング機能あり（Free Trial）
- **本番データを自動マスキング**（PII保護）
- PostgreSQL 互換

#### 適用シーン

- 個人情報を含む本番データでテストする必要がある場合
- GDPR/CCPA などのコンプライアンス要件がある場合

---

### 4. ローカル Supabase（完全無料、開発専用）

Docker Compose でローカルに Supabase 環境を起動します。

#### 構成

```bash
# ローカルで Supabase 起動
supabase start

# Vercel Preview → 本番 Supabase
# ローカル開発 → ローカル Supabase
```

#### メリット

- ✅ 完全無料
- ✅ マイグレーションテストが簡単
- ✅ オフライン開発可能

#### デメリット

- ❌ **Vercel Preview では使えない**（ローカルのみ）
- ❌ CI/CD でのテストに不向き

---

## 🎯 推奨構成

### パターンA: **完全無料運用**（推奨）

**Supabase 別プロジェクト方式**

```
環境        → データベース
─────────────────────────────────
Production  → Supabase Project 1
Preview     → Supabase Project 2 (Staging)
Local       → Docker Supabase
```

**対象:**

- 個人開発・小規模チーム
- コスト最優先
- 並行PR開発が少ない

**実装難易度:** ⭐️ (低)

---

### パターンB: **バランス型**（将来的に推奨）

**Neon + Supabase Auth/Storage**

```
環境        → Database → Auth/Storage
─────────────────────────────────────────
Production  → Neon Main → Supabase
Preview     → Neon Branch → Supabase
Local       → Neon Dev → Supabase
```

**対象:**

- 無料でブランチングを試したい
- PR毎に独立環境が必要
- データも含めてテスト環境を作りたい

**実装難易度:** ⭐️⭐️ (中)

---

### パターンC: **本格運用**

**Supabase Pro + Branching**

```
環境        → データベース
─────────────────────────────────
Production  → Supabase Main
Preview     → Supabase Branch (auto)
Local       → Docker Supabase
```

**対象:**

- チーム開発・本番運用
- 予算がある（$30-40/月）
- Supabase エコシステムを完全活用

**実装難易度:** ⭐️ (低)

---

## 🛠️ 実装手順

### パターンA: Supabase 別プロジェクト方式

#### 1. Staging プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. **New Project** をクリック
3. プロジェクト名: `tube-review-staging`
4. パスワード設定・リージョン選択（本番と同じ推奨）

#### 2. マイグレーション適用

```bash
# Supabase CLI で Staging にマイグレーション適用
supabase db push --project-ref <staging-project-ref>
```

または、Supabase Dashboard でマイグレーションファイルを手動実行:

1. SQL Editor を開く
2. `supabase/migrations/*.sql` の内容を順番に実行

#### 3. シードデータ投入（オプション）

```bash
# seed.sql を実行
supabase db reset --project-ref <staging-project-ref>
```

#### 4. Vercel 環境変数設定

**Vercel Dashboard > Settings > Environment Variables**

| 変数名                          | Production | Preview         |
| ------------------------------- | ---------- | --------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | 本番URL    | Staging URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番Key    | Staging Key     |
| `SUPABASE_SERVICE_ROLE_KEY`     | 本番Key    | Staging Key     |
| `YOUTUBE_API_KEY`               | 本番Key    | 本番Key（共通） |

#### 5. デプロイ確認

```bash
# PR作成してPreview環境を確認
git checkout -b test-staging-env
git commit --allow-empty -m "test: Verify staging environment"
git push origin test-staging-env

# Preview URLにアクセスして動作確認
# → Staging Supabase に接続されているか確認
```

---

### パターンB: Neon 移行（将来的実装）

#### 1. Neon アカウント作成

1. [Neon Console](https://console.neon.tech/) にアクセス
2. GitHub アカウントでサインアップ
3. プロジェクト作成: `tube-review`

#### 2. データベーススキーマ移行

```bash
# Supabase からスキーマをエクスポート
pg_dump -h <supabase-host> -U postgres -s -d postgres > schema.sql

# Neon にインポート
psql <neon-connection-string> < schema.sql
```

#### 3. Vercel + Neon 連携

Vercel Dashboard で:

1. **Integrations** > **Neon** をインストール
2. プロジェクトを選択
3. 自動的に環境変数が設定される

#### 4. コード変更（最小限）

```typescript
// lib/supabase/server.ts
// DATABASE_URL のみ変更（Auth/Storageは既存のSupabase URL）
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // Auth/Storage用（変更なし）
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: "public",
    },
    // データベース接続のみNeonに切り替え
    global: {
      fetch: (...args) => fetch(...args),
    },
  }
);
```

**注意:** Supabase SDK は PostgreSQL 標準なので、基本的に互換性があります。

---

## 📊 比較表

| 方式                   | 初期コスト | 月額コスト  | PR毎ブランチ | データコピー    | 実装難易度 | 推奨度     |
| ---------------------- | ---------- | ----------- | ------------ | --------------- | ---------- | ---------- |
| **Supabase Branching** | $0         | $30-40      | ✅ 自動      | ❌ スキーマのみ | 低         | ⭐️⭐️       |
| **Neon**               | $0         | $0          | ✅ 自動      | ✅ あり         | 中         | ⭐️⭐️⭐️⭐️   |
| **別プロジェクト**     | $0         | $0          | ❌ 共有      | ❌ 手動         | 低         | ⭐️⭐️⭐️⭐️⭐️ |
| **ローカル Supabase**  | $0         | $0          | ❌ なし      | ✅ あり         | 高         | ⭐️⭐️       |
| **Xata**               | $0         | Trial後有料 | ✅ 自動      | ✅ あり         | 中         | ⭐️⭐️⭐️     |

### 推奨順位

1. **Supabase 別プロジェクト**（今すぐ実装可能、完全無料）
2. **Neon**（将来的に検討、PR毎ブランチが必要になったら）
3. **Supabase Branching**（予算が確保できたら）

---

## 🔄 今後の方針

### フェーズ1（現在）: **Supabase 別プロジェクト**

- コスト: $0
- 実装: 即座
- 対応: 基本的なステージング環境

### フェーズ2（成長期）: **Neon 移行検討**

- PR毎のブランチが必要になったタイミング
- チームメンバーが増えて並行開発が増加
- データベースコストが課題になる前

### フェーズ3（本格運用）: **Supabase Pro 検討**

- 月間ユーザー数が増加
- Supabase エコシステム全体を活用
- 予算が確保できた段階

---

## 📚 参考資料

### 公式ドキュメント

- [Supabase Pricing & Fees](https://supabase.com/pricing)
- [Supabase Branching Docs](https://supabase.com/docs/guides/deployment/branching)
- [Supabase Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Neon Branching](https://neon.tech/docs/introduction/branching)

### 比較記事

- [PostgreSQL Branching: Xata vs. Neon vs. Supabase](https://xata.io/blog/neon-vs-supabase-vs-xata-postgres-branching-part-1)

---

## ❓ FAQ

### Q1. Free Tier でステージング環境は作れますか？

**A.** はい、**Supabase 別プロジェクト方式**なら完全無料で作成可能です。

### Q2. Neon に移行すると Supabase Auth は使えなくなりますか？

**A.** いいえ、**Neon はデータベースのみ**なので、Supabase Auth/Storage はそのまま利用できます。

### Q3. Production と Preview で同じデータベースを共有するのは危険ですか？

**A.** はい、以下のリスクがあります:

- Preview環境での誤操作が本番データに影響
- テストデータが本番環境に混入
- マイグレーションテストで本番DBが破損

**必ず別環境を用意することを推奨します。**

### Q4. Supabase Pro にアップグレードする価値はありますか？

**A.** 以下の場合は検討価値あり:

- PR毎の完全独立環境が必須
- チーム開発で並行PR開発が多い
- データベースの自動バックアップが必要（PITR）
- 7日間自動停止の制約を避けたい

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-17
**Author:** Claude Code (Based on user requirements)
