export type CategoryId =
  | 'ELECTRONICS' | 'VEHICLES' | 'REAL_ESTATE' | 'FASHION'
  | 'HOME_FURNITURE' | 'JOBS' | 'SERVICES' | 'EDUCATION'
  | 'SPORTS' | 'OTHER';

export type AdStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SOLD'
  | 'EXPIRED' | 'REJECTED' | 'REMOVED';

export type AdCondition = 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR';

export type ContactPreference = 'CHAT_ONLY' | 'CHAT_AND_PHONE';

export type Currency = 'ETB' | 'USD';

export type PremiumTierId = 'FEATURED' | 'TOP_SEARCH' | 'HOMEPAGE' | 'HIGHLIGHT';
export type PremiumStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED';

export type ReportReasonId =
  | 'SPAM' | 'PROHIBITED_ITEM' | 'SCAM' | 'WRONG_CATEGORY'
  | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface User {
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

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: CategoryId;
  subcategory: string | null;
  images: string[];
  thumbnails: string[];
  location: string;
  coordinates: { lat: number; lng: number } | null;
  condition: AdCondition | null;
  contactPreference: ContactPreference;
  negotiable: boolean;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string | null;
  status: AdStatus;
  rejectionReason: string | null;
  isPremium: boolean;
  premiumTier: PremiumTierId | null;
  viewCount: number;
  favoriteCount: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface CreateAdInput {
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: CategoryId;
  subcategory?: string;
  images: string[];
  location: string;
  coordinates?: { lat: number; lng: number };
  condition?: AdCondition;
  contactPreference: ContactPreference;
  negotiable: boolean;
}

export type UpdateAdInput = Partial<CreateAdInput>;

export interface ChatPreview {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  adId: string;
  adTitle: string;
  adThumbnail: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string | null;
  image: string | null;
  createdAt: number;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  sellerId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface PremiumTier {
  id: PremiumTierId;
  name: string;
  durationDays: number;
  description: string;
  price: number;
  currency: Currency;
}

export interface PremiumAd {
  id: string;
  adId: string;
  sellerId: string;
  tierId: PremiumTierId;
  status: PremiumStatus;
  startDate: number | null;
  endDate: number | null;
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'AD' | 'USER';
  targetId: string;
  reason: ReportReasonId;
  details: string | null;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

export interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface SearchFilters {
  categoryId?: CategoryId;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: AdCondition;
  sortBy: 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RELEVANCE';
}

export type NotificationType =
  | 'NEW_MESSAGE' | 'AD_APPROVED' | 'AD_REJECTED'
  | 'AD_INTEREST' | 'PREMIUM_EXPIRING' | 'NEW_REVIEW';

export type PaymentMethod = 'CHAPA_HOSTED' | 'CHAPA_USSD' | 'TELEBIRR';
export type PaymentSessionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface PaymentSession {
  id: string;
  txRef: string;
  adId: string;
  tierId: PremiumTierId;
  sellerId: string;
  method: PaymentMethod;
  amount: number;
  currency: Currency;
  status: PaymentSessionStatus;
  createdAt: number;
  paidAt: number | null;
}

export interface InitializePaymentResult {
  txRef: string;
  checkoutUrl?: string;
  ussdPushSent?: boolean;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export interface AdsStore {
  homeFeed: Ad[];
  categoryAds: Ad[];
  searchResults: Ad[];
  isLoading: boolean;
  cursor: string | null;
  loadHomeFeed: () => Promise<void>;
  loadCategory: (id: CategoryId) => Promise<void>;
  loadMore: () => Promise<void>;
  search: (query: string, filters: SearchFilters) => Promise<void>;
}

export interface ChatStore {
  chats: ChatPreview[];
  totalUnread: number;
  isLoading: boolean;
  subscribeToChats: () => (() => void);
}

export interface FavoritesStore {
  favoriteAdIds: Set<string>;
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  toggle: (adId: string) => void;
  isFavorited: (adId: string) => boolean;
}

export interface UiStore {
  toastMessage: string | null;
  isGlobalLoading: boolean;
  showToast: (msg: string) => void;
  hideToast: () => void;
}
