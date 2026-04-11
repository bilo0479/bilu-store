import type { Ad, User } from '../types';
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

export const PAGE_SIZE = 20;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Firestore timestamps can be Timestamp objects or plain numbers depending on
// whether the data came from a snapshot listener vs a REST read. This handles both.
function toMillis(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

/**
 * Maps a Firestore document snapshot to an Ad object.
 * Works with both QueryDocumentSnapshot and regular DocumentSnapshot.
 */
export function docToAd(snap: QueryDocumentSnapshot | DocumentSnapshot): Ad {
  const d = snap.data()!;
  return rawToAd(d, snap.id);
}

/**
 * Maps a plain object (e.g. Algolia hit) to an Ad.
 * The `id` field can be passed separately or read from `obj.objectID` / `obj.id`.
 */
export function rawToAd(obj: Record<string, unknown>, id?: string): Ad {
  const now = Date.now();
  return {
    id: id ?? (obj.objectID as string) ?? (obj.id as string) ?? '',
    title: (obj.title as string) ?? '',
    description: (obj.description as string) ?? '',
    price: (obj.price as number) ?? 0,
    currency: (obj.currency as Ad['currency']) ?? 'ETB',
    category: (obj.category as Ad['category']) ?? 'OTHER',
    subcategory: (obj.subcategory as string) ?? null,
    images: (obj.images as string[]) ?? [],
    thumbnails: (obj.thumbnails as string[]) ?? [],
    location: (obj.location as string) ?? '',
    coordinates: (obj.coordinates as Ad['coordinates']) ?? null,
    condition: (obj.condition as Ad['condition']) ?? null,
    contactPreference: (obj.contactPreference as Ad['contactPreference']) ?? 'CHAT_ONLY',
    negotiable: (obj.negotiable as boolean) ?? false,
    sellerId: (obj.sellerId as string) ?? '',
    sellerName: (obj.sellerName as string) ?? '',
    sellerAvatar: (obj.sellerAvatar as string) ?? null,
    status: (obj.status as Ad['status']) ?? 'DRAFT',
    rejectionReason: (obj.rejectionReason as string) ?? null,
    isPremium: (obj.isPremium as boolean) ?? false,
    premiumTier: (obj.premiumTier as Ad['premiumTier']) ?? null,
    viewCount: (obj.viewCount as number) ?? 0,
    favoriteCount: (obj.favoriteCount as number) ?? 0,
    createdAt: toMillis(obj.createdAt) ?? now,
    updatedAt: toMillis(obj.updatedAt) ?? now,
    expiresAt: toMillis(obj.expiresAt) ?? now + THIRTY_DAYS_MS,
  };
}

/**
 * Maps a Firestore user document to a User object.
 */
export function docToUser(snap: DocumentSnapshot): User | null {
  if (!snap.exists()) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    name: (d.name as string) ?? '',
    email: (d.email as string) ?? null,
    phone: (d.phone as string) ?? null,
    avatar: (d.avatar as string) ?? null,
    location: (d.location as string) ?? null,
    role: (d.role as User['role']) ?? 'USER',
    averageRating: (d.averageRating as number) ?? 0,
    totalReviews: (d.totalReviews as number) ?? 0,
    totalAds: (d.totalAds as number) ?? 0,
    banned: (d.banned as boolean) ?? false,
    pushToken: (d.pushToken as string) ?? null,
    createdAt: toMillis(d.createdAt) ?? Date.now(),
    lastLoginAt: toMillis(d.lastLoginAt) ?? Date.now(),
  };
}
