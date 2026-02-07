# GitHub Actions ワークフロー

このディレクトリには、TubeReviewプロジェクトのCI/CDワークフローが含まれています。

## 📋 ワークフロー一覧

### 1. CI (Continuous Integration)

**ファイル**: `ci.yml`

**トリガー**:
- Pull Request作成時（main宛）
- mainブランチへのPush時

**ジョブ**:

#### Lint
- ESLintを実行してコード品質をチェック
- 実行時間: 約1分

#### Type Check
- TypeScriptの型チェックを実行
- 実行時間: 約1分

#### Unit Tests
- Vitestでユニットテストを実行
- 実行時間: 約1分

#### Build
- Next.jsアプリケーションをビルド
- ビルド成果物を保存（1日間）
- 実行時間: 約2分

**合計実行時間**: 約5分（並列実行）

### 2. E2E Tests

**ファイル**: `e2e.yml`

**トリガー**:
- Pull Request作成時（main宛）
- 手動実行（workflow_dispatch）

**ジョブ**:

#### E2E Tests
- Playwrightでブラウザテストを実行
- テスト失敗時は動画を保存
- タイムアウト: 15分

**実行時間**: 約5-10分

## 🔧 ローカルでの実行方法

### Lint
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### Build
```bash
npm run build
```

## 🔑 必要な環境変数（GitHub Secrets）

E2Eテストを実行するには、以下のSecretsを設定する必要があります：

### 設定方法
1. GitHubリポジトリ > Settings > Secrets and variables > Actions
2. "New repository secret"をクリック
3. 以下の環境変数を追加：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | `eyJhbGc...` |
| `YOUTUBE_API_KEY` | YouTube Data API v3キー | `AIzaSy...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | `eyJhbGc...` |

> **注意**: E2Eテストは実際のデータベースに接続するため、テスト用の環境を使用することを推奨します。

## 🚀 Vercelデプロイ

Vercelは自動的にGitHub連携でデプロイを行います：

### Preview Deploy
- Pull Request作成時に自動実行
- プレビューURLが発行される
- CI通過後にデプロイ開始

### Production Deploy
- mainブランチへのマージ時に自動実行
- 本番環境へデプロイ

### Vercel環境変数設定

1. Vercel Dashboard > プロジェクト > Settings > Environment Variables
2. 以下の環境変数を設定（Preview/Production両方）：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Preview, Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Preview, Production |
| `YOUTUBE_API_KEY` | YouTube Data API v3キー | Preview, Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | Preview, Production |

## 🎯 CI/CDフロー

```
┌─────────────────┐
│  Pull Request   │
└────────┬────────┘
         │
         ├─► Lint (並列)
         ├─► Type Check (並列)
         ├─► Unit Tests (並列)
         ├─► Build (並列)
         └─► E2E Tests (並列)
                 │
                 ├─► ✅ 全てパス → Vercel Preview Deploy
                 └─► ❌ 失敗 → PR blocked

┌─────────────────┐
│   Merge to main │
└────────┬────────┘
         │
         ├─► 上記全て実行
         │
         └─► ✅ 全てパス → Vercel Production Deploy
```

## ⚡ パフォーマンス最適化

### キャッシュ戦略
- `actions/setup-node@v4`の`cache: 'npm'`でnode_modulesをキャッシュ
- ビルド成果物（.next）をartifactとして保存

### 並列実行
- Lint, Type Check, Unit Tests, Buildは並列実行
- 合計実行時間を短縮（約5分）

## 🐛 トラブルシューティング

### CI失敗時の対処法

#### Lint エラー
```bash
# ローカルで修正
npm run lint

# 自動修正
npm run lint -- --fix
```

#### Type Check エラー
```bash
# ローカルで確認
npx tsc --noEmit
```

#### Unit Test 失敗
```bash
# ローカルで実行
npm run test:unit

# 特定のテストのみ実行
npm run test:unit -- path/to/test.test.ts
```

#### Build 失敗
```bash
# ローカルでビルド
npm run build

# エラーログを確認
cat .next/build.log
```

#### E2E Test 失敗
```bash
# ローカルで実行
npm run test:e2e

# ヘッドレスモードOFFで実行（デバッグ用）
npm run test:e2e -- --headed

# 特定のテストのみ実行
npm run test:e2e -- tests/e2e/login.spec.ts
```

### よくある問題

#### 1. E2Eテストで環境変数エラー
- GitHub Secretsが正しく設定されているか確認
- Secret名のスペルミスがないか確認

#### 2. ビルドでメモリ不足エラー
- GitHub Actionsのデフォルトメモリ（7GB）で通常は十分
- 必要に応じて`NODE_OPTIONS=--max-old-space-size=4096`を設定

#### 3. テストタイムアウト
- E2Eテストのタイムアウトは15分に設定済み
- それでも不足する場合は`timeout-minutes`を調整

## 📚 参考資料

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Next.js CI/CD Guide](https://nextjs.org/docs/pages/building-your-application/deploying/ci-build-caching)
