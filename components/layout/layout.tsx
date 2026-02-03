import { Header } from './header';
import { Footer } from './footer';

/**
 * 共通レイアウトコンポーネント
 * - Header + メインコンテンツ + Footer
 * - 全ページで使用する基本構造
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
