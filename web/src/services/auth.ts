import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

// Creates the Firestore user doc on first social sign-in, updates lastLoginAt on return visits
async function upsertSocialUser(
  firebaseUser: FirebaseUser,
  overrides: { name: string; email: string | null; avatar: string | null }
): Promise<AppUser> {
  if (!db) throw new Error('Firebase Firestore is not initialized');
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { lastLoginAt: Date.now() });
    return { id: snap.id, ...snap.data() } as AppUser;
  }

  const userData: Omit<AppUser, 'id'> = {
    name: overrides.name,
    email: overrides.email,
    phone: null,
    avatar: overrides.avatar,
    location: null,
    role: 'USER',
    averageRating: 0,
    totalReviews: 0,
    totalAds: 0,
    banned: false,
    pushToken: null,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };
  await setDoc(ref, userData);
  return { id: firebaseUser.uid, ...userData };
}

export async function loginWithGoogle(): Promise<AppUser> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return upsertSocialUser(result.user, {
    name: result.user.displayName ?? 'User',
    email: result.user.email,
    avatar: result.user.photoURL,
  });
}

export async function loginWithFacebook(): Promise<AppUser> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new FacebookAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return upsertSocialUser(result.user, {
    name: result.user.displayName ?? 'User',
    email: result.user.email,
    avatar: result.user.photoURL,
  });
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<AppUser> {
  if (!auth || !db) throw new Error('Firebase is not initialized');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  const userData: Omit<AppUser, 'id'> = {
    name,
    email,
    phone: null,
    avatar: null,
    location: null,
    role: 'USER',
    averageRating: 0,
    totalReviews: 0,
    totalAds: 0,
    banned: false,
    pushToken: null,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };
  await setDoc(doc(db, 'users', credential.user.uid), userData);
  return { id: credential.user.uid, ...userData };
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
