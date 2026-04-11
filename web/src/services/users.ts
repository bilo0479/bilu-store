import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from './auth';

function getFirestore() {
  if (!db) throw new Error('Firebase Firestore is not initialized');
  return db;
}

export async function getTotalUsersCount(): Promise<number> {
  const firestore = getFirestore();
  const snapshot = await getCountFromServer(collection(firestore, 'users'));
  return snapshot.data().count;
}

export async function getUsers(
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ users: AppUser[]; lastVisible: DocumentSnapshot | null }> {
  const firestore = getFirestore();
  let q = query(
    collection(firestore, 'users'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(firestore, 'users'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const users: AppUser[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as AppUser[];

  const lastVisible = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { users, lastVisible };
}

export async function getUserById(uid: string): Promise<AppUser | null> {
  const firestore = getFirestore();
  const userSnap = await getDoc(doc(firestore, 'users', uid));
  if (!userSnap.exists()) return null;
  return { id: userSnap.id, ...userSnap.data() } as AppUser;
}

export async function banUser(uid: string): Promise<void> {
  const firestore = getFirestore();
  await updateDoc(doc(firestore, 'users', uid), {
    banned: true,
  });
}

export async function unbanUser(uid: string): Promise<void> {
  const firestore = getFirestore();
  await updateDoc(doc(firestore, 'users', uid), {
    banned: false,
  });
}
