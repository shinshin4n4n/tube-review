import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, TrendingUp } from 'lucide-react';

/**
 * トップページのヒーローセクション
 * コンセプト: 「おすすめに頼らない、能動的なチャンネル発見」
 */
export function HeroSection() {
  return (
    <section className="text-center space-y-6 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
          おすすめに頼らない、
          <br />
          能動的なチャンネル発見
        </h1>
        <p className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
          本音のレビューから、あなたにぴったりのチャンネルを見つけよう。
          <br />
          ブクログのように「見たい」「見ている」「見た」で管理できます。
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button asChild size="lg" className="gap-2">
          <Link href="/search">
            <Search size={20} />
            チャンネルを探す
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="#ranking">
            <TrendingUp size={20} />
            人気ランキングを見る
          </Link>
        </Button>
      </div>

      <div className="pt-8 space-y-2">
        <p className="text-sm text-content-secondary">
          「また時間を無駄にした...」からの脱却
        </p>
      </div>
    </section>
  );
}
