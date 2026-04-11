import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PremiumTier, PremiumAd, PremiumTierId, Currency } from '../types';

const DEFAULT_TIERS: PremiumTier[] = [
  { id: 'FEATURED', name: 'Featured Listing', durationDays: 7, description: 'Gold border + Featured badge + top of category', price: 0, currency: 'ETB' },
  { id: 'TOP_SEARCH', name: 'Top Search Placement', durationDays: 7, description: 'Appears in first 3 results for category', price: 0, currency: 'ETB' },
  { id: 'HOMEPAGE', name: 'Homepage Spotlight', durationDays: 3, description: 'Appears in Spotlight carousel on home screen', price: 0, currency: 'ETB' },
  { id: 'HIGHLIGHT', name: 'Highlighted', durationDays: 7, description: 'Colored background in listing feed', price: 0, currency: 'ETB' },
];

export async function getAvailableTiers(): Promise<PremiumTier[]> {
  if (!db) return DEFAULT_TIERS;
  const configDoc = await getDoc(doc(db, 'config', 'premium_pricing'));
  if (configDoc.exists()) {
    return (configDoc.data().tiers as PremiumTier[]) ?? DEFAULT_TIERS;
  }
  return DEFAULT_TIERS;
}

// Creates a PENDING_PAYMENT boost. Activation happens via Cloud Function or admin.
export async function boostAd(adId: string, tierId: PremiumTierId, sellerId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');

  const tier = (await getAvailableTiers()).find((t) => t.id === tierId);
  if (!tier) throw new Error('Invalid premium tier');

  const premiumId = `${adId}_${tierId}_${Date.now()}`;
  await setDoc(doc(db, 'premium_ads', premiumId), {
    id: premiumId,
    adId,
    sellerId,
    tierId,
    status: 'PENDING_PAYMENT',
    startDate: null,
    endDate: null,
    createdAt: Date.now(),
  });
}

export async function getActiveBoost(adId: string): Promise<PremiumAd | null> {
  if (!db) return null;
  const q = query(
    collection(db, 'premium_ads'),
    where('adId', '==', adId),
    where('status', '==', 'ACTIVE')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as PremiumAd;
}

export async function expireBoost(premiumAdId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'premium_ads', premiumAdId), { status: 'EXPIRED' });
}
