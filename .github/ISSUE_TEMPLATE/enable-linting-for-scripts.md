---
name: Enable ESLint for scripts/ directory
about: scripts/ディレクトリをリンティング対象に含めて品質を保証する
title: "Enable ESLint for scripts/ directory (#135)"
labels: "tech-debt, quality, scripts"
assignees: ""
---

## 🎯 目的

scripts/ディレクトリ（37個のファイル）をリンティング対象に含め、コードベース全体で一貫した品質基準を適用する。

## 📊 現状

### 問題

- **37個のスクリプトファイル**がリンティング対象外
- `eslint.config.mjs` で `scripts/**` が除外設定
- CommonJS（23個）とESM（13個）が混在
- eslint-config-next（React用）がNode.jsスクリプトと互換性なし

### 影響

- ❌ コード品質が保証されない
- ❌ バグがあってもCIで検出されない
- ❌ リファクタリング時の破損リスク
- ❌ アプリコードとscriptsで品質基準が異なる

## ✅ 対応内容

### 1. ESLint設定の分離

#### Option A: 独立したESLint設定（推奨）

**scripts/.eslintrc.json** を作成:

```json
{
  "root": true,
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "overrides": [
    {
      "files": ["*.ts"],
      "parser": "@typescript-eslint/parser",
      "extends": ["plugin:@typescript-eslint/recommended"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { "argsIgnorePattern": "^_" }
        ]
      }
    }
  ],
  "rules": {
    "no-console": "off"
  }
}
```

**eslint.config.mjs** から `scripts/**` を削除:

```diff
-    // Scripts (CommonJS files - to be migrated to ESM in separate PR)
-    "scripts/**",
```

#### Option B: Flat Config の overrides（要調査）

ESLint v9+ のFlat Config形式でscriptsディレクトリ専用ルールを定義。

### 2. CIでの検証追加

**.github/workflows/lint.yml** に追加:

```yaml
- name: Lint scripts directory
  run: npx eslint scripts/
```

### 3. Pre-commit Hooks更新

**package.json (lint-staged):**

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "scripts/**/*.{js,mjs,ts}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

### 4. ドキュメント更新

**CLAUDE.md に追加:**

```markdown
### Scripts

- **配置**: `scripts/*.{ts,js,mjs}`
- **用途**: データベースメンテナンス、デモデータ生成
- **モジュール形式**: ESM推奨（CommonJSは段階的に移行）
- **リンティング**: scripts/.eslintrc.json で独自ルール
- **テスト**: 重要なスクリプトには動作確認テスト
```

## 🔄 マイグレーション計画（Phase 2）

### CommonJS → ESM移行

優先度順:

1. **High priority** (package.jsonで使用):
   - `generate-demo-data.ts` ✅ (already ESM)
   - `update-channel-thumbnails.ts` ✅ (already ESM)
   - `classify-channels.ts` ✅ (already ESM)
   - `refresh-materialized-views.ts` ✅ (already ESM)

2. **Medium priority** (GitHub Actionsで使用):
   - `refresh-materialized-views.js` → .ts
   - `refresh-channel-stats.js` → .ts

3. **Low priority** (ワンオフスクリプト):
   - その他の`.js`ファイル（使用頻度低）

## ✅ 成功基準

- [ ] scripts/ディレクトリでESLintエラー0
- [ ] CIで`npx eslint scripts/`が成功
- [ ] Pre-commit hooksでscriptsがチェックされる
- [ ] CLAUDE.mdにscriptsのルールを記載
- [ ] 既存の37個すべてがリンティング対象

## 📋 チェックリスト

### Phase 1: ESLint有効化

- [ ] scripts/.eslintrc.json 作成
- [ ] eslint.config.mjs から scripts/\*\* 削除
- [ ] `npx eslint scripts/` 実行してエラー確認
- [ ] エラー修正（自動修正: `npx eslint scripts/ --fix`）
- [ ] 手動修正が必要なエラーを修正

### Phase 2: CI/CD統合

- [ ] .github/workflows/lint.yml 更新
- [ ] package.json の lint-staged 更新
- [ ] pre-commit hooks テスト
- [ ] CI実行確認

### Phase 3: ドキュメント化

- [ ] CLAUDE.md 更新
- [ ] .claude/architecture.md にscriptsセクション追加
- [ ] README.md のScriptsセクション更新

## 📚 参考資料

- [ESLint Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript ESLint](https://typescript-eslint.io/)

## 🔗 関連Issue

- #133 DB Migration CI (完了)
- #134 DB Migration Test Implementation (完了)

---

**推定作業時間:** 2-4時間
**優先度:** Medium（技術的負債だが、機能に影響なし）
**影響範囲:** scripts/ディレクトリ（37ファイル）
