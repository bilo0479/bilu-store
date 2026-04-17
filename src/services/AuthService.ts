/**
 * AuthService — P2 Clerk migration
 *
 * Firebase Auth is no longer used here. All sign-in / sign-up flows are
 * handled by Clerk hooks inside the auth screens. This module retains:
 *  - Firestore user profile reads / writes (migrated to Turso in P4)
 *  - upsertClerkUser — called from screens after Clerk sign-in completes
 *  - logoutUser — no-op stub; Clerk signOut is done via `useAuth().signOut()`
 *  - saveRedirectIntent / consumeRedirectIntent — AsyncStorage-based redirect
 */

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import type { User } from '../types';

const REDIRECT_KEY = 'redirect_after_auth';

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Exports ────────────────────────────────────────────────────────────────

/**
 * Read a user profile doc from Firestore.
 * Returns null if the doc doesn't exist yet (e.g. brand-new user).
 */
export async function fetchUserProfile(uid: string): Promise<User | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() } as User;
}

/**
 * Update selected fields on a user profile doc.
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<User, 'name' | 'phone' | 'avatar' | 'location'>>
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), updates);
}

/**
 * Upsert a Firestore user profile for a Clerk-authenticated user.
 *
 * Mirrors the old `upsertSocialUser` pattern:
 * - If doc exists: update `lastLoginAt` and optionally backfill `avatar`
 * - If doc doesn't exist: create it with defaults merged with `overrides`
 *
 * Call this from auth screens after Clerk sign-in / sign-up completes.
 */
export async function upsertClerkUser(
  clerkUserId: string,
  overrides: Partial<Omit<User, 'id'>>
): Promise<User> {
  if (!db) throw new Error('Firestore is not configured');

  const ref = doc(db, 'users', clerkUserId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    await updateDoc(ref, {
      lastLoginAt: Date.now(),
      // Backfill avatar from provider if the user hasn't set one manually
      ...(overrides.avatar && !data.avatar ? { avatar: overrides.avatar } : {}),
    });
    return { id: clerkUserId, ...data } as User;
  }

  const userData = defaultUserData(overrides);
  await setDoc(ref, userData);
  return { id: clerkUserId, ...userData };
}

/**
 * No-op stub — kept for call-site compatibility.
 * Actual Clerk sign-out is performed via `useAuth().signOut()` in components.
 */
export async function logoutUser(): Promise<void> {
  // Clerk sign-out is hook-based; components call useAuth().signOut() directly.
}

/**
 * Persist a route that should be navigated to after sign-in completes.
 */
export async function saveRedirectIntent(route: string): Promise<void> {
  await AsyncStorage.setItem(REDIRECT_KEY, route);
}

/**
 * Read and clear the saved redirect intent.
 * Returns null if no intent was stored.
 */
export async function consumeRedirectIntent(): Promise<string | null> {
  const route = await AsyncStorage.getItem(REDIRECT_KEY);
  if (route) await AsyncStorage.removeItem(REDIRECT_KEY);
  return route;
}
