# UI/UX 設計

> このドキュメントは `WIREFRAME.md` のデザインシステムを詳細化したものです。

## デザインコンセプト

### ビジョン
YouTubeチャンネル発見の楽しさと、ブクログ的な管理の心地よさを両立

### デザイン原則
1. **一覧性重視**: たくさんのチャンネルを素早く比較できる
2. **情報の段階的開示**: 一覧は最小限、詳細ページでリッチに
3. **温かみと馴染み深さ**: 本棚のような安心感とレビューサイトの既視感
4. **使いやすさ**: 直感的な操作、疲れにくいデザイン

---

## カラーパレット

### Base Colors（実装版 - Option M グレイッシュブラウン）
```css
/* Primary - グレイッシュブラウン #6B5B52 */
--color-primary: oklch(0.42 0.025 40);           /* #6B5B52 相当 */
--color-primary-hover: oklch(0.36 0.025 40);     /* Darker grey-brown */
--color-primary-light: oklch(0.48 0.025 40);     /* Lighter grey-brown */

/* Secondary - ライトグレイブラウン #8C7B75 */
--color-secondary: oklch(0.57 0.025 40);         /* #8C7B75 相当 */
--color-secondary-hover: oklch(0.51 0.025 40);   /* Darker grey-brown */
--color-secondary-light: oklch(0.63 0.02 40);    /* Lighter grey-brown */

/* Accent - 赤 #E53935 */
--color-accent: oklch(0.58 0.22 25);             /* #E53935 相当 */
--color-accent-hover: oklch(0.48 0.22 25);       /* #C62828 */
--color-accent-light: oklch(0.62 0.20 25);       /* #EF5350 */

/* Background - ニュートラルグレー */
--color-base: oklch(0.96 0 0);                   /* #F5F5F5 - Page background (bg-base) */
--color-surface: oklch(1 0 0);                   /* #FFFFFF - Card background (bg-surface) */
--color-elevated: oklch(0.98 0 0);               /* Hover/elevated background (bg-elevated) */

/* Text */
--color-content: oklch(0.2 0 0);                 /* #333333 - Primary text (text-content) */
--color-content-secondary: oklch(0.48 0 0);      /* #6B7280 - Secondary text (text-content-secondary) */
--color-content-disabled: oklch(0.62 0 0);       /* #9CA3AF - Disabled text (text-content-disabled) */
```

### Semantic Colors（実装版）
```css
/* Status (shadcn/ui互換) */
--color-success: #10B981;                        /* Green */
--color-warning: #F59E0B;                        /* Orange */
--color-error: oklch(0.58 0.22 25);              /* Red（Accentと同じ） */
--color-destructive: oklch(0.58 0.22 25);        /* Destructive (shadcn) */
--color-info: #3B82F6;                           /* Blue */

/* Star Rating */
--color-star-filled: oklch(0.82 0.14 75);        /* #FBBF24 Amber（塗りつぶし） */
--color-star-empty: oklch(0.91 0 0);             /* #E5E7EB Light Gray（空） */
```

### Border & Shadow（実装版）
```css
/* Border - ニュートラルグレー */
--color-stroke-light: oklch(0.94 0 0);   /* Light neutral border (border-stroke-light) */
--color-stroke: oklch(0.92 0 0);         /* Base neutral border (border-stroke) */
--color-stroke-heavy: oklch(0.84 0 0);   /* #D1D5DB - Heavy border (border-stroke-heavy) */

/* Shadow */
--shadow-xs: 0 1px 2px rgb(0 0 0 / 0.05);
--shadow-base: 0 2px 8px rgb(0 0 0 / 0.08);
--shadow-default: 0 4px 12px rgb(0 0 0 / 0.1);
--shadow-large: 0 6px 16px rgb(0 0 0 / 0.12);
```

---

## タイポグラフィ

### フォントファミリー
```css
--font-sans: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### フォントスケール
```css
/* Heading */
--text-h1: 32px;  /* 2rem, font-bold */
--text-h2: 24px;  /* 1.5rem, font-bold */
--text-h3: 20px;  /* 1.25rem, font-semibold */
--text-h4: 18px;  /* 1.125rem, font-semibold */

/* Body */
--text-base: 16px;    /* 1rem, font-normal */
--text-small: 14px;   /* 0.875rem, font-normal */
--text-xs: 12px;      /* 0.75rem, font-normal */

/* Line Height */
--leading-tight: 1.25;   /* 見出し用 */
--leading-normal: 1.5;   /* 本文用 */
--leading-loose: 1.75;   /* ゆったり */
```

### フォントウェイト
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## スペーシング

**注意**: Tailwindの組み込みサイズ（sm, md, lg, xl）との衝突を避けるため、異なる命名を使用します。

```css
--space-xs: 4px;    /* 0.25rem */
--space-sm: 8px;    /* 0.5rem */
--space-base: 16px; /* 1rem */
--space-lg: 24px;   /* 1.5rem */
--space-xl: 32px;   /* 2rem */
--space-2xl: 48px;  /* 3rem */
--space-3xl: 64px;  /* 4rem */
```

---

## コンポーネント仕様

### Button

#### Primary Button（メインアクション）
```css
height: 40px;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
font-size: 14px;
background: var(--color-primary);
color: white;
border: none;
transition: all 0.2s ease-in-out;
box-shadow: var(--shadow-sm);

&:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(109, 76, 65, 0.2);
}

&:active {
  transform: translateY(0);
}

&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button（サブアクション）
```css
background: var(--color-secondary);
color: white;

&:hover {
  background: var(--color-secondary-hover);
}
```

#### Accent Button（強調アクション - レビューを書くなど）
```css
background: var(--color-accent);
color: white;

&:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 4px 8px rgba(229, 57, 53, 0.2);
}
```

#### Ghost Button（控えめなアクション）
```css
background: transparent;
border: 2px solid var(--color-border-base);
color: var(--color-text-primary);

&:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}
```

---

### Card

#### Channel Card（一覧用）
```css
border-radius: 12px;
background: var(--color-bg-card);
border: 1px solid var(--color-border-light);
padding: 16px;
transition: all 0.3s ease;
box-shadow: var(--shadow-base);

&:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
```

#### Review Card（レビュー表示用）
```css
border-radius: 12px;
background: var(--color-bg-card);
border: 1px solid var(--color-border-base);
padding: 20px;
box-shadow: var(--shadow-sm);
```

---

### Input

```css
height: 44px;
padding: 0 16px;
border: 1px solid var(--color-border-base);
border-radius: 8px;
font-size: 16px;
background: white;
color: var(--color-text-primary);
transition: all 0.2s ease-in-out;

&:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(109, 76, 65, 0.1);
}

&::placeholder {
  color: var(--color-text-disabled);
}

&:disabled {
  background: var(--color-bg-hover);
  cursor: not-allowed;
}
```

---

### Rating（星評価）

```css
.rating {
  display: flex;
  gap: 4px;
  align-items: center;
}

.star {
  width: 20px;
  height: 20px;
  color: var(--color-star-filled);
}

.star.empty {
  color: var(--color-star-empty);
}

.rating-text {
  margin-left: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
```

---

### Header（ヘッダーナビゲーション）

```css
height: 64px;
padding: 0 24px;
background: var(--color-primary);
color: white;
box-shadow: var(--shadow-base);

.logo {
  font-size: 20px;
  font-weight: bold;
}

.nav-item {
  padding: 8px 16px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }
}
```

---

## レスポンシブデザイン

### ブレークポイント
```css
/* Mobile */
@media (max-width: 767px) {
  --grid-cols: 2;
  --container-padding: 16px;
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  --grid-cols: 3;
  --container-padding: 24px;
}

/* Desktop */
@media (min-width: 1024px) {
  --grid-cols: 4;
  --container-padding: 32px;
}
```

### グリッドシステム
```css
.channel-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols), 1fr);
  gap: 20px;
}
```

---

## アクセシビリティ

### カラーコントラスト
- **テキスト/背景**: 最低 4.5:1（WCAG AA準拠）
- **大きなテキスト**: 最低 3:1
- **検証済み**:
  - `#333333` on `#FFFFFF`: 12.6:1 ✅
  - `#6D4C41` on `#FFFFFF`: 7.1:1 ✅
  - `#E53935` on `#FFFFFF`: 4.5:1 ✅

### キーボード操作
- すべてのインタラクティブ要素に`:focus`スタイル
- Tabキーでの順次移動
- Enterキーでのアクション実行
- Escapeキーでモーダル閉じる

### フォーカス表示
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### スクリーンリーダー
- すべての画像に`alt`属性
- ボタンに明確な`aria-label`
- フォームに`label`要素
- セマンティックHTML（`<nav>`, `<main>`, `<article>`等）

---

## アニメーション・トランジション

### 基本原則
- **控えめで自然な動き**
- **200ms - 300msの短いトランジション**
- **ease-in-out カーブ**

### 使用箇所
```css
/* ホバー時（ボタン、カード） */
transition: all 0.2s ease-in-out;

/* ページ遷移 */
transition: opacity 0.3s ease-in-out;

/* モーダル表示 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal {
  animation: fadeIn 0.2s ease-in-out;
}
```

---

## アイコン

### アイコンライブラリ
- **Lucide React** を使用
- 一貫性のあるスタイル
- サイズ: 16px, 20px, 24px

### 使用例
```tsx
import { Star, Heart, MessageSquare, TrendingUp } from 'lucide-react';

<Star size={20} className="text-yellow-400" />
<Heart size={20} className="text-red-500" />
<MessageSquare size={20} className="text-primary" />
```

---

## デザイントークン（Tailwind CSS v4 実装版）

```css
/* app/globals.css - @theme inline ブロック */
@theme inline {
  /* shadcn/ui 標準カラー */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-destructive: var(--destructive);
  --color-border: var(--border);

  /* カスタムカラー - Option M (グレイッシュブラウン) */
  --color-primary-hover: oklch(0.36 0.025 40);
  --color-primary-light: oklch(0.48 0.025 40);
  --color-secondary-hover: oklch(0.51 0.025 40);
  --color-secondary-light: oklch(0.63 0.02 40);
  --color-accent-hover: oklch(0.48 0.22 25);
  --color-accent-light: oklch(0.62 0.20 25);

  /* Background Colors */
  --color-base: oklch(0.96 0 0);      /* #F5F5F5 - bg-base */
  --color-surface: oklch(1 0 0);      /* #FFFFFF - bg-surface */
  --color-elevated: oklch(0.98 0 0);  /* bg-elevated */

  /* Text Colors */
  --color-content: oklch(0.2 0 0);             /* text-content */
  --color-content-secondary: oklch(0.48 0 0);  /* text-content-secondary */
  --color-content-disabled: oklch(0.62 0 0);   /* text-content-disabled */

  /* Border Colors */
  --color-stroke-light: oklch(0.94 0 0);   /* border-stroke-light */
  --color-stroke: oklch(0.92 0 0);         /* border-stroke */
  --color-stroke-heavy: oklch(0.84 0 0);   /* border-stroke-heavy */

  /* Star Rating */
  --color-star-filled: oklch(0.82 0.14 75);  /* #FBBF24 */
  --color-star-empty: oklch(0.91 0 0);       /* #E5E7EB */

  /* Fonts */
  --font-sans: var(--font-noto-sans-jp), system-ui, sans-serif;

  /* Custom Shadows */
  --shadow-xs: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-base: 0 2px 8px rgb(0 0 0 / 0.08);
  --shadow-default: 0 4px 12px rgb(0 0 0 / 0.1);
  --shadow-large: 0 6px 16px rgb(0 0 0 / 0.12);
}

/* :root での色定義 */
:root {
  --radius: 0.75rem;

  /* Primary - グレイッシュブラウン #6B5B52 */
  --primary: oklch(0.42 0.025 40);
  --primary-foreground: oklch(1 0 0);

  /* Secondary - ライトグレイブラウン #8C7B75 */
  --secondary: oklch(0.57 0.025 40);
  --secondary-foreground: oklch(1 0 0);

  /* Accent - 赤 #E53935 */
  --accent: oklch(0.58 0.22 25);
  --accent-foreground: oklch(1 0 0);

  /* Background - ニュートラルグレー #F5F5F5 */
  --background: oklch(0.96 0 0);
  --foreground: oklch(0.2 0 0);

  /* Card */
  --card: oklch(1 0 0);  /* #FFFFFF */
  --card-foreground: oklch(0.2 0 0);

  /* Border */
  --border: oklch(0.92 0 0);
}
```

---

## 実装時の注意点

### 古臭さを避けるポイント
1. **シャドウを適切に使う**
   - `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)` で現代的に
2. **余白を十分に取る**
   - padding, margin を広めに設定
3. **フォントを洗練させる**
   - Noto Sans JP でモダンに
4. **トランジションを滑らかに**
   - `transition: all 0.2s ease-in-out`

### ブクログらしさを保つポイント
1. **温かみのある背景色**
   - `#FFF8F5` を維持
2. **茶色をメインカラーに**
   - `#6D4C41` をヘッダーやボタンに
3. **カードベースのレイアウト**
   - 一覧は必ずカード形式

---

## 次のステップ

1. ✅ このデザインシステムを `tailwind.config.ts` に反映
2. ✅ shadcn/ui をセットアップ（E1-4）
3. ✅ 基本コンポーネントを実装
4. ✅ WIREFRAME.md に沿ってページを作成
