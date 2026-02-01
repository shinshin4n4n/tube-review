# Skills比較: Anthropic公式 vs Obra Superpowers

## TubeReview開発で採用すべきSkills

### 結論（推奨）

| 目的 | 採用Skill | 提供元 | 理由 |
|------|-----------|--------|------|
| **テスト** | `test-driven-development` | Obra Superpowers | TDD特化、厳格なRED-GREEN-REFACTORサイクル |
| **セキュリティ** | `defense-in-depth` | Obra Superpowers | 多層防御の具体的実装パターン |
| **E2Eテスト** | `webapp-testing` | Anthropic公式 | Playwright自動化、本番環境で実証済み |
| **フロントエンド設計** | `frontend-design` | Anthropic公式 | 独創的なUI/UX、AIっぽくないデザイン |
| **Skill作成** | `skill-creator` | Anthropic公式 | 公式標準、ベストプラクティス |

---

## 1. テスト関連Skills比較

### Obra Superpowers: `test-driven-development`

**URL**: https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md

**特徴**:
- **厳格なTDD思想**: 「テストを先に書かないコードは削除」という徹底ぶり
- **RED-GREEN-REFACTOR**の明確な3ステップ
- 実装前にテストが失敗するのを見る（RED）ことを絶対条件とする
- 例外なし：新機能、バグ修正、リファクタリング全てにTDD適用

**内容抜粋**:
```markdown
## Core principle
If you didn't watch the test fail, you don't know if it tests the right thing.

## NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
Write code before the test? Delete it. Start over. No exceptions.
```

**適用場面**:
- 全ての機能実装・バグ修正時
- 品質を絶対に担保したいクリティカルな機能

**メリット**:
- テストの信頼性が極めて高い
- 手戻りが少ない（テストで保護されている）
- リファクタリングが安全

**デメリット**:
- 初速が遅い（最初にテスト書く必要がある）
- プロトタイプには向かない

---

### Anthropic公式: `webapp-testing`

**URL**: https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md

**特徴**:
- **Playwright E2Eテスト**に特化
- 静的HTML vs 動的Webappの自動判定
- サーバー起動・停止の自動化スクリプト付き
- 本番環境で使用されている（Claude.aiでも使われている可能性）

**内容抜粋**:
```markdown
## Workflow
1. Is it static HTML?
   - Yes → Read HTML file directly
   - No → Is the server already running?
     - No → Run: python scripts/with_server.py --help
     - Yes → Reconnaissance-then-action
```

**適用場面**:
- E2Eテスト自動化
- ローカルサーバーでのUI検証
- ブラウザ操作の自動化

**メリット**:
- Playwrightスクリプトがすぐ書ける
- サーバー管理が自動化されている
- 実績がある（Anthropic社内で使用）

**デメリット**:
- TDD思想は含まれていない（あくまでE2Eテスト用）
- Playwrightに依存

---

## 2. セキュリティ関連Skills比較

### Obra Superpowers: `defense-in-depth`

**URL**: https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/defense-in-depth.md

**特徴**:
- **多層防御（Defense-in-Depth）**の具体的実装パターン
- 各レイヤーで異なる検証を行う設計
- systematic-debuggingの一部として、バグ発見後の対策に使用

**内容抜粋**:
```markdown
## Layer 1: Workflow
echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

## Layer 2: Build script
echo "Env vars in build script:"
env | grep IDENTITY

## Layer 3: Signing script
echo "Keychain state:"
security list-keychains

## Layer 4: Actual signing
codesign --sign "$IDENTITY" --verbose=4 "$APP"
```

**適用場面**:
- セキュリティ実装時
- バグ修正後の再発防止
- 認証・認可の多層化

**メリット**:
- 具体的な実装パターンが示されている
- デバッグ時の検証ポイントが明確
- 実践的なアプローチ

**デメリット**:
- 汎用的なセキュリティガイドではない
- デバッグの文脈で語られている

---

### Anthropic公式: セキュリティ特化Skillなし

Anthropic公式リポジトリには、セキュリティ専門のSkillは見当たりません。

ただし、コミュニティSkillsとして以下が存在：
- **SHADOWPR0/security-bluebook-builder**: セキュリティBlue Book作成
- **obra/defense-in-depth**: （上記と同じ）
- **Trail of Bits**: 複数のセキュリティ関連Skills

---

## 3. その他の有用なAnthropic公式Skills

### `frontend-design`

**URL**: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md

**特徴**:
- **「AIっぽくない」独創的なデザイン**を生成
- 型にはまったInter+紫グラデーションを避ける
- 具体的な美学（brutalist, art deco, retro-futuristic等）を選択

**内容抜粋**:
```markdown
## NEVER use generic AI-generated aesthetics
- Overused fonts (Inter, Roboto, Arial)
- Cliched colors (purple gradients on white)
- Cookie-cutter layouts

## Choose BOLD aesthetic direction
- Brutally minimal
- Maximalist chaos
- Retro-futuristic
- Organic/natural
```

**適用場面**:
- TubeReviewのUI/UX設計
- ブランディング
- Artifactsでのプロトタイプ作成

**メリット**:
- 個性的なデザインが作れる
- ブクログとは異なる独自性を持てる

**デメリット**:
- デザインの一貫性を保つには別途デザインシステムが必要

---

### `skill-creator`

**URL**: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md

**特徴**:
- Skill作成のガイド
- Anthropic公式のベストプラクティスが含まれる
- Progressive Disclosure（段階的開示）の設計思想

**内容抜粋**:
```markdown
## Skill structure
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/ - Executable code
    ├── references/ - Documentation
    └── assets/ - Templates, icons
```

**適用場面**:
- カスタムSkill作成時
- TubeReview専用のワークフロー定義

**メリット**:
- 公式標準に準拠
- Progressive Disclosureで軽量

**デメリット**:
- Obra Superpowersの`writing-skills`と内容が重複

---

## 比較まとめ

### Obra Superpowers の強み

1. **TDD特化**: test-driven-developmentは業界最高レベルの厳格さ
2. **開発ワークフロー**: brainstorming → writing-plans → subagent-driven-development の一貫した流れ
3. **実践的**: コミュニティで磨かれた実用的なSkills
4. **統合性**: 複数のSkillsが連携して動作

### Anthropic公式の強み

1. **本番実績**: Claude.aiで実際に使われている（webapp-testing, docx, pdfなど）
2. **公式サポート**: Anthropic社が保守
3. **標準準拠**: Agent Skills標準仕様に完全準拠
4. **ドキュメント充実**: 各Skillに詳細な説明・例がある

---

## TubeReview開発における推奨構成

### 採用Skillsの組み合わせ

```
プロジェクトルート/
├── .claude/
│   └── skills/
│       ├── test-driven-development/        ← Obra Superpowers
│       │   └── SKILL.md
│       ├── defense-in-depth.md            ← Obra Superpowers（単一ファイル）
│       ├── webapp-testing/                ← Anthropic公式
│       │   ├── SKILL.md
│       │   └── scripts/
│       └── frontend-design/               ← Anthropic公式
│           └── SKILL.md
```

### 各Skillの使い分け

| フェーズ | 使用Skill | 目的 |
|----------|-----------|------|
| 機能実装 | `test-driven-development` | Unit/Integration Test（TDD） |
| セキュリティ実装 | `defense-in-depth` | 多層防御設計 |
| E2Eテスト | `webapp-testing` | Playwright自動化 |
| UI/UX設計 | `frontend-design` | 独創的デザイン生成 |

---

## インストール方法

### Obra Superpowers（Claude Code）

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**または手動インストール**:
```bash
# プロジェクトローカル
mkdir -p .claude/skills
cd .claude/skills
curl -o test-driven-development.md https://raw.githubusercontent.com/obra/superpowers/main/skills/test-driven-development/SKILL.md
curl -o defense-in-depth.md https://raw.githubusercontent.com/obra/superpowers/main/skills/systematic-debugging/defense-in-depth.md
```

### Anthropic公式（Claude Code）

```bash
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

**または手動インストール**:
```bash
# webapp-testing
git clone --depth 1 --filter=blob:none --sparse https://github.com/anthropics/skills
cd skills
git sparse-checkout set skills/webapp-testing
cp -r skills/webapp-testing ~/.claude/skills/

# frontend-design
git sparse-checkout add skills/frontend-design
cp -r skills/frontend-design ~/.claude/skills/
```

---

## 結論

### ベストな組み合わせ

**TubeReview開発では両方を併用する**

1. **Obra Superpowers**: TDD、セキュリティの厳格な実装
2. **Anthropic公式**: E2Eテスト、フロントエンド設計

### 理由

- **補完関係**: 両者は競合せず、異なる領域をカバー
- **実績**: どちらも実戦で使われている
- **柔軟性**: 必要なSkillだけ選択できる

### 追加で検討すべきSkills

| Skill | 提供元 | 用途 |
|-------|--------|------|
| `systematic-debugging` | Obra Superpowers | 4フェーズデバッグ手法 |
| `verification-before-completion` | Obra Superpowers | 完了前の検証 |
| `docx`, `pdf`, `xlsx` | Anthropic公式 | ドキュメント生成（ポートフォリオ用） |

---

## 参考資料

- [Anthropic Skills公式リポジトリ](https://github.com/anthropics/skills)
- [Obra Superpowers](https://github.com/obra/superpowers)
- [Agent Skills標準仕様](https://agentskills.io)
- [Skills Explained (Anthropic Blog)](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
