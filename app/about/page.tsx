import { Layout } from "@/components/layout";
import Link from "next/link";

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
      <div className="container mx-auto max-w-4xl px-6 py-12">
        {/* ヘッダー */}
        <div className="mb-16 space-y-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            ちゅぶれびゅ！とは
          </h1>

          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-600 md:text-xl">
              あなたのレビューが、誰かの発見になる
            </p>
          </div>

          <div className="mx-auto max-w-2xl">
            <p className="text-base leading-relaxed text-gray-700 md:text-lg">
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
            <h2 className="mb-6 text-3xl font-bold text-gray-900">
              サービス概要
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-lg leading-relaxed text-gray-700">
                <span className="text-primary font-bold">ちゅぶれびゅ！</span>
                は、YouTubeチャンネルのレビュー・発見プラットフォームです。
                <br />
                チャンネル単位で「見たい」「見ている」「見た」を管理し、能動的にチャンネルを発見できます。
              </p>
            </div>
          </section>

          {/* コアバリュー */}
          <section>
            <h2 className="mb-6 text-3xl font-bold text-gray-900">
              コアバリュー
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="from-primary/10 to-primary/5 border-primary/20 rounded-lg border bg-gradient-to-br p-6">
                <div className="mb-4 text-4xl">🎯</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  能動的な発見へ
                </h3>
                <p className="text-gray-700">
                  YouTubeの受動的な「おすすめ」視聴から、能動的なチャンネル発見へ
                </p>
              </div>

              <div className="from-accent/10 to-accent/5 border-accent/20 rounded-lg border bg-gradient-to-br p-6">
                <div className="mb-4 text-4xl">📚</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  管理する楽しさ
                </h3>
                <p className="text-gray-700">
                  チャンネルを整理・管理する楽しさを、YouTubeの視聴に取り入れる
                </p>
              </div>

              <div className="from-secondary/10 to-secondary/5 border-secondary/20 rounded-lg border bg-gradient-to-br p-6">
                <div className="mb-4 text-4xl">⭐</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
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
            <h2 className="mb-6 text-3xl font-bold text-gray-900">
              こんな人におすすめ
            </h2>
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="mb-2 font-bold text-gray-900">
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
                    <h3 className="mb-2 font-bold text-gray-900">
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
                    <h3 className="mb-2 font-bold text-gray-900">
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
            <h2 className="mb-6 text-3xl font-bold text-gray-900">使い方</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white">
                  1
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    チャンネルを検索
                  </h3>
                  <p className="text-gray-700">
                    気になるYouTubeチャンネルを検索して登録しましょう
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white">
                  2
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    ステータスを管理
                  </h3>
                  <p className="text-gray-700">
                    「見たい」「見ている」「見た」でマイリスト管理できます
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white">
                  3
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    レビューを書く
                  </h3>
                  <p className="text-gray-700">
                    星評価とコメントで、あなたの感想を共有しましょう
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white">
                  4
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
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
            <div className="rounded-lg border border-gray-200 bg-white p-12 shadow-sm">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                チャンネルを探す
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                あなたの能動的なYouTube視聴体験をサポートします
              </p>
              <Link
                href="/"
                className="bg-primary hover:bg-primary-dark inline-block rounded-lg px-8 py-4 font-bold text-white shadow-md transition-colors duration-200"
              >
                トップページへ
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export const metadata = {
  title: "ちゅぶれびゅ！とは",
  description:
    "ちゅぶれびゅ！は、YouTubeチャンネルのレビュー・発見プラットフォームです。チャンネル単位で管理し、能動的にチャンネルを発見できます。",
};
