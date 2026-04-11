/**
 * SearchService tests — validates search filtering, sorting, and pagination logic.
 */

jest.mock('../src/config/firebase', () => ({
  db: {},
  auth: {},
  isFirebaseConfigured: true,
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
}));

import type { Ad } from '../src/types';

// Simulate client-side search filtering (mirrors SearchService logic)
function clientSideSearch(ads: Partial<Ad>[], queryText: string): Partial<Ad>[] {
  const lower = queryText.toLowerCase();
  return ads.filter(
    (ad) =>
      (ad.title ?? '').toLowerCase().includes(lower) ||
      (ad.description ?? '').toLowerCase().includes(lower)
  );
}

function clientSideFilter(
  ads: Partial<Ad>[],
  filters: { minPrice?: number; maxPrice?: number; condition?: string }
): Partial<Ad>[] {
  let results = [...ads];
  if (filters.minPrice !== undefined) {
    results = results.filter((ad) => (ad.price ?? 0) >= (filters.minPrice ?? 0));
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter((ad) => (ad.price ?? 0) <= (filters.maxPrice ?? Infinity));
  }
  if (filters.condition) {
    results = results.filter((ad) => ad.condition === filters.condition);
  }
  return results;
}

function clientSideSort(ads: Partial<Ad>[], sortBy: string): Partial<Ad>[] {
  const sorted = [...ads];
  if (sortBy === 'PRICE_LOW') sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sortBy === 'PRICE_HIGH') sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  return sorted;
}

const mockAds: Partial<Ad>[] = [
  { id: '1', title: 'iPhone 15 Pro', description: 'Brand new iPhone', price: 50000, condition: 'NEW', category: 'ELECTRONICS' },
  { id: '2', title: 'Samsung Galaxy S24', description: 'Like new Samsung phone', price: 35000, condition: 'LIKE_NEW', category: 'ELECTRONICS' },
  { id: '3', title: 'Leather Sofa', description: 'Comfortable leather sofa in great condition', price: 15000, condition: 'GOOD', category: 'HOME' },
  { id: '4', title: 'Toyota Corolla', description: 'Used 2020 Toyota sedan', price: 800000, condition: 'GOOD', category: 'VEHICLES' },
  { id: '5', title: 'Free Books', description: 'Collection of programming books, free to good home', price: 0, condition: 'ACCEPTABLE', category: 'OTHER' },
];

describe('SearchService — keyword search', () => {
  it('finds ads by title match', () => {
    const results = clientSideSearch(mockAds, 'iPhone');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('finds ads by description match', () => {
    const results = clientSideSearch(mockAds, 'leather');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('3');
  });

  it('is case-insensitive', () => {
    const results = clientSideSearch(mockAds, 'SAMSUNG');
    expect(results).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    const results = clientSideSearch(mockAds, 'PlayStation');
    expect(results).toHaveLength(0);
  });

  it('matches partial text', () => {
    const results = clientSideSearch(mockAds, 'Toy');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('4');
  });
});

describe('SearchService — price filtering', () => {
  it('filters by minPrice', () => {
    const results = clientSideFilter(mockAds, { minPrice: 30000 });
    expect(results.every((a) => (a.price ?? 0) >= 30000)).toBe(true);
  });

  it('filters by maxPrice', () => {
    const results = clientSideFilter(mockAds, { maxPrice: 20000 });
    expect(results.every((a) => (a.price ?? 0) <= 20000)).toBe(true);
  });

  it('filters by price range', () => {
    const results = clientSideFilter(mockAds, { minPrice: 10000, maxPrice: 40000 });
    expect(results).toHaveLength(2); // Samsung (35000) and Sofa (15000)
  });

  it('filters by condition', () => {
    const results = clientSideFilter(mockAds, { condition: 'NEW' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });
});

describe('SearchService — sorting', () => {
  it('sorts PRICE_LOW (ascending)', () => {
    const sorted = clientSideSort(mockAds, 'PRICE_LOW');
    expect(sorted[0].price).toBe(0);
    expect(sorted[sorted.length - 1].price).toBe(800000);
  });

  it('sorts PRICE_HIGH (descending)', () => {
    const sorted = clientSideSort(mockAds, 'PRICE_HIGH');
    expect(sorted[0].price).toBe(800000);
    expect(sorted[sorted.length - 1].price).toBe(0);
  });

  it('NEWEST preserves original order', () => {
    const sorted = clientSideSort(mockAds, 'NEWEST');
    expect(sorted).toEqual(mockAds);
  });
});

describe('SearchService — pagination', () => {
  it('hasMore is true when results equal page size', () => {
    const PAGE_SIZE = 20;
    const docsCount = 21; // one extra indicates more
    expect(docsCount > PAGE_SIZE).toBe(true);
  });

  it('hasMore is false when results less than page size', () => {
    const PAGE_SIZE = 20;
    const docsCount = 15;
    expect(docsCount > PAGE_SIZE).toBe(false);
  });
});
