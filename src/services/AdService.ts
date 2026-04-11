import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, limit, startAfter,
  increment,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Ad, AdStatus, CreateAdInput, UpdateAdInput, PaginatedResult, CategoryId, SearchFilters } from '../types';
import { isValidTransition } from '../constants/adStatuses';
import { docToAd, PAGE_SIZE } from '../utils/firestoreMappers';
import * as crypto from 'expo-crypto';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function fetchHomeFeed(
  cursorDoc?: QueryDocumentSnapshot | null
): Promise<PaginatedResult<Ad> & { lastDoc: QueryDocumentSnapshot | null }> {
  if (!db) return { items: [], cursor: null, hasMore: false, lastDoc: null };

  let q = query(
    collection(db, 'ads'),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  if (cursorDoc) {
    q = query(q, startAfter(cursorDoc));
  }

  const snap = await getDocs(q);
  const items = snap.docs.map(docToAd);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { items, cursor: lastDoc?.id ?? null, hasMore: snap.docs.length === PAGE_SIZE, lastDoc };
}

export async function fetchAdsByCategory(
  categoryId: CategoryId,
  cursorDoc?: QueryDocumentSnapshot | null
): Promise<PaginatedResult<Ad> & { lastDoc: QueryDocumentSnapshot | null }> {
  if (!db) return { items: [], cursor: null, hasMore: false, lastDoc: null };

  // Premium ads sort first, then newest
  let q = query(
    collection(db, 'ads'),
    where('status', '==', 'ACTIVE'),
    where('category', '==', categoryId),
    orderBy('isPremium', 'desc'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  if (cursorDoc) {
    q = query(q, startAfter(cursorDoc));
  }

  const snap = await getDocs(q);
  const items = snap.docs.map(docToAd);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { items, cursor: lastDoc?.id ?? null, hasMore: snap.docs.length === PAGE_SIZE, lastDoc };
}

export async function fetchAdById(id: string): Promise<Ad | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'ads', id));
  if (!snap.exists()) return null;
  return docToAd(snap);
}

export async function fetchUserAds(userId: string): Promise<Ad[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'ads'),
    where('sellerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToAd);
}

export async function createAd(
  input: CreateAdInput,
  seller: { id: string; name: string; avatar: string | null; averageRating: number; totalReviews: number }
): Promise<Ad> {
  if (!db) throw new Error('Firebase is not configured');

  const id = crypto.randomUUID();
  const autoApprove = seller.averageRating >= 4.0 && seller.totalReviews >= 3;
  const now = Date.now();

  const ad: Omit<Ad, 'id'> = {
    ...input,
    subcategory: input.subcategory ?? null,
    coordinates: input.coordinates ?? null,
    condition: input.condition ?? null,
    thumbnails: input.images,
    sellerId: seller.id,
    sellerName: seller.name,
    sellerAvatar: seller.avatar,
    status: autoApprove ? 'ACTIVE' : 'PENDING_REVIEW',
    rejectionReason: null,
    isPremium: false,
    premiumTier: null,
    viewCount: 0,
    favoriteCount: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + THIRTY_DAYS_MS,
  };

  await setDoc(doc(db, 'ads', id), ad);
  return { id, ...ad };
}

export async function updateAd(id: string, updates: UpdateAdInput): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ads', id), { ...updates, updatedAt: Date.now() });
}

// Soft-delete: preserves the document for audit/reporting
export async function deleteAd(id: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ads', id), { status: 'REMOVED', updatedAt: Date.now() });
}

export async function incrementViewCount(id: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ads', id), { viewCount: increment(1) });
}

export async function searchAds(queryText: string, filters: SearchFilters): Promise<Ad[]> {
  if (!db) return [];

  let q = query(
    collection(db, 'ads'),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  if (filters.categoryId) {
    q = query(
      collection(db, 'ads'),
      where('status', '==', 'ACTIVE'),
      where('category', '==', filters.categoryId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(docToAd);

  // Client-side text filtering
  if (queryText.trim()) {
    const lower = queryText.toLowerCase();
    results = results.filter(
      ad => ad.title.toLowerCase().includes(lower) || ad.description.toLowerCase().includes(lower)
    );
  }

  if (filters.minPrice !== undefined) {
    results = results.filter(ad => ad.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter(ad => ad.price <= filters.maxPrice!);
  }
  if (filters.condition) {
    results = results.filter(ad => ad.condition === filters.condition);
  }

  if (filters.sortBy === 'PRICE_LOW') results.sort((a, b) => a.price - b.price);
  else if (filters.sortBy === 'PRICE_HIGH') results.sort((a, b) => b.price - a.price);

  return results;
}

// ---------------------------------------------------------------------------
// Status management
// ---------------------------------------------------------------------------

export async function updateStatus(
  adId: string,
  newStatus: AdStatus,
  reason?: string
): Promise<void> {
  if (!db) return;

  const snap = await getDoc(doc(db, 'ads', adId));
  if (!snap.exists()) throw new Error('Ad not found');

  const currentStatus = (snap.data().status as AdStatus) ?? 'DRAFT';
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: Date.now(),
  };
  if (reason !== undefined) updates.rejectionReason = reason;
  if (newStatus === 'ACTIVE') updates.rejectionReason = null;

  await updateDoc(doc(db, 'ads', adId), updates);

  // Audit trail
  await addDoc(collection(db, 'ads', adId, 'status_history'), {
    fromStatus: currentStatus,
    toStatus: newStatus,
    changedBy: auth?.currentUser?.uid ?? 'system',
    reason: reason ?? null,
    changedAt: Date.now(),
  });
}

export async function markAsSold(adId: string): Promise<void> {
  await updateStatus(adId, 'SOLD');
}

export async function republishAd(adId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');

  const snap = await getDoc(doc(db, 'ads', adId));
  if (!snap.exists()) throw new Error('Ad not found');

  const currentStatus = (snap.data().status as AdStatus) ?? 'DRAFT';
  if (!isValidTransition(currentStatus, 'PENDING_REVIEW')) {
    throw new Error(`Cannot republish ad with status ${currentStatus}`);
  }

  await updateDoc(doc(db, 'ads', adId), {
    status: 'PENDING_REVIEW',
    rejectionReason: null,
    updatedAt: Date.now(),
    expiresAt: Date.now() + THIRTY_DAYS_MS,
  });
}

export async function getFeaturedAds(maxItems: number = 10): Promise<Ad[]> {
  if (!db) return [];

  const q = query(
    collection(db, 'ads'),
    where('status', '==', 'ACTIVE'),
    where('isPremium', '==', true),
    where('premiumTier', '==', 'HOMEPAGE'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToAd);
}
