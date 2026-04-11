import { PremiumTierId } from '../types';

export interface PremiumTierDef {
  id: PremiumTierId;
  name: string;
  durationDays: number;
  description: string;
  effect: string;
}

export const PREMIUM_TIERS: PremiumTierDef[] = [
  { id: 'FEATURED', name: 'Featured Listing', durationDays: 7, description: 'Gold border + "Featured" badge + top of category', effect: 'FEATURED_BADGE' },
  { id: 'TOP_SEARCH', name: 'Top Search Placement', durationDays: 7, description: 'Appears in first 3 results for category', effect: 'TOP_SEARCH' },
  { id: 'HOMEPAGE', name: 'Homepage Spotlight', durationDays: 3, description: 'Appears in "Spotlight" carousel on home screen', effect: 'HOMEPAGE_CAROUSEL' },
  { id: 'HIGHLIGHT', name: 'Highlighted', durationDays: 7, description: 'Colored background in listing feed', effect: 'HIGHLIGHT_BG' },
];

export function getTierById(id: PremiumTierId): PremiumTierDef | undefined {
  return PREMIUM_TIERS.find(t => t.id === id);
}
