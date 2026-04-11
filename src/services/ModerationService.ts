import {
  collection, doc, setDoc, getDocs, updateDoc,
  query, where, orderBy, limit, startAfter, getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { updateStatus } from './AdService';
import type { ReportReasonId, Report, Ad, PaginatedResult } from '../types';
import { docToAd, PAGE_SIZE } from '../utils/firestoreMappers';

// ---------------------------------------------------------------------------
// Mobile user functions
// ---------------------------------------------------------------------------

function createReport(
  targetType: 'AD' | 'USER',
  targetId: string,
  reporterId: string,
  reason: ReportReasonId,
  details?: string
) {
  if (!db) throw new Error('Firebase is not configured');

  const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return setDoc(doc(db, 'reports', reportId), {
    id: reportId,
    reporterId,
    targetType,
    targetId,
    reason,
    details: details ?? null,
    status: 'PENDING',
    adminNote: null,
    createdAt: Date.now(),
    resolvedAt: null,
  });
}

export function reportAd(adId: string, reporterId: string, reason: ReportReasonId, details?: string) {
  return createReport('AD', adId, reporterId, reason, details);
}

export function reportUser(userId: string, reporterId: string, reason: ReportReasonId, details?: string) {
  return createReport('USER', userId, reporterId, reason, details);
}

// ---------------------------------------------------------------------------
// Admin functions
// ---------------------------------------------------------------------------

export async function getPendingReports(cursor?: string): Promise<PaginatedResult<Report>> {
  if (!db) return { items: [], cursor: null, hasMore: false };

  let q = query(
    collection(db, 'reports'),
    where('status', '==', 'PENDING'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE + 1)
  );

  if (cursor) {
    const cursorDoc = await getDoc(doc(db, 'reports', cursor));
    if (cursorDoc.exists()) {
      q = query(
        collection(db, 'reports'),
        where('status', '==', 'PENDING'),
        orderBy('createdAt', 'desc'),
        startAfter(cursorDoc),
        limit(PAGE_SIZE + 1)
      );
    }
  }

  const snap = await getDocs(q);
  const items = snap.docs
    .slice(0, PAGE_SIZE)
    .map((d) => ({ id: d.id, ...d.data() } as Report));
  const hasMore = snap.docs.length > PAGE_SIZE;

  return {
    items,
    cursor: items.length > 0 ? items[items.length - 1].id : null,
    hasMore,
  };
}

export async function getPendingAds(cursor?: string): Promise<PaginatedResult<Ad>> {
  if (!db) return { items: [], cursor: null, hasMore: false };

  let q = query(
    collection(db, 'ads'),
    where('status', '==', 'PENDING_REVIEW'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE + 1)
  );

  if (cursor) {
    const cursorDoc = await getDoc(doc(db, 'ads', cursor));
    if (cursorDoc.exists()) {
      q = query(
        collection(db, 'ads'),
        where('status', '==', 'PENDING_REVIEW'),
        orderBy('createdAt', 'desc'),
        startAfter(cursorDoc),
        limit(PAGE_SIZE + 1)
      );
    }
  }

  const snap = await getDocs(q);
  const items = snap.docs.slice(0, PAGE_SIZE).map(docToAd);
  const hasMore = snap.docs.length > PAGE_SIZE;

  return {
    items,
    cursor: items.length > 0 ? items[items.length - 1].id : null,
    hasMore,
  };
}

export const approveAd = (adId: string) => updateStatus(adId, 'ACTIVE');
export const rejectAd = (adId: string, reason: string) => updateStatus(adId, 'REJECTED', reason);
export const removeAd = (adId: string) => updateStatus(adId, 'REMOVED');

export async function resolveReport(
  reportId: string,
  action: 'RESOLVED' | 'DISMISSED',
  adminNote?: string
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'reports', reportId), {
    status: action,
    adminNote: adminNote ?? null,
    resolvedAt: Date.now(),
  });
}

// Bans a user and removes all their active ads
export async function banUser(userId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');

  await updateDoc(doc(db, 'users', userId), { banned: true });

  const activeAdsSnap = await getDocs(
    query(
      collection(db, 'ads'),
      where('sellerId', '==', userId),
      where('status', '==', 'ACTIVE')
    )
  );

  await Promise.all(
    activeAdsSnap.docs.map((adDoc) =>
      updateDoc(doc(db!, 'ads', adDoc.id), { status: 'REMOVED', updatedAt: Date.now() })
    )
  );
}
