import {
  validateAdTitle,
  validateAdDescription,
  validateAdPrice,
  validateAdImages,
  validateLocation,
  validateReviewRating,
  validateReviewComment,
} from '../src/utils/validators';

describe('validateAdTitle', () => {
  it('rejects empty title', () => {
    expect(validateAdTitle('').valid).toBe(false);
    expect(validateAdTitle('').error).toBe('Title is required');
  });

  it('rejects title < 5 characters', () => {
    const r = validateAdTitle('abc');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Title must be at least 5 characters');
  });

  it('rejects title > 100 characters', () => {
    const r = validateAdTitle('a'.repeat(101));
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Title must be 100 characters or less');
  });

  it('accepts valid title', () => {
    expect(validateAdTitle('iPhone 15 Pro Max').valid).toBe(true);
  });

  it('accepts title at boundary (5 chars)', () => {
    expect(validateAdTitle('Hello').valid).toBe(true);
  });

  it('accepts title at boundary (100 chars)', () => {
    expect(validateAdTitle('a'.repeat(100)).valid).toBe(true);
  });
});

describe('validateAdDescription', () => {
  it('rejects empty description', () => {
    expect(validateAdDescription('').valid).toBe(false);
    expect(validateAdDescription('').error).toBe('Description is required');
  });

  it('rejects description < 20 characters', () => {
    const r = validateAdDescription('short desc');
    expect(r.valid).toBe(false);
  });

  it('rejects description > 2000 characters', () => {
    const r = validateAdDescription('a'.repeat(2001));
    expect(r.valid).toBe(false);
  });

  it('accepts valid description', () => {
    expect(validateAdDescription('This is a perfectly valid description for a product listing.').valid).toBe(true);
  });
});

describe('validateAdPrice', () => {
  it('rejects negative price', () => {
    expect(validateAdPrice(-5).valid).toBe(false);
    expect(validateAdPrice(-5).error).toBe('Price cannot be negative');
  });

  it('accepts zero (free)', () => {
    expect(validateAdPrice(0).valid).toBe(true);
  });

  it('accepts normal price', () => {
    expect(validateAdPrice(1500).valid).toBe(true);
  });

  it('rejects NaN from string', () => {
    expect(validateAdPrice('abc').valid).toBe(false);
  });

  it('parses numeric strings', () => {
    expect(validateAdPrice('99.99').valid).toBe(true);
  });

  it('rejects excessively high price', () => {
    expect(validateAdPrice(100000000).valid).toBe(false);
  });
});

describe('validateAdImages', () => {
  it('rejects 0 images', () => {
    const r = validateAdImages(0);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Add at least one photo');
  });

  it('rejects > 8 images', () => {
    const r = validateAdImages(9);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Maximum 8 photos allowed');
  });

  it('accepts 1 image', () => {
    expect(validateAdImages(1).valid).toBe(true);
  });

  it('accepts 8 images', () => {
    expect(validateAdImages(8).valid).toBe(true);
  });
});

describe('validateLocation', () => {
  it('rejects empty location', () => {
    expect(validateLocation('').valid).toBe(false);
  });

  it('rejects whitespace-only', () => {
    expect(validateLocation('   ').valid).toBe(false);
  });

  it('accepts valid location', () => {
    expect(validateLocation('Addis Ababa').valid).toBe(true);
  });
});

describe('validateReviewRating', () => {
  it('rejects 0', () => {
    expect(validateReviewRating(0).valid).toBe(false);
  });

  it('rejects 6', () => {
    expect(validateReviewRating(6).valid).toBe(false);
  });

  it('rejects non-integer', () => {
    expect(validateReviewRating(3.5).valid).toBe(false);
  });

  it('accepts 1', () => {
    expect(validateReviewRating(1).valid).toBe(true);
  });

  it('accepts 5', () => {
    expect(validateReviewRating(5).valid).toBe(true);
  });
});

describe('validateReviewComment', () => {
  it('rejects < 10 characters', () => {
    expect(validateReviewComment('short').valid).toBe(false);
  });

  it('rejects > 500 characters', () => {
    expect(validateReviewComment('a'.repeat(501)).valid).toBe(false);
  });

  it('accepts valid comment', () => {
    expect(validateReviewComment('Great seller, fast delivery!').valid).toBe(true);
  });
});
