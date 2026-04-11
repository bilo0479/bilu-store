import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ReportReasonId =
  | 'SPAM'
  | 'PROHIBITED_ITEM'
  | 'SCAM'
  | 'WRONG_CATEGORY'
  | 'DUPLICATE'
  | 'OFFENSIVE'
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'AD' | 'USER';
  targetId: string;
  reason: ReportReasonId;
  details: string | null;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

const REASON_LABELS: Record<ReportReasonId, string> = {
  SPAM: 'Spam or misleading',
  PROHIBITED_ITEM: 'Prohibited item',
  SCAM: 'Suspected scam',
  WRONG_CATEGORY: 'Wrong category',
  DUPLICATE: 'Duplicate listing',
  OFFENSIVE: 'Offensive content',
  OTHER: 'Other',
};

export function getReasonLabel(reason: ReportReasonId): string {
  return REASON_LABELS[reason] ?? reason;
}

function getFirestore() {
  if (!db) throw new Error('Firebase Firestore is not initialized');
  return db;
}

export async function getActiveReportsCount(): Promise<number> {
  const firestore = getFirestore();
  const q = query(
    collection(firestore, 'reports'),
    where('status', '==', 'PENDING')
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getPendingReports(
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ reports: Report[]; lastVisible: DocumentSnapshot | null }> {
  const firestore = getFirestore();
  let q = query(
    collection(firestore, 'reports'),
    where('status', '==', 'PENDING'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(firestore, 'reports'),
      where('status', '==', 'PENDING'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const reports: Report[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Report[];

  const lastVisible = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { reports, lastVisible };
}

export async function resolveReport(
  reportId: string,
  adminNote?: string
): Promise<void> {
  const firestore = getFirestore();
  await updateDoc(doc(firestore, 'reports', reportId), {
    status: 'RESOLVED',
    adminNote: adminNote?.trim() || null,
    resolvedAt: Date.now(),
  });
}

export async function dismissReport(
  reportId: string,
  adminNote?: string
): Promise<void> {
  const firestore = getFirestore();
  await updateDoc(doc(firestore, 'reports', reportId), {
    status: 'DISMISSED',
    adminNote: adminNote?.trim() || null,
    resolvedAt: Date.now(),
  });
}
