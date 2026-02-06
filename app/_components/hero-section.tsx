import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, TrendingUp } from 'lucide-react';

/**
 * トップページのヒーローセクション
 * コンセプト: 「おすすめに頼らない、能動的なチャンネル発見」
 */
export function HeroSection() {
  return (
    <section className="text-center space-y-4 py-8">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
          おすすめに頼らない、
          <br />
          能動的なチャンネル発見
        </h1>
        <p className="text-base md:text-lg text-content-secondary max-w-2xl mx-auto">
          本音のレビューから、あなたにぴったりのチャンネルを見つけよう。
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
