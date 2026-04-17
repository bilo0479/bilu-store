/**
 * Admin ads service — uses Convex actions instead of Firestore.
 */
import { convex } from '@/lib/convex';
import { api } from '../../../../convex/_generated/api';
import type { ListingRow } from '@bilustore/shared';

export type { ListingRow as Ad };

export async function getPendingAds(limit = 20, offset = 0): Promise<ListingRow[]> {
  return convex.action(api.admin.listPendingListings, { limit, offset });
}

export async function approveAd(listingId: number): Promise<void> {
  await convex.action(api.admin.approveListings, { listingId });
}

export async function rejectAd(listingId: number, reason: string): Promise<void> {
  await convex.action(api.admin.rejectListings, { listingId, reason });
}

export async function removeAd(listingId: number): Promise<void> {
  // Delegate to the mobile-side deleteListing action (marks REMOVED)
  await convex.action(api.listings.deleteListing, { id: listingId });
}

export async function getTotalAdsCount(): Promise<number> {
  const stats = await convex.action(api.admin.getDashboardStats, {});
  return (stats as { totalListings: number }).totalListings;
}

export async function getPendingAdsCount(): Promise<number> {
  const stats = await convex.action(api.admin.getDashboardStats, {});
  return (stats as { pendingListings: number }).pendingListings;
}
