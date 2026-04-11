import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  addDoc,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AdStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SOLD'
  | 'EXPIRED'
  | 'REJECTED'
  | 'REMOVED';

export type CategoryId =
  | 'ELECTRONICS' | 'VEHICLES' | 'REAL_ESTATE' | 'FASHION'
  | 'HOME_FURNITURE' | 'JOBS' | 'SERVICES' | 'EDUCATION'
  | 'SPORTS' | 'OTHER';

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'ETB' | 'USD';
  category: CategoryId;
  subcategory: string | null;
  images: string[];
  thumbnails: string[];
  location: string;
  coordinates: { lat: number; lng: number } | null;
  condition: 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR' | null;
  contactPreference: 'CHAT_ONLY' | 'CHAT_AND_PHONE';
  negotiable: boolean;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string | null;
  status: AdStatus;
  rejectionReason: string | null;
  isPremium: boolean;
  premiumTier: string | null;
  viewCount: number;
  favoriteCount: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

function getFirestore() {
  if (!db) throw new Error('Firebase Firestore is not initialized');
  return db;
}

export async function getRecentAds(count: number = 20): Promise<Ad[]> {
  const firestore = getFirestore();
  const q = query(
    collection(firestore, 'ads'),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Ad[];
}

export async function getTotalAdsCount(): Promise<number> {
  const firestore = getFirestore();
  const snapshot = await getCountFromServer(collection(firestore, 'ads'));
  return snapshot.data().count;
}

export async function getPendingAdsCount(): Promise<number> {
  const firestore = getFirestore();
  const q = query(
    collection(firestore, 'ads'),
    where('status', '==', 'PENDING_REVIEW')
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getPendingAds(
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ ads: Ad[]; lastVisible: DocumentSnapshot | null }> {
  const firestore = getFirestore();
  let q = query(
    collection(firestore, 'ads'),
    where('status', '==', 'PENDING_REVIEW'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(firestore, 'ads'),
      where('status', '==', 'PENDING_REVIEW'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const ads: Ad[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Ad[];

  const lastVisible = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { ads, lastVisible };
}

export async function approveAd(adId: string): Promise<void> {
  const firestore = getFirestore();
  const adRef = doc(firestore, 'ads', adId);
  await updateDoc(adRef, {
    status: 'ACTIVE',
    updatedAt: Date.now(),
  });

  await addDoc(collection(firestore, `ads/${adId}/status_history`), {
    fromStatus: 'PENDING_REVIEW',
    toStatus: 'ACTIVE',
    changedAt: serverTimestamp(),
    changedBy: 'admin',
    reason: null,
  });
}

export async function rejectAd(adId: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error('Rejection reason is required');

  const firestore = getFirestore();
  const adRef = doc(firestore, 'ads', adId);
  await updateDoc(adRef, {
    status: 'REJECTED',
    rejectionReason: reason.trim(),
    updatedAt: Date.now(),
  });

  await addDoc(collection(firestore, `ads/${adId}/status_history`), {
    fromStatus: 'PENDING_REVIEW',
    toStatus: 'REJECTED',
    changedAt: serverTimestamp(),
    changedBy: 'admin',
    reason: reason.trim(),
  });
}

export async function removeAd(adId: string): Promise<void> {
  const firestore = getFirestore();
  const adRef = doc(firestore, 'ads', adId);
  const adSnap = await getDoc(adRef);
  const currentStatus = adSnap.data()?.status ?? 'UNKNOWN';

  await updateDoc(adRef, {
    status: 'REMOVED',
    updatedAt: Date.now(),
  });

  await addDoc(collection(firestore, `ads/${adId}/status_history`), {
    fromStatus: currentStatus,
    toStatus: 'REMOVED',
    changedAt: serverTimestamp(),
    changedBy: 'admin',
    reason: 'Removed by admin',
  });
}

export async function getAdById(adId: string): Promise<Ad | null> {
  const firestore = getFirestore();
  const adSnap = await getDoc(doc(firestore, 'ads', adId));
  if (!adSnap.exists()) return null;
  return { id: adSnap.id, ...adSnap.data() } as Ad;
}

export async function getAdsByCategory(
  categoryId: CategoryId,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ ads: Ad[]; lastVisible: DocumentSnapshot | null }> {
  const firestore = getFirestore();
  let q = query(
    collection(firestore, 'ads'),
    where('category', '==', categoryId),
    where('status', '==', 'ACTIVE'),
    orderBy('isPremium', 'desc'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(firestore, 'ads'),
      where('category', '==', categoryId),
      where('status', '==', 'ACTIVE'),
      orderBy('isPremium', 'desc'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const ads: Ad[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Ad[];

  const lastVisible = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { ads, lastVisible };
}

// ── Premium boost management ──────────────────────────────────────────────

export interface PremiumBoost {
  id: string;
  adId: string;
  adTitle: string;
  sellerId: string;
  sellerName: string;
  tierId: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt: number;
  startDate: number | null;
  endDate: number | null;
}

export async function getPendingPremiumBoosts(
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ boosts: PremiumBoost[]; lastVisible: DocumentSnapshot | null }> {
  const firestore = getFirestore();
  let q = query(
    collection(firestore, 'premium_ads'),
    where('status', '==', 'PENDING_PAYMENT'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(firestore, 'premium_ads'),
      where('status', '==', 'PENDING_PAYMENT'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const boosts: PremiumBoost[] = [];

  for (const d of snapshot.docs) {
    const data = d.data();
    // Fetch ad title for display
    let adTitle = data.adId as string;
    try {
      const adSnap = await getDoc(doc(firestore, 'ads', data.adId as string));
      adTitle = (adSnap.data()?.title as string) ?? adTitle;
    } catch {
      // ad may have been removed
    }
    boosts.push({
      id: d.id,
      adId: data.adId as string,
      adTitle,
      sellerId: data.sellerId as string,
      sellerName: (data.sellerName as string) ?? 'Unknown',
      tierId: data.tierId as string,
      status: data.status as PremiumBoost['status'],
      createdAt: data.createdAt as number,
      startDate: (data.startDate as number) ?? null,
      endDate: (data.endDate as number) ?? null,
    });
  }

  const lastVisible = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { boosts, lastVisible };
}

// Duration per tier ID as defined in the PRP (Section 2.3)
const TIER_DURATION_DAYS: Record<string, number> = {
  FEATURED: 7,
  TOP_SEARCH: 7,
  HOMEPAGE: 3,
  HIGHLIGHT: 7,
};

export async function activatePremiumBoost(
  premiumAdId: string,
  adId: string,
  tierId: string
): Promise<void> {
  const firestore = getFirestore();
  const durationDays = TIER_DURATION_DAYS[tierId] ?? 7;
  const startDate = Date.now();
  const endDate = startDate + durationDays * 24 * 60 * 60 * 1000;

  // Update premium_ads document
  await updateDoc(doc(firestore, 'premium_ads', premiumAdId), {
    status: 'ACTIVE',
    startDate,
    endDate,
    activatedAt: serverTimestamp(),
    activatedBy: 'admin',
  });

  // Update the ad to reflect premium status
  await updateDoc(doc(firestore, 'ads', adId), {
    isPremium: true,
    premiumTier: tierId,
    updatedAt: Date.now(),
  });
}

export async function cancelPremiumBoost(
  premiumAdId: string,
  adId: string
): Promise<void> {
  const firestore = getFirestore();

  await updateDoc(doc(firestore, 'premium_ads', premiumAdId), {
    status: 'CANCELLED',
    cancelledAt: serverTimestamp(),
    cancelledBy: 'admin',
  });

  await updateDoc(doc(firestore, 'ads', adId), {
    isPremium: false,
    premiumTier: null,
    updatedAt: Date.now(),
  });
}

export async function getAdsBySeller(
  sellerId: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ ads: Ad[]; lastVisible: DocumentSnapshot | null }> {
  const firestore = getFirestore();
  let q = query(
    collection(firestore, 'ads'),
    where('sellerId', '==', sellerId),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(firestore, 'ads'),
      where('sellerId', '==', sellerId),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const ads: Ad[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Ad[];

  const lastVisible = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { ads, lastVisible };
}
