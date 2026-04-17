/**
 * PremiumService — P12 Firebase purge
 *
 * Premium boost flow is now handled via the Convex `premium/[adId].tsx` screen
 * which calls api.pro.startCheckout directly. These functions return static
 * defaults so the premium screen still renders while the new flow takes over.
 */
import type { PremiumTier, PremiumAd, PremiumTierId } from '../types';

const DEFAULT_TIERS: PremiumTier[] = [
  { id: 'FEATURED', name: 'Featured Listing', durationDays: 7, description: 'Gold border + Featured badge + top of category', price: 0, currency: 'ETB' },
  { id: 'TOP_SEARCH', name: 'Top Search Placement', durationDays: 7, description: 'Appears in first 3 results for category', price: 0, currency: 'ETB' },
  { id: 'HOMEPAGE', name: 'Homepage Spotlight', durationDays: 3, description: 'Appears in Spotlight carousel on home screen', price: 0, currency: 'ETB' },
  { id: 'HIGHLIGHT', name: 'Highlighted', durationDays: 7, description: 'Colored background in listing feed', price: 0, currency: 'ETB' },
];

export async function getAvailableTiers(): Promise<PremiumTier[]> {
  return DEFAULT_TIERS;
}

export async function getActiveBoost(_adId: string): Promise<PremiumAd | null> {
  return null;
}

export async function boostAd(_adId: string, _tierId: PremiumTierId, _sellerId: string): Promise<void> {
  throw new Error('Use the Pro upgrade screen — api.pro.startCheckout');
}

export async function expireBoost(_premiumAdId: string): Promise<void> {}
