import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

/**
 * トップページ
 * - デザインシステムのデモンストレーション
 * - カラーパレットとコンポーネントの確認
 */
export default function Home() {
  return (
    <Layout>
      <div className="space-y-12">
        {/* ヒーローセクション */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">
            ちゅぶれびゅ！
          </h1>
          <p className="text-lg text-content-secondary max-w-2xl mx-auto">
            YouTubeチャンネルを発見・レビュー・管理できるプラットフォーム
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button variant="default" size="lg">
              チャンネルを探す
            </Button>
            <Button variant="outline" size="lg">
              ランキングを見る
            </Button>
          </div>
        </section>

        {/* カラーパレットデモ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content">
            カラーパレット
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 bg-primary rounded-lg shadow-base"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-content-secondary">#6D4C41</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-secondary rounded-lg shadow-base"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-content-secondary">#8D6E63</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-accent rounded-lg shadow-base"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-content-secondary">#E53935</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-base rounded-lg border border-stroke"></div>
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-content-secondary">#FFF8F5</p>
            </div>
          </div>
        </section>

        {/* ボタンデモ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content">
            ボタンバリエーション
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="destructive">Accent Button</Button>
            <Button variant="outline">Ghost Button</Button>
            <Button variant="ghost">Text Button</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="default" size="sm">Small</Button>
            <Button variant="default" size="default">Default</Button>
            <Button variant="default" size="lg">Large</Button>
          </div>
        </section>

        {/* カードデモ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content">
            チャンネルカード（サンプル）
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="hover:shadow-md transition-shadow duration-300 cursor-pointer">
                <CardHeader className="space-y-2">
                  <div className="w-16 h-16 bg-secondary rounded-full mx-auto"></div>
                  <CardTitle className="text-center text-base">チャンネル名 {i}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="flex justify-center items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= 4 ? "fill-star-filled text-star-filled" : "text-star-empty"}
                      />
                    ))}
                    <span className="text-sm text-content-secondary ml-1">4.0</span>
                  </div>
                  <p className="text-xs text-content-secondary">(120件)</p>
                  <Badge variant="secondary" className="text-xs">エンタメ</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 準備中セクション */}
        <section className="space-y-4">
          <Card className="bg-muted border-stroke-light">
            <CardHeader>
              <CardTitle>🚧 準備中</CardTitle>
              <CardDescription>
                現在、認証システムとデザインシステムの構築が完了しました。
                次のフェーズでチャンネル検索とレビュー機能を実装します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ 認証システム
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ デザインシステム
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  ⏳ チャンネル検索
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  ⏳ レビュー機能
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
