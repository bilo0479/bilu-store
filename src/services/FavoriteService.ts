import {
  collection, doc, setDoc, deleteDoc, getDocs, getDoc,
  query, where, orderBy, limit, startAfter, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Ad, PaginatedResult } from '../types';
import { docToAd, PAGE_SIZE } from '../utils/firestoreMappers';

export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  if (!db) return [];
  const q = query(collection(db, 'favorites'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().adId as string);
}

export async function addFavorite(userId: string, adId: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'favorites', `${userId}_${adId}`), { userId, adId, savedAt: Date.now() });
}

export async function removeFavorite(userId: string, adId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'favorites', `${userId}_${adId}`));
}

export async function isFavorited(userId: string, adId: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'favorites', `${userId}_${adId}`));
  return snap.exists();
}

// Joins favorites -> ads to return full Ad objects, paginated by savedAt DESC
export async function getMyFavorites(
  userId: string,
  cursor?: string
): Promise<PaginatedResult<Ad>> {
  if (!db) return { items: [], cursor: null, hasMore: false };

  let q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
    orderBy('savedAt', 'desc'),
    limit(PAGE_SIZE + 1)
  );

  if (cursor) {
    const cursorDoc = await getDoc(doc(db, 'favorites', cursor));
    if (cursorDoc.exists()) {
      q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        orderBy('savedAt', 'desc'),
        startAfter(cursorDoc),
        limit(PAGE_SIZE + 1)
      );
    }
  }

  const favSnap = await getDocs(q);
  const favDocs = favSnap.docs.slice(0, PAGE_SIZE);
  const hasMore = favSnap.docs.length > PAGE_SIZE;

  const items: Ad[] = [];
  for (const favDoc of favDocs) {
    const adId = favDoc.data().adId as string;
    const adSnap = await getDoc(doc(db, 'ads', adId));
    if (adSnap.exists()) {
      items.push(docToAd(adSnap));
    }
  }

  return {
    items,
    cursor: favDocs.length > 0 ? favDocs[favDocs.length - 1].id : null,
    hasMore,
  };
}

export function subscribeToFavoriteStatus(
  userId: string,
  adId: string,
  callback: (isFav: boolean) => void
): () => void {
  if (!db) {
    callback(false);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'favorites', `${userId}_${adId}`),
    (snap) => callback(snap.exists()),
    () => callback(false) // on error, assume not favorited
  );
}
