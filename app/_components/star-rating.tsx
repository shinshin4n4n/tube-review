'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

/**
 * 星評価コンポーネント
 * @param rating 現在の評価（1-5）
 * @param onRatingChange 評価変更時のコールバック
 * @param readonly 読み取り専用モード
 * @param size 星のサイズ（px）
 */
export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 24,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="評価">
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= displayRating;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${value}つ星`}
            className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <Star
              size={size}
              className={`transition-colors ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
