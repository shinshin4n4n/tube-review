/**
 * フッターコンポーネント（簡易版）
 * - サイト名とコピーライト表示
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base border-t border-stroke-light mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center text-content-secondary text-sm">
          <p className="font-semibold mb-2">ちゅぶれびゅ！</p>
          <p>&copy; {currentYear} TubeReview. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
