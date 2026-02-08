# OG画像作成TODO

## 📝 概要

SNSシェア時に表示されるOG（Open Graph）画像を作成する必要があります。

## 📐 仕様

### ファイル名
- `og-image.png`

### サイズ
- **幅**: 1200px
- **高さ**: 630px
- **アスペクト比**: 1.91:1

### ファイルサイズ
- **推奨**: < 300KB
- **最大**: < 1MB

### フォーマット
- **推奨**: PNG（透過なし）
- **代替**: JPG

## 🎨 デザイン案

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│           TubeReview                        │
│                                             │
│     YouTubeチャンネルレビューサイト         │
│                                             │
│     お気に入りのチャンネルを発見しよう      │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### デザイン要素

1. **ロゴ/タイトル**: TubeReview
2. **キャッチコピー**: YouTubeチャンネルレビューサイト
3. **サブコピー**: お気に入りのチャンネルを発見しよう
4. **背景色**: ブランドカラー（#F5F5F5 または #FFFFFF）
5. **アクセントカラー**: #E53935（赤）

## 🛠️ 作成方法

### オプション1: Canva
1. [Canva](https://www.canva.com/)にアクセス
2. カスタムサイズ: 1200 x 630 px
3. デザイン要素を配置
4. PNG形式でダウンロード

### オプション2: Figma
1. [Figma](https://www.figma.com/)でフレーム作成
2. サイズ: 1200 x 630 px
3. デザイン
4. Export as PNG

### オプション3: Next.js OG Image Generation
```typescript
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#F5F5F5',
        }}
      >
        <h1 style={{ fontSize: 72, color: '#333' }}>TubeReview</h1>
        <p style={{ fontSize: 32, color: '#666' }}>
          YouTubeチャンネルレビューサイト
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

## ✅ チェックリスト

作成後、以下を確認:

- [ ] サイズが1200x630pxである
- [ ] ファイルサイズが300KB以下
- [ ] テキストが読みやすい
- [ ] ブランドカラーを使用している
- [ ] `public/og-image.png`に配置
- [ ] SNSプレビューで確認
  - Twitter Card Validator
  - Facebook Sharing Debugger

## 📍 配置場所

```
public/
└── og-image.png  ← ここに配置
```

## 🔗 参考資料

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)

---

**優先度**: Medium
**見積もり時間**: 30分 - 1時間
