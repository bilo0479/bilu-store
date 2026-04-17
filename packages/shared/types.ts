// Shared types — imported by mobile app and admin web
// Source of truth: PRD §2, §4, SYSTEM.md §2

// ── Auth / Identity ────────────────────────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserPlan = 'free' | 'pro';
export type VerificationTier = 1 | 2 | 3;

export interface ClerkPublicMetadata {
  role: UserRole;
  plan: UserPlan;
  verificationTier: VerificationTier;
  sellerTrustScore: number;
  planExpiresAt: number | null;
  proTrialUsed: boolean;
}

export interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  role: UserRole;
  plan: UserPlan;
  planExpiresAt: number | null;
  proTrialUsed: boolean;
  verificationTier: VerificationTier;
  sellerTrustScore: number;
  visibilityScore: number;
  banned: boolean;
  createdAt: number;
  lastLoginAt: number;
}

// ── Listings ───────────────────────────────────────────────────────────────

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SOLD'
  | 'EXPIRED'
  | 'REJECTED'
  | 'REMOVED'
  | 'ARCHIVED';

export type AdCondition = 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR';
export type ContactPreference = 'CHAT_ONLY' | 'CHAT_AND_PHONE';
export type Currency = 'ETB' | 'USD';

export interface ListingRow {
  id: number;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  price: number;
  currency: Currency;
  condition: AdCondition | null;
  negotiable: boolean;
  contactPref: ContactPreference;
  locationCity: string;
  lat: number | null;
  lng: number | null;
  images: string[];
  thumbnails: string[];
  status: ListingStatus;
  rejectionReason: string | null;
  isPremium: boolean;
  premiumTier: string | null;
  viewCount: number;
  clickCount: number;
  saveCount: number;
  saleCount: number;
  viralScore: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

// ── Escrow ─────────────────────────────────────────────────────────────────

export type EscrowStatus =
  | 'pending_payment'
  | 'held'
  | 'verified'
  | 'completed'
  | 'refunded'
  | 'disputed';

export type PaymentMethod = 'CHAPA' | 'TELEBIRR';

export interface EscrowRow {
  id: number;
  listingId: number;
  buyerId: string;
  sellerId: string;
  amount: number;
  commissionAmount: number;
  payoutAmount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentTxRef: string;
  tokenHash: string | null;
  status: EscrowStatus;
  countdownExpiresAt: number | null;
  verifiedAt: number | null;
  payoutReleaseAt: number | null;
  completedAt: number | null;
  refundedAt: number | null;
  disputedAt: number | null;
  disputeReason: string | null;
  failedVerifyCount: number;
  createdAt: number;
}

// ── Reviews ────────────────────────────────────────────────────────────────

export interface ReviewRow {
  id: number;
  dealId: number;
  reviewerId: string;
  sellerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  verifiedPurchase: boolean;
  createdAt: number;
}

// ── Category ───────────────────────────────────────────────────────────────

export type CategoryId =
  | 'ELECTRONICS' | 'VEHICLES' | 'REAL_ESTATE' | 'FASHION'
  | 'HOME_FURNITURE' | 'JOBS' | 'SERVICES' | 'EDUCATION'
  | 'SPORTS' | 'OTHER';

// ── Reports ────────────────────────────────────────────────────────────────

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'listing' | 'user';
