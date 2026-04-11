import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types';
import { docToUser } from '../utils/firestoreMappers';

export async function getUserById(userId: string): Promise<User | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  return docToUser(snap);
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'phone' | 'location' | 'avatar'>>
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', userId), updates);
}

export async function isBanned(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.banned ?? false;
}
