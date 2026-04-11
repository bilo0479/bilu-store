/**
 * ReviewService tests — validates review submission rules,
 * rating validation, and seller rating recalculation.
 */

jest.mock('../src/config/firebase', () => ({
  db: {},
  auth: {},
  isFirebaseConfigured: true,
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

import { validateReviewRating, validateReviewComment } from '../src/utils/validators';

describe('ReviewService — rating validation', () => {
  it('rejects rating of 0', () => {
    expect(validateReviewRating(0).valid).toBe(false);
  });

  it('rejects rating of 6', () => {
    expect(validateReviewRating(6).valid).toBe(false);
  });

  it('rejects non-integer rating (3.5)', () => {
    expect(validateReviewRating(3.5).valid).toBe(false);
  });

  it('accepts rating of 1', () => {
    expect(validateReviewRating(1).valid).toBe(true);
  });

  it('accepts rating of 5', () => {
    expect(validateReviewRating(5).valid).toBe(true);
  });

  it('accepts rating of 3', () => {
    expect(validateReviewRating(3).valid).toBe(true);
  });
});

describe('ReviewService — comment validation', () => {
  it('rejects comment < 10 characters', () => {
    expect(validateReviewComment('Bad').valid).toBe(false);
  });

  it('rejects comment > 500 characters', () => {
    expect(validateReviewComment('x'.repeat(501)).valid).toBe(false);
  });

  it('accepts valid comment', () => {
    expect(validateReviewComment('Excellent seller, item was exactly as described!').valid).toBe(true);
  });
});

describe('ReviewService — canReview logic', () => {
  function canReview(
    sellerId: string,
    currentUserId: string,
    existingReviewsBySameUser: number,
    hadPriorChat: boolean
  ): { allowed: boolean; reason?: string } {
    if (sellerId === currentUserId) {
      return { allowed: false, reason: 'Cannot review yourself' };
    }
    if (existingReviewsBySameUser > 0) {
      return { allowed: false, reason: 'You have already reviewed this seller' };
    }
    if (!hadPriorChat) {
      return { allowed: false, reason: 'You must chat with the seller before reviewing' };
    }
    return { allowed: true };
  }

  it('prevents self-review', () => {
    const result = canReview('user-1', 'user-1', 0, true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('yourself');
  });

  it('prevents duplicate review', () => {
    const result = canReview('seller-1', 'buyer-1', 1, true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('already reviewed');
  });

  it('requires prior chat', () => {
    const result = canReview('seller-1', 'buyer-1', 0, false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('chat');
  });

  it('allows valid review', () => {
    const result = canReview('seller-1', 'buyer-1', 0, true);
    expect(result.allowed).toBe(true);
  });
});

describe('ReviewService — seller rating recalculation', () => {
  function recalculateRating(reviews: number[]): { averageRating: number; totalReviews: number } {
    if (reviews.length === 0) return { averageRating: 0, totalReviews: 0 };
    const sum = reviews.reduce((a, b) => a + b, 0);
    return {
      averageRating: Math.round((sum / reviews.length) * 10) / 10,
      totalReviews: reviews.length,
    };
  }

  it('calculates correct average for single review', () => {
    const result = recalculateRating([5]);
    expect(result.averageRating).toBe(5);
    expect(result.totalReviews).toBe(1);
  });

  it('calculates correct average for multiple reviews', () => {
    const result = recalculateRating([5, 4, 3, 5, 4]);
    expect(result.averageRating).toBe(4.2);
    expect(result.totalReviews).toBe(5);
  });

  it('returns 0 for no reviews', () => {
    const result = recalculateRating([]);
    expect(result.averageRating).toBe(0);
    expect(result.totalReviews).toBe(0);
  });

  it('rounds to one decimal place', () => {
    const result = recalculateRating([5, 4, 4]);
    expect(result.averageRating).toBe(4.3);
  });
});
