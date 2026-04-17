/**
 * AuthService — P12 Firebase purge
 *
 * All Firestore calls removed. Profile reads/writes go through Convex actions.
 * upsertClerkUser is now a no-op: Convex clerkWebhook handler creates the user row
 * in Turso automatically on user.created / user.updated Clerk events.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import type { User } from '../types';

const REDIRECT_KEY = 'redirect_after_auth';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.EXPO_PUBLIC_CONVEX_URL ?? '';
  return new ConvexHttpClient(url);
}

/**
 * Read a user profile from Turso via Convex action.
 * Returns null if the user doesn't exist yet.
 */
export async function fetchUserProfile(uid: string): Promise<User | null> {
  try {
    const client = getConvexClient();
    const user = await client.action(api.users.getMyProfile, {});
    return user as unknown as User;
  } catch {
    return null;
  }
}

/**
 * Update selected fields on a user profile via Convex.
 */
export async function updateUserProfile(
  _uid: string,
  updates: Partial<Pick<User, 'name' | 'phone' | 'avatar' | 'location'>>
): Promise<void> {
  const client = getConvexClient();
  await client.action(api.users.updateProfile, {
    name: updates.name,
    city: (updates.location as { city?: string } | null)?.city,
    avatarUrl: updates.avatar ?? undefined,
  });
}

/**
 * No-op — Convex clerkWebhook handler creates/updates the Turso user row
 * automatically on Clerk user.created / user.updated events.
 */
export async function upsertClerkUser(
  _clerkUserId: string,
  _overrides: Partial<Omit<User, 'id'>>
): Promise<User> {
  // User creation is handled server-side via Clerk webhook → convex/clerkWebhook.ts
  // Nothing to do here; the caller should read from the store after sign-in.
  return { id: _clerkUserId } as User;
}

/**
 * No-op stub — Clerk sign-out is performed via `useAuth().signOut()` in components.
 */
export async function logoutUser(): Promise<void> {}

export async function saveRedirectIntent(route: string): Promise<void> {
  await AsyncStorage.setItem(REDIRECT_KEY, route);
}

export async function consumeRedirectIntent(): Promise<string | null> {
  const route = await AsyncStorage.getItem(REDIRECT_KEY);
  if (route) await AsyncStorage.removeItem(REDIRECT_KEY);
  return route;
}
