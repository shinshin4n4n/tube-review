import { Layout } from '@/components/layout';

/**
 * ちゅぶれびゅ！とは ページ
 * - サービス概要
 * - コアバリュー（3つ）
 * - こんな人におすすめ（ターゲットユーザー）
 * - 使い方の簡単な説明
 */
export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-16 space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            ちゅぶれびゅ！とは
          </h1>

          <div className="space-y-4">
            <p className="text-lg md:text-xl text-gray-600 font-medium">
              あなたのレビューが、誰かの発見になる
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              本音のレビューで、新しいチャンネルを発掘。
              <br />
              同じ興味を持つ人のリアルな声が、本当に面白いチャンネルを教えてくれます。
              <br />
              あなたの感想が、今度は誰かの道しるべになります。
            </p>
          </div>
        </div>

        <div className="space-y-16">
          {/* サービス概要 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              サービス概要
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                <span className="font-bold text-primary">ちゅぶれびゅ！</span>は、YouTubeチャンネルのレビュー・発見プラットフォームです。
                <br />
                チャンネル単位で「見たい」「見ている」「見た」を管理し、能動的にチャンネルを発見できます。
              </p>
            </div>
          </section>

          {/* コアバリュー */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              コアバリュー
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  能動的な発見へ
                </h3>
                <p className="text-gray-700">
                  YouTubeの受動的な「おすすめ」視聴から、能動的なチャンネル発見へ
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-6 border border-accent/20">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  管理する楽しさ
                </h3>
                <p className="text-gray-700">
                  チャンネルを整理・管理する楽しさを、YouTubeの視聴に取り入れる
                </p>
              </div>

              <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-6 border border-secondary/20">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  質の高い視聴体験
                </h3>
                <p className="text-gray-700">
                  チャンネル単位での評価・発見を促進し、質の高い視聴体験を提供
                </p>
              </div>
            </div>
          </section>

          {/* こんな人におすすめ */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              こんな人におすすめ
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      YouTubeを日常的に視聴する人
                    </h3>
                    <p className="text-gray-700">
                      毎日YouTubeを見ているけど、もっと良いチャンネルを見つけたい方
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      「また時間を無駄にした...」と後悔したことがある人
                    </h3>
                    <p className="text-gray-700">
                      おすすめ動画に流されて、気づいたら数時間経っていた経験がある方
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      良質なチャンネルを探しているが、おすすめに頼りたくない人
                    </h3>
                    <p className="text-gray-700">
                      アルゴリズムに頼らず、自分で能動的にチャンネルを探したい方
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 使い方 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              使い方
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    チャンネルを検索
                  </h3>
                  <p className="text-gray-700">
                    気になるYouTubeチャンネルを検索して登録しましょう
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    ステータスを管理
                  </h3>
                  <p className="text-gray-700">
                    「見たい」「見ている」「見た」でマイリスト管理できます
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    レビューを書く
                  </h3>
                  <p className="text-gray-700">
                    星評価とコメントで、あなたの感想を共有しましょう
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    新しいチャンネルを発見
                  </h3>
                  <p className="text-gray-700">
                    ランキングや他のユーザーのレビューから、新しいチャンネルを見つけましょう
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">
                チャンネルを探す
              </h2>
              <p className="text-xl mb-8 text-white/90">
                あなたの能動的なYouTube視聴体験をサポートします
              </p>
              <a
                href="/"
                className="inline-block px-8 py-4 bg-white text-primary rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
              >
                トップページへ
              </a>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export const metadata = {
  title: 'ちゅぶれびゅ！とは',
  description:
    'ちゅぶれびゅ！は、YouTubeチャンネルのレビュー・発見プラットフォームです。チャンネル単位で管理し、能動的にチャンネルを発見できます。',
};
