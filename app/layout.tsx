import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tube-review.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TubeReview - YouTubeチャンネルレビューサイト",
    template: "%s | TubeReview",
  },
  description: "YouTubeチャンネルのレビューを投稿・閲覧できるプラットフォーム。お気に入りのチャンネルを発見し、評価を共有しよう。",
  keywords: [
    "YouTube",
    "レビュー",
    "チャンネル",
    "評価",
    "おすすめ",
    "ランキング",
    "動画",
    "クリエイター",
  ],
  authors: [{ name: "TubeReview Team" }],
  creator: "TubeReview",
  publisher: "TubeReview",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "TubeReview",
    title: "TubeReview - YouTubeチャンネルレビューサイト",
    description: "YouTubeチャンネルのレビューを投稿・閲覧できるプラットフォーム",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TubeReview - YouTubeチャンネルレビューサイト",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TubeReview - YouTubeチャンネルレビューサイト",
    description: "YouTubeチャンネルのレビューを投稿・閲覧できるプラットフォーム",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // Google Search Console verification (本番環境で設定)
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
