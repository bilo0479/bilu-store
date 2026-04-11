import {
  collection, doc, getDocs, setDoc, updateDoc,
  query, where, orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Review } from '../types';
import * as crypto from 'expo-crypto';

export async function fetchReviews(sellerId: string): Promise<Review[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'reviews'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      reviewerId: data.reviewerId ?? '',
      reviewerName: data.reviewerName ?? '',
      reviewerAvatar: data.reviewerAvatar ?? null,
      sellerId: data.sellerId ?? '',
      rating: data.rating ?? 0,
      comment: data.comment ?? '',
      createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
    };
  });
}

export async function submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  if (!db) throw new Error('Firebase is not configured');

  const id = crypto.randomUUID();
  const now = Date.now();
  await setDoc(doc(db, 'reviews', id), { ...review, createdAt: now });
  await recalculateSellerRating(review.sellerId);

  return { ...review, id, createdAt: now };
}

export async function canReview(
  sellerId: string,
  currentUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!db) return { allowed: false, reason: 'Firebase is not configured' };

  if (sellerId === currentUserId) {
    return { allowed: false, reason: 'You cannot review yourself' };
  }

  // Check for duplicate
  const existing = await getDocs(
    query(collection(db, 'reviews'), where('sellerId', '==', sellerId), where('reviewerId', '==', currentUserId))
  );
  if (!existing.empty) {
    return { allowed: false, reason: 'You have already reviewed this seller' };
  }

  // Must have had a prior chat with the seller
  const chats = await getDocs(
    query(collection(db, 'chats'), where('participants', 'array-contains', currentUserId))
  );
  const hadChat = chats.docs.some((d) =>
    ((d.data().participants ?? []) as string[]).includes(sellerId)
  );
  if (!hadChat) {
    return { allowed: false, reason: 'You must have chatted with this seller before leaving a review' };
  }

  return { allowed: true };
}

async function recalculateSellerRating(sellerId: string): Promise<void> {
  if (!db) return;

  const snap = await getDocs(
    query(collection(db, 'reviews'), where('sellerId', '==', sellerId))
  );

  if (snap.size === 0) {
    await updateDoc(doc(db, 'users', sellerId), { averageRating: 0, totalReviews: 0 });
    return;
  }

  let sum = 0;
  snap.docs.forEach((d) => { sum += (d.data().rating as number) ?? 0; });
  const averageRating = Math.round((sum / snap.size) * 10) / 10;

  await updateDoc(doc(db, 'users', sellerId), { averageRating, totalReviews: snap.size });
}
