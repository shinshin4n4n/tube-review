import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "TubeReview - YouTubeチャンネルレビューサイト",
  description: "YouTubeチャンネルを発見・レビュー・管理できるプラットフォーム",
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
      </body>
    </html>
  );
}
