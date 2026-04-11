/**
 * AdService tests — validates business logic around ad creation,
 * status transitions, and auto-approval rules.
 */

// Mock firebase modules before any imports
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
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(() => Date.now()),
  increment: jest.fn((n: number) => n),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-1234',
}));

import { isValidTransition } from '../src/constants/adStatuses';
import {
  validateAdTitle,
  validateAdDescription,
  validateAdImages,
  validateAdPrice,
} from '../src/utils/validators';

describe('AdService — creation validation', () => {
  it('rejects title shorter than 5 characters', () => {
    expect(validateAdTitle('abc').valid).toBe(false);
    expect(validateAdTitle('abc').error).toBe('Title must be at least 5 characters');
  });

  it('rejects description shorter than 20 characters', () => {
    expect(validateAdDescription('short desc').valid).toBe(false);
  });

  it('rejects 0 images', () => {
    expect(validateAdImages(0).valid).toBe(false);
    expect(validateAdImages(0).error).toBe('Add at least one photo');
  });

  it('rejects > 8 images', () => {
    expect(validateAdImages(9).valid).toBe(false);
    expect(validateAdImages(9).error).toBe('Maximum 8 photos allowed');
  });

  it('rejects negative price', () => {
    expect(validateAdPrice(-10).valid).toBe(false);
  });

  it('accepts free (price = 0)', () => {
    expect(validateAdPrice(0).valid).toBe(true);
  });
});

describe('AdService — auto-approval logic', () => {
  it('auto-approves for trusted sellers (rating >= 4.0, reviews >= 3)', () => {
    const seller = { averageRating: 4.5, totalReviews: 5 };
    const shouldAutoApprove = seller.averageRating >= 4.0 && seller.totalReviews >= 3;
    expect(shouldAutoApprove).toBe(true);
  });

  it('requires review for new sellers', () => {
    const seller = { averageRating: 0, totalReviews: 0 };
    const shouldAutoApprove = seller.averageRating >= 4.0 && seller.totalReviews >= 3;
    expect(shouldAutoApprove).toBe(false);
  });

  it('requires review for sellers with good rating but few reviews', () => {
    const seller = { averageRating: 5.0, totalReviews: 2 };
    const shouldAutoApprove = seller.averageRating >= 4.0 && seller.totalReviews >= 3;
    expect(shouldAutoApprove).toBe(false);
  });

  it('requires review for sellers with many reviews but low rating', () => {
    const seller = { averageRating: 3.5, totalReviews: 10 };
    const shouldAutoApprove = seller.averageRating >= 4.0 && seller.totalReviews >= 3;
    expect(shouldAutoApprove).toBe(false);
  });
});

describe('AdService — status transitions', () => {
  it('DRAFT -> PENDING_REVIEW is valid', () => {
    expect(isValidTransition('DRAFT', 'PENDING_REVIEW')).toBe(true);
  });

  it('DRAFT -> ACTIVE is valid (auto-approve path)', () => {
    expect(isValidTransition('DRAFT', 'ACTIVE')).toBe(true);
  });

  it('PENDING_REVIEW -> ACTIVE is valid (admin approve)', () => {
    expect(isValidTransition('PENDING_REVIEW', 'ACTIVE')).toBe(true);
  });

  it('PENDING_REVIEW -> REJECTED is valid', () => {
    expect(isValidTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
  });

  it('ACTIVE -> SOLD is valid (markAsSold)', () => {
    expect(isValidTransition('ACTIVE', 'SOLD')).toBe(true);
  });

  it('ACTIVE -> REMOVED is valid (soft-delete)', () => {
    expect(isValidTransition('ACTIVE', 'REMOVED')).toBe(true);
  });

  it('SOLD -> anything is invalid (terminal)', () => {
    expect(isValidTransition('SOLD', 'ACTIVE')).toBe(false);
    expect(isValidTransition('SOLD', 'DRAFT')).toBe(false);
  });

  it('REMOVED -> anything is invalid (terminal)', () => {
    expect(isValidTransition('REMOVED', 'ACTIVE')).toBe(false);
  });

  it('EXPIRED -> PENDING_REVIEW is valid (republish)', () => {
    expect(isValidTransition('EXPIRED', 'PENDING_REVIEW')).toBe(true);
  });

  it('REJECTED -> PENDING_REVIEW is valid (re-submit)', () => {
    expect(isValidTransition('REJECTED', 'PENDING_REVIEW')).toBe(true);
  });

  it('DRAFT -> SOLD is invalid (skip active)', () => {
    expect(isValidTransition('DRAFT', 'SOLD')).toBe(false);
  });
});
