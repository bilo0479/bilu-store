import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { mapAuthError } from '../utils/firebaseErrors';
import type { User } from '../types';

function toAuthError(error: unknown): Error {
  const code = (error as { code?: string })?.code ?? '';
  return new Error(mapAuthError(code));
}

const REDIRECT_KEY = 'redirect_after_auth';

function mapFirebaseUser(fUser: FirebaseUser, data: Record<string, unknown>): User {
  return {
    id: fUser.uid,
    name: (data.name as string) ?? fUser.displayName ?? 'User',
    email: fUser.email,
    phone: (data.phone as string) ?? fUser.phoneNumber ?? null,
    avatar: (data.avatar as string) ?? fUser.photoURL ?? null,
    location: (data.location as string) ?? null,
    role: (data.role as User['role']) ?? 'USER',
    averageRating: (data.averageRating as number) ?? 0,
    totalReviews: (data.totalReviews as number) ?? 0,
    totalAds: (data.totalAds as number) ?? 0,
    banned: (data.banned as boolean) ?? false,
    pushToken: (data.pushToken as string) ?? null,
    createdAt: (data.createdAt as number) ?? Date.now(),
    lastLoginAt: Date.now(),
  };
}

function defaultUserData(overrides: Partial<Omit<User, 'id'>> = {}): Omit<User, 'id'> {
  return {
    name: 'User',
    email: null,
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
    ...overrides,
  };
}

// Handles the common "upsert user on social/phone auth" pattern
async function upsertSocialUser(
  result: { user: FirebaseUser },
  overrides: Partial<Omit<User, 'id'>>
): Promise<User> {
  if (!db) throw new Error('Firebase is not configured');

  const snap = await getDoc(doc(db, 'users', result.user.uid));
  if (snap.exists()) {
    const data = snap.data();
    await updateDoc(doc(db, 'users', result.user.uid), {
      lastLoginAt: Date.now(),
      // Backfill avatar from provider if user hasn't set one
      ...(result.user.photoURL && !data.avatar ? { avatar: result.user.photoURL } : {}),
    });
    return mapFirebaseUser(result.user, data);
  }

  const userData = defaultUserData(overrides);
  await setDoc(doc(db, 'users', result.user.uid), userData);
  return { id: result.user.uid, ...userData };
}

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const userData = defaultUserData({ name, email });
    await setDoc(doc(db, 'users', credential.user.uid), userData);
    return { id: credential.user.uid, ...userData };
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', credential.user.uid));
    const data = snap.exists() ? snap.data() : {};
    await setDoc(doc(db, 'users', credential.user.uid), { lastLoginAt: Date.now() }, { merge: true });
    return mapFirebaseUser(credential.user, data);
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function loginWithPhone(phoneNumber: string): Promise<string> {
  if (!auth) throw new Error('Firebase is not configured');
  try {
    // The applicationVerifier must be provided by the calling UI component
    // (e.g. FirebaseRecaptchaVerifierModal). This placeholder will be replaced.
    const provider = new PhoneAuthProvider(auth);
    const verificationId = await provider.verifyPhoneNumber(phoneNumber, {
      type: 'recaptcha',
      verify: () => Promise.resolve(''),
    } as never);
    return verificationId;
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function verifyPhoneCode(verificationId: string, code: string): Promise<User> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const result = await signInWithCredential(auth, credential);
    return upsertSocialUser(result, {
      name: result.user.displayName ?? 'User',
      phone: result.user.phoneNumber,
      avatar: result.user.photoURL,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function loginWithGoogle(idToken: string): Promise<User> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return upsertSocialUser(result, {
      name: result.user.displayName ?? 'User',
      email: result.user.email,
      avatar: result.user.photoURL,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function loginWithFacebook(accessToken: string): Promise<User> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  try {
    const credential = FacebookAuthProvider.credential(accessToken);
    const result = await signInWithCredential(auth, credential);
    return upsertSocialUser(result, {
      name: result.user.displayName ?? 'User',
      email: result.user.email,
      avatar: result.user.photoURL,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function fetchUserProfile(uid: string): Promise<User | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() } as User;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<User, 'name' | 'phone' | 'avatar' | 'location'>>
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), updates);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function saveRedirectIntent(route: string): Promise<void> {
  await AsyncStorage.setItem(REDIRECT_KEY, route);
}

export async function consumeRedirectIntent(): Promise<string | null> {
  const route = await AsyncStorage.getItem(REDIRECT_KEY);
  if (route) await AsyncStorage.removeItem(REDIRECT_KEY);
  return route;
}
