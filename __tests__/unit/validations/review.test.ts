import { describe, it, expect } from 'vitest';
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewInput,
} from '@/lib/validations/review';

describe('createReviewSchema', () => {
  describe('valid input', () => {
    it('should validate correct review data', () => {
      const validInput: CreateReviewInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
        title: 'Great channel!',
        content: 'This is a great channel with amazing content. I highly recommend it to everyone interested in the topic.',
        isSpoiler: false,
      };

      expect(() => createReviewSchema.parse(validInput)).not.toThrow();
    });

    it('should validate review without optional title', () => {
      const validInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 3,
        content: 'This is a detailed review with at least fifty characters to meet the minimum requirement.',
      };

      expect(() => createReviewSchema.parse(validInput)).not.toThrow();
    });

    it('should default isSpoiler to false when not provided', () => {
      const validInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 4,
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      const result = createReviewSchema.parse(validInput);
      expect(result.isSpoiler).toBe(false);
    });
  });

  describe('invalid channelId', () => {
    it('should reject non-UUID channelId', () => {
      const invalidInput = {
        channelId: 'not-a-uuid',
        rating: 5,
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        '有効なチャンネルIDを指定してください'
      );
    });

    it('should reject missing channelId', () => {
      const invalidInput = {
        rating: 5,
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('invalid rating', () => {
    it('should reject rating < 1', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 0,
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        '評価は1以上でなければなりません'
      );
    });

    it('should reject rating > 5', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 6,
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        '評価は5以下でなければなりません'
      );
    });

    it('should reject non-integer rating', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 4.5,
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        '評価は整数でなければなりません'
      );
    });

    it('should reject missing rating', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('invalid title', () => {
    it('should reject title longer than 100 characters', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
        title: 'a'.repeat(101),
        content: 'This is a review with enough content to pass validation requirements successfully.',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        'タイトルは100文字以内で入力してください'
      );
    });
  });

  describe('invalid content', () => {
    it('should reject content shorter than 50 characters', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
        content: 'Too short',
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        'レビュー本文は50文字以上で入力してください'
      );
    });

    it('should reject content longer than 2000 characters', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
        content: 'a'.repeat(2001),
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow(
        'レビュー本文は2000文字以内で入力してください'
      );
    });

    it('should reject missing content', () => {
      const invalidInput = {
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
      };

      expect(() => createReviewSchema.parse(invalidInput)).toThrow();
    });
  });
});

describe('updateReviewSchema', () => {
  it('should validate correct update data', () => {
    const validInput = {
      rating: 4,
      title: 'Updated title',
      content: 'This is an updated review with enough content to pass validation requirements.',
      isSpoiler: true,
    };

    expect(() => updateReviewSchema.parse(validInput)).not.toThrow();
  });

  it('should reject invalid rating', () => {
    const invalidInput = {
      rating: 0,
      content: 'This is an updated review with enough content to pass validation requirements.',
    };

    expect(() => updateReviewSchema.parse(invalidInput)).toThrow(
      '評価は1以上でなければなりません'
    );
  });
});
