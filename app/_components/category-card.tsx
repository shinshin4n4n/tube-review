import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { CategoryWithCount } from '@/app/_actions/category';

interface CategoryCardProps {
  category: CategoryWithCount;
}

/**
 * カテゴリーカードコンポーネント
 *
 * カテゴリー一覧ページで使用するカードUI
 */
export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`} data-testid="category-card">
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <CardContent className="p-6">
          {/* カテゴリーアイコンとチャンネル数 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden="true">
                {category.icon}
              </span>
              <div>
                <h3 className="text-xl font-bold text-content">
                  {category.name}
                </h3>
                <p className="text-sm text-content-secondary">
                  {category.channelCount} チャンネル
                </p>
              </div>
            </div>
          </div>

          {/* カテゴリー説明 */}
          <p className="text-sm text-content-secondary mb-4">
            {category.description}
          </p>

          {/* 代表的なチャンネルのサムネイル（最大4つ） */}
          {category.topChannels.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {category.topChannels.map((channel, index) => (
                <div
                  key={channel.id}
                  className="aspect-square relative rounded-lg overflow-hidden bg-gray-100"
                >
                  {channel.thumbnail_url ? (
                    <Image
                      src={channel.thumbnail_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 10vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-xs">
                        {category.icon}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {/* 4つ未満の場合、プレースホルダーを表示 */}
              {Array.from({ length: 4 - category.topChannels.length }).map(
                (_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="aspect-square rounded-lg bg-gray-100"
                  />
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
