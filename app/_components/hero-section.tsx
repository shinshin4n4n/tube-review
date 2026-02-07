import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, TrendingUp } from 'lucide-react';

/**
 * トップページのヒーローセクション
 * コンセプト: 「本音で見つける、次のチャンネル」
 */
export function HeroSection() {
  return (
    <section className="text-center space-y-6 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
          本音で見つける、次のチャンネル
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium">
          あなたのレビューが、誰かの発見になる
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button asChild size="default" className="gap-2">
          <Link href="/search">
            <Search size={18} />
            チャンネルを探す
          </Link>
        </Button>
        <Button asChild variant="outline" size="default" className="gap-2">
          <Link href="#ranking">
            <TrendingUp size={18} />
            人気ランキングを見る
          </Link>
        </Button>
      </div>
    </section>
  );
}
