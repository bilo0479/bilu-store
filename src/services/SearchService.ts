import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ALGOLIA_CONFIG, ALGOLIA_INDEX_NAME, isAlgoliaConfigured } from '../config/algolia';
import type { Ad, SearchFilters, PaginatedResult } from '../types';
import { docToAd, rawToAd, PAGE_SIZE } from '../utils/firestoreMappers';

async function searchViaAlgolia(
  queryText: string,
  filters?: SearchFilters
): Promise<PaginatedResult<Ad>> {
  if (!isAlgoliaConfigured) {
    throw new Error('Algolia is not configured');
  }

  const facetFilters: string[] = ['status:ACTIVE'];
  if (filters?.categoryId) facetFilters.push(`category:${filters.categoryId}`);
  if (filters?.condition) facetFilters.push(`condition:${filters.condition}`);

  const numericFilters: string[] = [];
  if (filters?.minPrice !== undefined) numericFilters.push(`price>=${filters.minPrice}`);
  if (filters?.maxPrice !== undefined) numericFilters.push(`price<=${filters.maxPrice}`);

  const response = await fetch(
    `https://${ALGOLIA_CONFIG.appId}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`,
    {
      method: 'POST',
      headers: {
        'X-Algolia-Application-Id': ALGOLIA_CONFIG.appId,
        'X-Algolia-API-Key': ALGOLIA_CONFIG.searchApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: queryText,
        hitsPerPage: PAGE_SIZE,
        facetFilters,
        numericFilters: numericFilters.length > 0 ? numericFilters : undefined,
      }),
    }
  );

  if (!response.ok) throw new Error(`Algolia responded with ${response.status}`);

  const data = await response.json();
  const items: Ad[] = (data.hits ?? []).map((hit: Record<string, unknown>) => rawToAd(hit));

  return { items, cursor: null, hasMore: (data.nbPages ?? 1) > 1 };
}

// Firestore title-prefix fallback when Algolia is unavailable
async function firestoreTitlePrefixSearch(
  queryText: string,
): Promise<PaginatedResult<Ad>> {
  if (!db) return { items: [], cursor: null, hasMore: false };

  const trimmed = queryText.trim();
  const q = query(
    collection(db, 'ads'),
    where('status', '==', 'ACTIVE'),
    where('title', '>=', trimmed),
    where('title', '<=', trimmed + '\uf8ff'),
    orderBy('title'),
    limit(PAGE_SIZE)
  );

  const snapshot = await getDocs(q);
  return { items: snapshot.docs.map(docToAd), cursor: null, hasMore: false };
}

// Tries Algolia first, falls back to Firestore title-prefix search
export async function searchByKeyword(
  queryText: string,
  filters?: SearchFilters
): Promise<PaginatedResult<Ad>> {
  try {
    return await searchViaAlgolia(queryText, filters);
  } catch (err) {
    console.warn('[SearchService] Algolia unavailable, falling back to Firestore:', err);
    if (queryText.trim()) {
      return firestoreTitlePrefixSearch(queryText);
    }
    return browseWithFilters({ ...filters, sortBy: filters?.sortBy ?? 'NEWEST' } as SearchFilters);
  }
}

// Server-side Firestore filters with optional client-side text matching
export async function browseWithFilters(
  filters: SearchFilters,
  cursor?: string,
  searchText?: string
): Promise<PaginatedResult<Ad>> {
  if (!db) return { items: [], cursor: null, hasMore: false };

  const constraints: ReturnType<typeof where>[] = [
    where('status', '==', 'ACTIVE'),
  ];
  if (filters.categoryId) constraints.push(where('category', '==', filters.categoryId));
  if (filters.city) constraints.push(where('location', '==', filters.city));
  if (filters.minPrice !== undefined) constraints.push(where('price', '>=', filters.minPrice));
  if (filters.maxPrice !== undefined) constraints.push(where('price', '<=', filters.maxPrice));
  if (filters.condition) constraints.push(where('condition', '==', filters.condition));

  let sortField = 'createdAt';
  let sortDir: 'asc' | 'desc' = 'desc';
  if (filters.sortBy === 'PRICE_LOW') { sortField = 'price'; sortDir = 'asc'; }
  else if (filters.sortBy === 'PRICE_HIGH') { sortField = 'price'; sortDir = 'desc'; }

  let q = query(
    collection(db, 'ads'),
    ...constraints,
    orderBy(sortField, sortDir),
    limit(PAGE_SIZE + 1)
  );

  if (cursor) {
    const cursorDoc = await getDoc(doc(db, 'ads', cursor));
    if (cursorDoc.exists()) {
      q = query(
        collection(db, 'ads'),
        ...constraints,
        orderBy(sortField, sortDir),
        startAfter(cursorDoc),
        limit(PAGE_SIZE + 1)
      );
    }
  }

  const snapshot = await getDocs(q);
  let items = snapshot.docs.slice(0, PAGE_SIZE).map(docToAd);

  // Client-side text filtering until Algolia is configured
  if (searchText) {
    const lower = searchText.toLowerCase();
    items = items.filter(
      ad => ad.title.toLowerCase().includes(lower) || ad.description.toLowerCase().includes(lower)
    );
  }

  const hasMore = snapshot.docs.length > PAGE_SIZE;
  const lastId = items.length > 0 ? items[items.length - 1].id : null;

  return { items, cursor: lastId, hasMore };
}
