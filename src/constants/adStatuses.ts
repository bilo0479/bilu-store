import { AdStatus } from '../types';

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Under Review',
  ACTIVE: 'Live',
  SOLD: 'Sold',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
  REMOVED: 'Removed',
};

// Valid state transitions: key = current status, value = array of valid next statuses
export const VALID_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  DRAFT: ['PENDING_REVIEW', 'ACTIVE'], // ACTIVE only if auto-approve
  PENDING_REVIEW: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['SOLD', 'EXPIRED', 'REMOVED'],
  SOLD: [], // terminal
  EXPIRED: ['PENDING_REVIEW', 'ACTIVE'], // republish
  REJECTED: ['PENDING_REVIEW', 'ACTIVE'], // re-submit after edit
  REMOVED: [], // terminal
};

export function isValidTransition(from: AdStatus, to: AdStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
