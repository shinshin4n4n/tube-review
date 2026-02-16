---
name: Migrate scripts/ from CommonJS to ESM
about: 23個のCommonJSスクリプトをTypeScript (ESM)に移行して、リンティング有効化への道を開く
title: "Migrate scripts/ from CommonJS to ESM"
labels: "enhancement, refactor, scripts"
assignees: ""
---

## 🎯 目的

scripts/ディレクトリの23個のCommonJSファイル（.js）をTypeScript (ESM形式)に移行し、モジュール形式を統一する。これにより、将来のESLint有効化とコード品質保証が可能になる。

## 📊 現状

### モジュール形式の内訳

| 形式               | ファイル数 | 状態             |
| ------------------ | ---------- | ---------------- |
| **CommonJS (.js)** | 23個       | ❌ 移行対象      |
| **ESM (.ts)**      | 10個       | ✅ 完了          |
| **ESM (.mjs)**     | 4個        | ⚠️ .tsに統合推奨 |
| **合計**           | 37個       | -                |

### 問題点

1. **モジュール形式の混在**: CommonJS/ESMが混在し、一貫性がない
2. **型安全性の欠如**: .jsファイルはTypeScriptの型チェック対象外
3. **リンティング困難**: eslint-config-next（React用）がCommonJSと互換性なし
4. **重複ファイル**: 同じ機能のスクリプトが.jsと.tsで重複

## ✅ 対応内容

### Phase 1: 重複ファイルの削除（優先度: High）

以下のファイルは.tsバージョンが既に存在するため、.js/.mjsを削除:

```bash
# 重複1: refresh-materialized-views
scripts/refresh-materialized-views.js  # 削除
scripts/refresh-materialized-views.ts  # 保持

# 重複2: update-categories
scripts/update-categories.js   # 削除
scripts/update-categories.mjs  # 削除
# → 必要に応じて.tsに統合

# GitHub Actions確認
.github/workflows/*.yml で上記スクリプトを参照している場合、
.tsバージョンに切り替え
```

### Phase 2: CommonJS → TypeScript (ESM) 移行

#### 変換パターン

**Before (CommonJS):**

```javascript
// scripts/example.js
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // ... logic ...
  console.log("Done");
}

main();
```

**After (TypeScript ESM):**

```typescript
// scripts/example.ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // ... logic ...
  console.log("✅ Done");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
```

#### 変換チェックリスト（各ファイル）

- [ ] `require()` → `import`
- [ ] `module.exports` → `export`
- [ ] `.config({ path: '.env.local' })` → `import 'dotenv/config'`
- [ ] 環境変数に `!` 追加（TypeScript non-null assertion）
- [ ] エラーハンドリング追加（`.catch()`）
- [ ] 成功/失敗のログ明示（✅/❌）
- [ ] ファイル名を`.ts`に変更
- [ ] package.jsonのスクリプト参照を更新（該当する場合）

### Phase 3: 動作確認

各スクリプト移行後:

```bash
# TypeScriptで実行
npx tsx scripts/example.ts

# エラーがないことを確認
echo $?  # → 0 (成功)
```

## 📋 移行対象ファイル一覧（23個）

### 優先度: High（package.jsonやGitHub Actionsで使用）

- [ ] `refresh-materialized-views.js` → ❌ 削除（.ts版あり）
- [ ] `update-categories.js` → ❌ 削除（.mjs版あり）
- [ ] `refresh-channel-stats.js` → .ts

### 優先度: Medium（使用頻度中）

- [ ] `seed.mjs` → .ts（シード関連を統合）
- [ ] `execute-seed.mjs` → .ts
- [ ] `run-seed.js` → .ts
- [ ] `apply-seed.js` → .ts

### 優先度: Low（ワンオフスクリプト）

- [ ] `add-channels-by-category.js`
- [ ] `add-reviews-to-all-channels.js`
- [ ] `capture-header.js`
- [ ] `check-category-counts.js`
- [ ] `check-db.js`
- [ ] `check-hikarincho.js`
- [ ] `check-null-category.js`
- [ ] `check-papa-cooking-reviews.js`
- [ ] `check-specific-channel-reviews.js`
- [ ] `check-thumbnails.js`
- [ ] `check-vlog-channels.js`
- [ ] `cleanup-failed-channels.js`
- [ ] `find-japanese-vlog-channels.js`
- [ ] `find-real-vlog-channels.js`
- [ ] `fix-null-category.js`
- [ ] `list-categories.js`
- [ ] `replace-vlog-channels.js`
- [ ] `search-and-add-channels.js`
- [ ] `update-thumbnails-from-youtube.js`

## ✅ 成功基準

- [ ] CommonJS (.js) ファイルが0個
- [ ] すべてのスクリプトが.ts形式（ESM）
- [ ] package.jsonのスクリプト参照が更新済み
- [ ] GitHub Actionsのスクリプト参照が更新済み
- [ ] すべてのスクリプトが`npx tsx`で実行可能
- [ ] 実行時エラーなし

## 📚 参考資料

- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [tsx - TypeScript Execute](https://github.com/privatenumber/tsx)

## 🔗 関連Issue/PR

- #135 Enable ESLint for scripts/ directory
- #136 docs: Add scripts/ directory coding standards

---

**推定作業時間:** 2-4時間（23ファイル × 5-10分/ファイル）
**優先度:** Medium（技術的負債の解消）
**影響範囲:** scripts/ディレクトリのみ（アプリコードに影響なし）
