import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface AppUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  location: string | null;
  role: 'USER' | 'ADMIN';
  averageRating: number;
  totalReviews: number;
  totalAds: number;
  banned: boolean;
  pushToken: string | null;
  createdAt: number;
  lastLoginAt: number;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout(): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (!db) throw new Error('Firebase Firestore is not initialized');
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() } as AppUser;
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  return firebaseOnAuthStateChanged(auth, callback);
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  if (!auth) return null;
  return auth.currentUser;
}
