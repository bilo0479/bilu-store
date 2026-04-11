# PRODUCT REQUIREMENTS PROMPT (PRP)
## Bilu Store
### Local Classified Marketplace — SaaS Platform
### v1.0 MVP | React Native | Expo | Next.js | Firebase

---

# SECTION 0 — HOW TO USE THIS PRP

**What This Document Is:**
This is a Product Requirements Prompt (PRP) — an AI-native specification document. Every section is structured to be fed directly into an AI code generation session. Ambiguity has been deliberately eliminated. When in doubt, the AI must follow this document, not invent alternatives.

**SESSION START — Paste at the top of every AI coding session:**

> You are a senior full-stack developer with expertise in React Native (Expo), Next.js, and Firebase. You are building "Bilu Store" — a local classified marketplace SaaS platform with Android app and web dashboard. The platform connects local buyers and sellers through ad listings, real-time chat, and reputation systems. It does NOT process payments or handle shipping — it connects people. Read the PRP in full before writing any code. Follow the stack, file structure, naming conventions, and data models exactly as specified. Do not introduce libraries not listed in Section 5. Do not create screens not in the screen map in Section 3. Do not write Firestore queries inline in components — all database access goes through `src/services/`. When unsure, ask a targeted clarifying question instead of assuming.

**AI HARD RULES — Non-Negotiable:**

- Never introduce a library not listed in Section 5 without explicit approval
- Never deviate from the file structure in Section 6
- Never add a screen not in the screen map in Section 3
- Never hardcode color hex values — always use design tokens from Section 10
- Never write Firestore queries inline in a component — all DB access through `src/services/`
- Never write Cloudinary upload logic outside of `MediaService`
- Never write chat logic outside of `ChatService`
- Never write auth logic outside of `AuthService`
- Never write notification logic outside of `NotificationService`
- Never write moderation logic outside of `ModerationService`
- Never write premium/boost logic outside of `PremiumService`
- All TypeScript interfaces must match exact shapes in Section 9
- All error states must follow fallback contracts in Section 12
- All Firestore security rules must enforce user isolation (Section 17)
- Never store payment credentials client-side
- Never expose seller phone numbers in ad listings — only via chat after contact request
- Never use `any` TypeScript type — strict mode is ON
- Never allow ad posting without authentication
- Never skip image compression before Cloudinary upload

---

# SECTION 1 — PRODUCT SNAPSHOT

## 1.1 Mobile App

| Field | Value |
|---|---|
| App Name | Bilu Store |
| Bundle ID | `com.bilustore.app` |
| Version | 1.0.0 — MVP |
| Platform | Android ONLY (Expo SDK 51, managed workflow) |
| Min Android | Android 8.0 (API level 26) |
| Framework | React Native 0.74 via Expo SDK 51 |
| Language | TypeScript 5.x — strict mode ON |
| Navigation | Expo Router v3 (file-based routing) + Bottom Tabs + Drawer |
| Auth | Firebase Authentication (Phone + Google + Email) |
| Database | Firebase Firestore |
| Storage | Cloudinary (images) |
| Chat | Firebase Firestore (real-time listeners) |
| Notifications | Firebase Cloud Messaging + expo-notifications |
| State | Zustand 4.x |
| Local Cache | @react-native-async-storage/async-storage@2 |
| Testing | Jest 29 + @testing-library/react-native@12 |

## 1.2 Web Dashboard (Seller + Admin)

| Field | Value |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3.x |
| Language | TypeScript 5.x — strict mode ON |
| Auth | Firebase Authentication (same as mobile) |
| Hosting | Vercel |
| Admin Panel | Role-based: `ADMIN` role sees moderation tools |

## 1.3 Backend

| Field | Value |
|---|---|
| Functions | Firebase Cloud Functions (Node.js 20) |
| Triggers | Firestore triggers for notifications, moderation, premium expiry |
| Search | Algolia (ad search indexing) |

**Product Mission:** Connect local buyers and sellers instantly. No payments. No shipping. Just people meeting locally to trade. The fastest way to post, find, and buy locally.

**Core Philosophy:** Local · Simple · Trustworthy · Fast

**What Bilu Store is NOT:**
- NOT an e-commerce platform (no cart, no checkout, no payment processing)
- NOT a shipping service (no delivery tracking)
- NOT a social network (no feeds, no followers — only buyer-seller connections)
- NOT a price comparison tool

---

# SECTION 2 — CONTENT & ASSET INVENTORY

## 2.1 Category Definitions (Fixed in MVP)

| Category ID | Display Name | Emoji | Sort Order |
|---|---|---|---|
| `ELECTRONICS` | Electronics | 📱 | 1 |
| `VEHICLES` | Vehicles | 🚗 | 2 |
| `REAL_ESTATE` | Real Estate | 🏠 | 3 |
| `FASHION` | Fashion | 👕 | 4 |
| `HOME_FURNITURE` | Home & Furniture | 🛋️ | 5 |
| `JOBS` | Jobs | 💼 | 6 |
| `SERVICES` | Services | 🔧 | 7 |
| `EDUCATION` | Education | 📚 | 8 |
| `SPORTS` | Sports & Outdoors | ⚽ | 9 |
| `OTHER` | Other | 📦 | 10 |

> ⚠️ These are the ONLY valid `CategoryId` values in MVP. Do not add more without updating this section, the Firestore schema in Section 8, and the TypeScript type in Section 9.

## 2.2 Ad Status State Machine

| Status ID | Display Label | Who Sets It | Visible to Buyer? | Editable by Seller? |
|---|---|---|---|---|
| `DRAFT` | Draft | Seller (save without publish) | No | Yes |
| `PENDING_REVIEW` | Under Review | System (on first publish) | No | No (locked during review) |
| `ACTIVE` | Live | Admin (approve) OR auto-approve if seller has reputation >= 4.0 | Yes | Yes (minor edits, re-review if images change) |
| `SOLD` | Sold | Seller (mark as sold) | Yes (grayed out) | No |
| `EXPIRED` | Expired | System (30 days after publish) | No | Yes (can re-publish → PENDING_REVIEW) |
| `REJECTED` | Rejected | Admin (moderation) | No | Yes (can edit and re-submit) |
| `REMOVED` | Removed | Admin (policy violation) | No | No |

> ⚠️ This is the ONLY valid state machine. All status transitions must go through `AdService.updateStatus()`. Never set status directly in components.

**Auto-approve rule:** If seller's `averageRating >= 4.0` AND `totalReviews >= 3` AND ad has no flagged keywords, status goes directly `DRAFT → ACTIVE` (skip `PENDING_REVIEW`). Otherwise, `DRAFT → PENDING_REVIEW → ACTIVE` (admin approval required).

## 2.3 Premium / Boost Tiers (Fixed in MVP)

| Tier ID | Display Name | Duration | Effect | Price (placeholder) |
|---|---|---|---|---|
| `FEATURED` | Featured Listing | 7 days | Gold border + "Featured" badge + top of category | $X |
| `TOP_SEARCH` | Top Search Placement | 7 days | Appears in first 3 results for category | $X |
| `HOMEPAGE` | Homepage Spotlight | 3 days | Appears in "Spotlight" carousel on home screen | $X |
| `HIGHLIGHT` | Highlighted | 7 days | Colored background in listing feed | $X |

> ⚠️ Prices are configured in Firestore collection `config/premium_pricing` — NOT hardcoded. Admin can change prices without app update.

## 2.4 Report Reason Definitions

| Reason ID | Display Label |
|---|---|
| `SPAM` | Spam or misleading |
| `PROHIBITED_ITEM` | Prohibited item |
| `SCAM` | Suspected scam |
| `WRONG_CATEGORY` | Wrong category |
| `DUPLICATE` | Duplicate listing |
| `OFFENSIVE` | Offensive content |
| `OTHER` | Other |

## 2.5 Notification Types (Fixed in MVP)

| Type ID | Title Template | Body Template | Trigger |
|---|---|---|---|
| `NEW_MESSAGE` | `"New message from {senderName}"` | `"{messagePreview}"` | New chat message received |
| `AD_APPROVED` | `"Your ad is live! ✓"` | `'"{adTitle}" is now visible to buyers'` | Admin approves ad |
| `AD_REJECTED` | `"Ad not approved"` | `'"{adTitle}" needs changes. Tap to see why.'` | Admin rejects ad |
| `AD_INTEREST` | `"Someone is interested!"` | `'{buyerName} wants to chat about "{adTitle}"'` | Buyer sends first message about an ad |
| `PREMIUM_EXPIRING` | `"Boost ending soon"` | `'Your {tierName} boost for "{adTitle}" expires tomorrow'` | 24h before premium expiry |
| `NEW_REVIEW` | `"New review received"` | `'{reviewerName} gave you {rating} stars'` | New review submitted |

> ⚠️ These are exact template strings. Use string interpolation with the specified variables. Do not modify wording.

## 2.6 Image Upload Constraints

| Constraint | Value |
|---|---|
| Max images per ad | 8 |
| Min images per ad | 1 |
| Max file size (before compression) | 10 MB |
| Compressed target size | < 500 KB |
| Compression quality | 70% JPEG |
| Supported formats | JPEG, PNG, WebP |
| Aspect ratio | Free (no crop enforced) |
| Cloudinary folder | `bilu-store/ads/{adId}/` |
| Thumbnail generation | Cloudinary transformation: `w_400,h_400,c_fill` |
| Full-size delivery | Cloudinary transformation: `w_1200,q_auto` |

> ⚠️ ALWAYS compress images client-side BEFORE uploading to Cloudinary. Never upload raw camera images. Use `expo-image-manipulator` for compression.

---

# SECTION 3 — NAVIGATION STRUCTURE

## 3.1 Screen Map (Mobile App)

| Route | Screen Name | Tab | Guard | Navigates To |
|---|---|---|---|---|
| `/` | Redirect | — | Auth check | → `/(tabs)/home` or `/auth/login` |
| `/(tabs)/home` | Home Feed | Tab 1 | None | → `/ad/[id]`, `/category/[id]`, `/search` |
| `/(tabs)/search` | Search Screen | Tab 2 | None | → `/ad/[id]`, `/search-results` |
| `/(tabs)/post` | Post Ad Screen | Tab 3 (center) | Auth required | → `/post/create` |
| `/(tabs)/chat` | Chat List | Tab 4 | Auth required | → `/chat/[chatId]` |
| `/(tabs)/profile` | My Profile | Tab 5 | Auth required | → `/profile/edit`, `/my-ads`, `/favorites`, `/settings` |
| `/auth/login` | Login Screen | — | None | → `/auth/register`, `/auth/phone-verify` |
| `/auth/register` | Register Screen | — | None | → `/auth/phone-verify` |
| `/auth/phone-verify` | Phone Verification | — | None | → `/(tabs)/home` |
| `/ad/[adId]` | Ad Detail Screen | — | None (guest can browse) | → `/chat/[chatId]` (contact seller), `/seller/[sellerId]` |
| `/category/[categoryId]` | Category Listings | — | None | → `/ad/[id]` |
| `/search-results` | Search Results | — | None | → `/ad/[id]` |
| `/post/create` | Create Ad | — | Auth required | → back (on publish) |
| `/post/edit/[adId]` | Edit Ad | — | Auth + owner | → back |
| `/chat/[chatId]` | Chat Conversation | — | Auth required | → `/ad/[id]`, `/seller/[sellerId]` |
| `/seller/[sellerId]` | Seller Profile | — | None | → `/ad/[id]`, `/review/create/[sellerId]` |
| `/review/create/[sellerId]` | Write Review | — | Auth required | → back |
| `/my-ads` | My Ads List | — | Auth required | → `/ad/[id]`, `/post/edit/[id]` |
| `/favorites` | Saved Ads | — | Auth required | → `/ad/[id]` |
| `/premium/[adId]` | Boost Ad Screen | — | Auth + owner | → back (on purchase) |
| `/settings` | Settings | — | Auth required | → back |
| `/profile/edit` | Edit Profile | — | Auth required | → back |
| `/about-app` | About App | — | None | → back |
| `/about-developer` | About Developer | — | None | → back |

## 3.2 Bottom Tab Bar

```
[ 🏠 Home ]  [ 🔍 Search ]  [ ➕ Post ]  [ 💬 Chat ]  [ 👤 Profile ]
```

- "Post" tab is center-aligned with elevated FAB style (larger, ACCENT color circle)
- Chat tab shows unread badge count (red dot with number)
- Always visible on 5 tab screens
- Hidden on all other screens

```ts
// src/constants/routes.ts
export const HIDE_TAB_ROUTES = [
  '/auth/',          // prefix match
  '/ad/',            // prefix match
  '/category/',      // prefix match
  '/search-results',
  '/post/',          // prefix match
  '/chat/',          // prefix match (conversation, not list)
  '/seller/',
  '/review/',
  '/my-ads',
  '/favorites',
  '/premium/',
  '/settings',
  '/profile/edit',
  '/about-app',
  '/about-developer',
];
```

## 3.3 Drawer Menu (Left Side)

Drawer opens from hamburger icon on Home screen OR swipe-right gesture on tab screens.

```
┌─────────────────────────────────┐
│  🛒 Bilu Store                   │  ← App name
│  Buy & sell locally              │  ← Tagline
├─────────────────────────────────┤
│  [Avatar]  John Doe              │  ← User info (if logged in)
│  ⭐ 4.5 · 12 reviews            │  ← Rating
│  📍 Addis Ababa                  │  ← Location
├─────────────────────────────────┤
│  📦 My Ads (5)                   │  → /my-ads
│  ❤️ Favorites (3)                │  → /favorites
│  ⭐ Premium Services             │  → /premium (landing)
├─────────────────────────────────┤
│  ⚙️ Settings                      │  → /settings
│  ℹ️ About App                     │  → /about-app
│  👤 About Developer               │  → /about-developer
│  🔒 Privacy Policy               │  ← ScrollView modal
│  📄 Terms of Service             │  ← ScrollView modal
├─────────────────────────────────┤
│  🚪 Log Out                      │  ← Inline confirm
│  App Version v1.0.0              │  ← Non-tappable
└─────────────────────────────────┘
```

**Guest state (not logged in):** Avatar section replaced with `[Log In / Register]` button. My Ads and Favorites hidden. Premium hidden.

---

# SECTION 4 — FEATURE SPECIFICATIONS (AI-READY)

---

## 4.1 AUTHENTICATION

**File: `src/services/AuthService.ts`**

> ⚠️ This is the ONLY file allowed to call Firebase Auth APIs. No other file may call `firebase.auth()` methods directly.

### Auth Methods (MVP)

```ts
export async function loginWithPhone(
  phoneNumber: string
): Promise<ConfirmationResult>;
// Sends SMS code via Firebase Phone Auth
// Returns ConfirmationResult to verify code

export async function verifyPhoneCode(
  confirmation: ConfirmationResult,
  code: string
): Promise<UserCredential>;
// Verifies 6-digit SMS code
// On success: creates/updates user document in Firestore

export async function loginWithGoogle(): Promise<UserCredential>;
// Google Sign-In via expo-auth-session
// On success: creates/updates user document

export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserCredential>;

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
): Promise<UserCredential>;
// Creates auth account + Firestore user document

export async function logout(): Promise<void>;
// Signs out, clears local cache, resets Zustand stores

export function getCurrentUser(): User | null;
// Returns cached current user from Zustand authStore

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe;
// Firebase auth state listener
```

### User Document Creation (on first auth)

```ts
// On first authentication (new user):
// 1. Create document in users/{uid}
// 2. Set fields: name, email, phone, avatar (from provider), location: null
// 3. Set role: 'USER' (default)
// 4. Set createdAt: serverTimestamp()
// 5. Set averageRating: 0, totalReviews: 0
//
// On returning auth:
// 1. Update lastLoginAt: serverTimestamp()
// 2. Sync profile changes from provider (avatar, name) if changed
```

### Auth Guards

```ts
// Route guard implementation:
// In app/_layout.tsx:
// 1. Listen to onAuthStateChanged
// 2. If route requires auth AND user is null:
//    → Redirect to /auth/login
//    → Store intended route in AsyncStorage key 'redirect_after_auth'
// 3. After successful auth:
//    → Read 'redirect_after_auth'
//    → Navigate to stored route
//    → Clear the key
//
// Guest browsing: Home, Search, Ad Detail, Category, Seller Profile
//   — viewable without auth
// Auth required: Post, Chat, Favorites, My Ads, Profile, Review, Premium
```

---

## 4.2 AD POSTING SYSTEM

**File: `src/services/AdService.ts`**

> ⚠️ This is the ONLY service for ad CRUD and status management.

### Create Ad Flow

```ts
export async function createAd(ad: CreateAdInput): Promise<string>;
// 1. Validate all required fields (name, price, category, images >= 1)
// 2. Upload images via MediaService.uploadAdImages()
//    → Returns array of Cloudinary URLs
// 3. Create Firestore document in ads/{newId}
// 4. If seller qualifies for auto-approve: set status = ACTIVE
//    Else: set status = PENDING_REVIEW
// 5. Index in Algolia via Cloud Function trigger
// 6. Return adId
```

### Ad Creation Form Fields

| Field | Type | Required | Validation |
|---|---|---|---|
| `title` | TextInput | Yes | Min 5 chars, max 100 chars |
| `description` | TextInput (multiline) | Yes | Min 20 chars, max 2000 chars |
| `price` | NumberInput | Yes | Min 0 (free is allowed), max 99,999,999. Number only, no text. |
| `currency` | Select | Yes | Default: `ETB` (Ethiopian Birr). Options: `ETB`, `USD` |
| `category` | Select (10 options) | Yes | From Section 2.1 |
| `subcategory` | TextInput | No | Free text, max 50 chars |
| `images` | Image picker | Yes | Min 1, max 8, compressed before upload |
| `location` | Location picker | Yes | City name + optional coordinates |
| `condition` | Select | Yes for physical goods | `NEW`, `LIKE_NEW`, `USED_GOOD`, `USED_FAIR` |
| `contactPreference` | Select | Yes | `CHAT_ONLY`, `CHAT_AND_PHONE` |
| `negotiable` | Toggle | No | Default: `true` |

### Form Validation (on Publish tap)

- `title` empty → inline error: `"Title is required"`
- `title` < 5 chars → inline error: `"Title must be at least 5 characters"`
- `description` < 20 chars → inline error: `"Please add more details (min 20 characters)"`
- `price` not a number → inline error: `"Enter a valid price"`
- `images` empty → inline error: `"Add at least one photo"`
- `images` > 8 → inline error: `"Maximum 8 photos allowed"`
- `location` empty → inline error: `"Location is required"`
- On valid: save as `DRAFT` first → then publish (status transition)

**No "Submit" button label — use `"Publish Ad"` exactly.**
**Draft save button: `"Save Draft"` exactly.**

### Ad Service Contract (Complete)

```ts
export async function createAd(input: CreateAdInput): Promise<string>;
export async function updateAd(adId: string, input: UpdateAdInput): Promise<void>;
export async function deleteAd(adId: string): Promise<void>;
// Soft delete: sets status to REMOVED, does not delete Firestore doc

export async function getAdById(adId: string): Promise<Ad | null>;

export async function getAdsByCategory(
  categoryId: CategoryId,
  cursor?: string,
  limit?: number
): Promise<PaginatedResult<Ad>>;
// Paginated, sorted by isPremium DESC then createdAt DESC
// Premium ads always appear first

export async function getAdsBySeller(
  sellerId: string,
  cursor?: string
): Promise<PaginatedResult<Ad>>;

export async function getMyAds(cursor?: string): Promise<PaginatedResult<Ad>>;
// Current user's ads, all statuses

export async function getFeaturedAds(limit?: number): Promise<Ad[]>;
// Ads with active HOMEPAGE premium tier

export async function updateStatus(
  adId: string,
  newStatus: AdStatus,
  reason?: string        // required for REJECTED
): Promise<void>;
// Enforces valid state transitions per Section 2.2
// Logs status change in ads/{adId}/status_history subcollection

export async function markAsSold(adId: string): Promise<void>;
// Shortcut: updateStatus(adId, 'SOLD')

export async function republishAd(adId: string): Promise<void>;
// For EXPIRED or REJECTED ads: resets to PENDING_REVIEW (or ACTIVE if auto-approve)
```

---

## 4.3 SEARCH SYSTEM

**File: `src/services/SearchService.ts`**

> ⚠️ Firestore does NOT support full-text search. Use Algolia for keyword search. Firestore for filtered browsing (category + location + price range).

### Search Architecture

```ts
// Two search modes:
//
// 1. KEYWORD SEARCH (Algolia)
//    - User types in search bar → debounce 300ms → query Algolia
//    - Algolia indexes: title, description, category, location
//    - Returns ad IDs → fetch full docs from Firestore
//
// 2. FILTERED BROWSE (Firestore)
//    - Category + location + price range → Firestore compound query
//    - No keyword needed
//    - Paginated via cursor

export async function searchByKeyword(
  query: string,
  filters?: SearchFilters
): Promise<PaginatedResult<Ad>>;
// Uses Algolia client
// Filters applied as Algolia facet filters

export async function browseWithFilters(
  filters: SearchFilters,
  cursor?: string
): Promise<PaginatedResult<Ad>>;
// Uses Firestore compound query
// No Algolia needed for pure filter browsing

export interface SearchFilters {
  categoryId?: CategoryId;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: AdCondition;
  sortBy: 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RELEVANCE';
}
```

### Algolia Sync (Cloud Function)

```ts
// Firebase Cloud Function: onAdWrite
// Trigger: Firestore document write on ads/{adId}
// Action:
//   - If status === 'ACTIVE': upsert in Algolia index
//   - If status !== 'ACTIVE': delete from Algolia index
// Fields indexed: title, description, category, location, price, condition
// This ensures only ACTIVE ads appear in search results
```

---

## 4.4 CHAT SYSTEM

**File: `src/services/ChatService.ts`**

> ⚠️ This is the ONLY service for chat operations. All Firestore chat queries go through this service.

### Chat Architecture

```ts
// Chat is always between exactly 2 users about exactly 1 ad.
// Chat document ID format: {sortedUserId1}_{sortedUserId2}_{adId}
// This ensures one chat per buyer-seller-ad combination.
//
// Real-time via Firestore onSnapshot listeners.
// Messages stored in chats/{chatId}/messages subcollection.
```

### Chat Service Contract

```ts
export async function getOrCreateChat(
  adId: string,
  sellerId: string
): Promise<string>;
// 1. Compute chatId from sorted user IDs + adId
// 2. Check if chat doc exists
// 3. If not: create chat doc with participants, adId, createdAt
// 4. Return chatId

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe;
// Real-time listener on chats/{chatId}/messages
// Ordered by createdAt ASC
// Returns unsubscribe function for cleanup

export async function sendMessage(
  chatId: string,
  text: string,
  image?: string         // Cloudinary URL if image message
): Promise<void>;
// 1. Add message to subcollection
// 2. Update chat doc: lastMessage, lastMessageAt, unreadCount
// 3. Trigger FCM notification to recipient (via Cloud Function)

export async function sendImage(
  chatId: string,
  imageUri: string
): Promise<void>;
// 1. Compress image via MediaService
// 2. Upload to Cloudinary folder: bilu-store/chats/{chatId}/
// 3. Send message with image URL

export function subscribeToChatList(
  callback: (chats: ChatPreview[]) => void
): Unsubscribe;
// Listens to all chats where current user is participant
// Ordered by lastMessageAt DESC
// Returns preview: ad title, last message, unread count, other user

export async function markAsRead(chatId: string): Promise<void>;
// Sets unreadCount to 0 for current user
// Updates lastReadAt

export async function deleteChat(chatId: string): Promise<void>;
// Soft delete: sets deletedBy array (user can delete their side)
// If both users delete: Cloud Function purges after 30 days
```

### Chat UI Contract

**Chat bubble layout:**
- Sent messages: right-aligned, `ACCENT` background, white text
- Received messages: left-aligned, `BG_CARD` background, dark text
- Image messages: thumbnail (200×200 max), tap to view full-screen
- Timestamp shown below each message group (grouped by minute)
- "Typing" indicator: not in MVP (added in v2 via Firestore presence)

**Chat list item:**
- Left: ad thumbnail (48×48, rounded corners)
- Center: other user name (bold) + last message preview (1 line, muted) + ad title (small, muted)
- Right: timestamp (relative) + unread badge (red circle with count)
- Sorted: most recent message first

---

## 4.5 MEDIA SERVICE

**File: `src/services/MediaService.ts`**

> ⚠️ This is the ONLY service for image upload, compression, and URL management.

```ts
export async function pickImages(maxCount: number): Promise<string[]>;
// Opens image picker (expo-image-picker)
// Returns array of local URIs
// Enforces maxCount limit

export async function compressImage(uri: string): Promise<string>;
// Compresses to 70% JPEG quality
// Resizes: max 1200px on longest edge
// Target: < 500KB
// Returns compressed local URI

export async function uploadAdImages(
  adId: string,
  localUris: string[]
): Promise<string[]>;
// 1. Compress each image
// 2. Upload each to Cloudinary: bilu-store/ads/{adId}/
// 3. Return array of Cloudinary URLs

export async function uploadChatImage(
  chatId: string,
  localUri: string
): Promise<string>;
// Compress + upload to bilu-store/chats/{chatId}/

export async function uploadAvatar(
  userId: string,
  localUri: string
): Promise<string>;
// Compress + upload to bilu-store/avatars/{userId}

export function getThumbnailUrl(
  cloudinaryUrl: string,
  width?: number,
  height?: number
): string;
// Appends Cloudinary transformation: w_{width},h_{height},c_fill
// Default: w_400,h_400

export function getFullSizeUrl(cloudinaryUrl: string): string;
// Appends: w_1200,q_auto
```

---

## 4.6 FAVORITES SERVICE

**File: `src/services/FavoriteService.ts`**

```ts
export async function addFavorite(adId: string): Promise<void>;
// Creates doc in favorites/{uniqueId} with userId + adId
// Or: adds to user's favorites subcollection users/{uid}/favorites/{adId}

export async function removeFavorite(adId: string): Promise<void>;

export async function isFavorited(adId: string): Promise<boolean>;

export async function getMyFavorites(
  cursor?: string
): Promise<PaginatedResult<Ad>>;
// Returns full ad objects (join query)
// Paginated, sorted by savedAt DESC

export function subscribeToFavoriteStatus(
  adId: string,
  callback: (isFav: boolean) => void
): Unsubscribe;
// Real-time listener for favorite button state
```

**Favorite button behavior:**
- Heart icon on every ad card and ad detail screen
- Tap: toggle favorite (optimistic UI update → Firestore write in background)
- Unfilled heart (`heart-outline`): not favorited
- Filled red heart (`heart`): favorited, color = `ERROR_RED`
- Requires auth: if guest taps heart → redirect to login (with redirect-back intent)

---

## 4.7 REVIEW & REPUTATION SYSTEM

**File: `src/services/ReviewService.ts`**

```ts
export async function submitReview(
  sellerId: string,
  rating: number,          // 1–5 integer
  comment: string          // min 10 chars, max 500 chars
): Promise<void>;
// 1. Create doc in reviews/{uniqueId}
// 2. Update seller's user doc: recalculate averageRating + totalReviews
//    averageRating = sum(all ratings) / totalReviews
// 3. One review per buyer per seller (enforce via Firestore rules)

export async function getReviewsForSeller(
  sellerId: string,
  cursor?: string
): Promise<PaginatedResult<Review>>;
// Sorted by createdAt DESC

export async function canReview(sellerId: string): Promise<boolean>;
// Returns false if:
//   - Current user IS the seller
//   - Current user already reviewed this seller
//   - Current user never had a chat with this seller
```

**Rating display:**
- Star icons: filled gold stars + empty gray stars (1-5)
- Average shown as: `"4.5 ★ (12 reviews)"`
- On seller profile and in ad detail (seller section)

**Review form validation:**
- Rating 0 (no stars selected) → error: `"Please select a rating"`
- Comment < 10 chars → error: `"Review must be at least 10 characters"`
- Comment > 500 chars → error: `"Maximum 500 characters"`

---

## 4.8 PREMIUM / BOOST SERVICE

**File: `src/services/PremiumService.ts`**

```ts
export async function getAvailableTiers(): Promise<PremiumTier[]>;
// Reads from config/premium_pricing Firestore doc
// Returns tier definitions with current prices

export async function boostAd(
  adId: string,
  tierId: PremiumTierId
): Promise<void>;
// 1. Create doc in premium_ads/{uniqueId}
// 2. Set startDate = now, endDate = now + tier duration
// 3. Update ad doc: isPremium = true, premiumTier = tierId
// 4. Payment handled externally (MVP: manual/Telebirr/bank transfer)
//    Admin marks as "paid" in admin panel → Cloud Function activates boost
//
// ⚠️ MVP does NOT have in-app payment processing.
// Flow: Seller selects tier → sees payment instructions → pays externally →
//       Admin verifies → Admin activates boost from web dashboard

export async function getActiveBoost(adId: string): Promise<PremiumAd | null>;

export async function expireBoost(premiumAdId: string): Promise<void>;
// Called by scheduled Cloud Function daily at midnight
// Sets isPremium = false on ad doc
// Sets status = 'EXPIRED' on premium_ads doc
```

---

## 4.9 MODERATION SERVICE

**File: `src/services/ModerationService.ts`**

> ⚠️ Moderation actions are performed from the web admin dashboard ONLY. Mobile app only submits reports.

```ts
// ─── Mobile (User) ──────────────────────────────────────
export async function reportAd(
  adId: string,
  reason: ReportReasonId,
  details?: string
): Promise<void>;
// Creates doc in reports/{uniqueId}
// Sets status: 'PENDING'

export async function reportUser(
  userId: string,
  reason: ReportReasonId,
  details?: string
): Promise<void>;

// ─── Web Admin Dashboard ────────────────────────────────
export async function getPendingReports(
  cursor?: string
): Promise<PaginatedResult<Report>>;

export async function getPendingAds(
  cursor?: string
): Promise<PaginatedResult<Ad>>;
// Ads with status = PENDING_REVIEW

export async function approveAd(adId: string): Promise<void>;
// updateStatus(adId, 'ACTIVE')

export async function rejectAd(
  adId: string,
  reason: string
): Promise<void>;
// updateStatus(adId, 'REJECTED', reason)

export async function removeAd(adId: string): Promise<void>;
// updateStatus(adId, 'REMOVED')

export async function resolveReport(
  reportId: string,
  action: 'RESOLVED' | 'DISMISSED'
): Promise<void>;

export async function banUser(userId: string): Promise<void>;
// Sets user doc: banned = true
// All user's ACTIVE ads → REMOVED
// Auth: disable account via Admin SDK
```

---

## 4.10 HOME SCREEN

**Screen: `/(tabs)/home`**

```
[☰ Menu]   Bilu Store   [🔔 Notifications]

── Location Bar ────────────────────────────
📍 Addis Ababa  [Change ▾]

── Spotlight Carousel ──────────────────────
[Premium HOMEPAGE ads — horizontal auto-scroll]
[  Ad 1  |  Ad 2  |  Ad 3  ]
  ← swipe → (3 dots indicator)

── Categories Grid ─────────────────────────
[📱 Electronics] [🚗 Vehicles]  [🏠 Real Estate]
[👕 Fashion]     [🛋️ Home]     [💼 Jobs]
[🔧 Services]   [📚 Education] [⚽ Sports]
[📦 Other]
  ← 2 rows × 5 columns, horizontal scroll for overflow

── Featured Listings ───────────────────────
"Featured"  [See All →]
[AdCard] [AdCard] [AdCard]
  ← Horizontal scroll, FEATURED tier ads

── Recent Listings ─────────────────────────
"Just Posted"  [See All →]
[AdCard]
[AdCard]
[AdCard]
[AdCard]
  ← Vertical FlatList, paginated, sorted by createdAt DESC
  ← Only ACTIVE ads shown
```

**AdCard contract (reused across all listing screens):**
- Top: image carousel (first image as thumbnail, 16:9 aspect ratio)
- Badge (top-left): "Featured" gold badge if premium
- Heart icon (top-right): favorite toggle
- Below image: title (bold, 1 line, truncate) + price (bold, ACCENT color) + currency
- Below: location (muted, pin icon) + relative time ("2h ago")
- Bottom: condition badge ("New" / "Used") if applicable
- Card tap → `/ad/[adId]`
- Card size: full-width minus 16dp padding, or half-width in 2-column grid on search results

---

## 4.11 AD DETAIL SCREEN

**Screen: `/ad/[adId]`**

```
[← Back]   [Share]  [⋮ More]

── Image Gallery ───────────────────────────
[Full-width image carousel — swipeable]
[• • • ○ ○]  ← dot indicators
  Image counter: "3/8"

── Price & Title ───────────────────────────
ETB 15,000                        [❤️ Favorite]
iPhone 14 Pro Max — 256GB
📍 Addis Ababa · Posted 2h ago
🏷️ Negotiable

── Details ─────────────────────────────────
Category: Electronics
Condition: Used — Good
ID: #AD-7382

── Description ─────────────────────────────
"Full description text here...
 Multi-line, expandable with Read More
 if longer than 4 lines"
[Read More ▾]

── Seller Section ──────────────────────────
┌───────────────────────────────────────────┐
│  [Avatar]  John Doe                       │
│  ⭐ 4.5 (12 reviews) · Member since 2024 │
│  [View Profile →]                         │
└───────────────────────────────────────────┘

── Similar Ads ─────────────────────────────
"More in Electronics"
[AdCard] [AdCard] [AdCard]
  ← Horizontal scroll, same category, exclude current

── Action Bar (sticky bottom) ──────────────
┌───────────────────────────────────────────┐
│  [💬 Chat with Seller]  [📞 Call]         │
└───────────────────────────────────────────┘
  ← "Call" only if contactPreference == CHAT_AND_PHONE
  ← "Chat" requires auth (redirect if guest)
  ← If current user IS seller: show [✏️ Edit Ad] instead
```

**"⋮ More" menu options:**
- "Report this ad" → report flow (Section 4.9)
- "Share" → system share intent with deep link
- If own ad: "Mark as Sold" / "Edit" / "Delete"

---

## 4.12 NOTIFICATIONS

**File: `src/services/NotificationService.ts`**

```ts
export async function requestPermission(): Promise<boolean>;
// Request FCM permission on first auth

export async function registerToken(): Promise<void>;
// Get Expo push token → store in users/{uid}.pushToken

export async function handleIncomingNotification(
  notification: Notification
): Promise<void>;
// Route to correct screen based on notification type:
// NEW_MESSAGE → /chat/[chatId]
// AD_APPROVED → /ad/[adId]
// AD_REJECTED → /my-ads (with filter)
// AD_INTEREST → /chat/[chatId]
// PREMIUM_EXPIRING → /premium/[adId]
// NEW_REVIEW → /seller/[sellerId]

export function subscribeToBadgeCount(
  callback: (count: number) => void
): Unsubscribe;
// Total unread messages across all chats
```

**FCM Cloud Functions (triggers):**

```ts
// onNewMessage: fires on messages/{chatId}/messages/{msgId} create
//   → Send FCM to recipient if they are NOT in the chat screen
//   → Payload: type=NEW_MESSAGE, chatId, senderName, preview

// onAdStatusChange: fires on ads/{adId} update (status field)
//   → Send FCM to seller: AD_APPROVED or AD_REJECTED

// onNewReview: fires on reviews/{reviewId} create
//   → Send FCM to reviewed seller: NEW_REVIEW

// onPremiumExpiring: scheduled function, runs daily at 8:00 AM
//   → Query premium_ads expiring tomorrow
//   → Send FCM to each seller: PREMIUM_EXPIRING
```

---

## 4.13 SOCIAL SHARING

```ts
// In AdDetailScreen:
// "Share" button triggers system share intent

export function generateShareContent(ad: Ad): ShareContent {
  return {
    title: ad.title,
    message: `${ad.title}\n${formatPrice(ad.price, ad.currency)}\n\nCheck it out on Bilu Store:\nhttps://bilustore.com/ad/${ad.id}`,
    url: `https://bilustore.com/ad/${ad.id}`,
  };
}
// Uses expo-sharing or React Native Share API
// Deep link URL opens web version (Next.js) or app if installed
```

---

# SECTION 5 — APPROVED TECH STACK (LOCKED)

> ⚠️ Do NOT install any package not in this list without explicit user approval.

## 5.1 Mobile App (React Native / Expo)

| Category | Package + Version | Purpose |
|---|---|---|
| Core | `expo@51` + `react-native@0.74` | App runtime |
| Language | `typescript@5` (strict ON) | Type safety |
| Navigation | `expo-router@3` | File-based routing |
| Drawer | `@react-navigation/drawer@6` + `react-native-gesture-handler@2` + `react-native-reanimated@3` | Side drawer |
| State | `zustand@4` | Global store |
| Auth | `@react-native-firebase/auth@20` | Firebase Auth |
| Database | `@react-native-firebase/firestore@20` | Firestore client |
| Messaging | `@react-native-firebase/messaging@20` | FCM push notifications |
| Notifications | `expo-notifications@0.28` | Local notification handling |
| Image Picker | `expo-image-picker@15` | Camera + gallery access |
| Image Compression | `expo-image-manipulator@12` | Client-side compression |
| Media Upload | `cloudinary-react-native@1` (or fetch-based upload) | Cloudinary uploads |
| Linking | `expo-linking` | Deep links, external URLs |
| Sharing | `expo-sharing@12` | System share sheet |
| Location | `expo-location@17` | City/coordinates picker |
| Storage (KV) | `@react-native-async-storage/async-storage@2` | Cache, redirect intents |
| Animation | `react-native-reanimated@3` | UI transitions |
| Icons | `@expo/vector-icons` (Ionicons only) | UI icons |
| Constants | `expo-constants@16` | App version |
| Testing | `jest@29` + `@testing-library/react-native@12` | Tests |

## 5.2 Web Dashboard (Next.js)

| Category | Package | Purpose |
|---|---|---|
| Framework | `next@14` (App Router) | Web app |
| Styling | `tailwindcss@3` | CSS framework |
| Auth | `firebase@10` (web SDK) | Auth + Firestore |
| Charts | `recharts@2` | Admin analytics |
| Icons | `lucide-react` | Web icons |

## 5.3 Backend (Cloud Functions)

| Category | Package | Purpose |
|---|---|---|
| Runtime | `firebase-functions@5` | Serverless functions |
| Admin | `firebase-admin@12` | Server-side Firestore + Auth |
| Search | `algoliasearch@5` | Search indexing |

## 5.4 Approved Ionicons (Mobile)

| Icon Name | Usage |
|---|---|
| `home-outline` | Home tab |
| `search-outline` | Search tab |
| `add-circle` | Post tab (FAB) |
| `chatbubble-outline` | Chat tab |
| `person-outline` | Profile tab |
| `heart-outline` / `heart` | Favorite toggle |
| `star` / `star-outline` | Rating stars |
| `camera-outline` | Image upload |
| `location-outline` | Location |
| `pricetag-outline` | Price / deal |
| `time-outline` | Timestamp |
| `share-outline` | Share |
| `flag-outline` | Report |
| `pencil-outline` | Edit |
| `trash-outline` | Delete |
| `chevron-back` | Back |
| `chevron-forward` | Forward / see more |
| `menu-outline` | Hamburger |
| `notifications-outline` | Notifications |
| `call-outline` | Phone call |
| `send-outline` | Send message |
| `image-outline` | Image in chat |
| `checkmark-circle` | Verified / approved |
| `close-circle` | Rejected / remove |
| `ellipsis-vertical` | More options |
| `filter-outline` | Search filters |
| `swap-vertical` | Sort |
| `eye-outline` | View count |
| `shield-checkmark-outline` | Verified seller |
| `close` | Cancel |

> ⚠️ Do NOT use any icon not in this list. Do NOT import from any icon set other than Ionicons.

---

# SECTION 6 — FILE STRUCTURE (CANONICAL)

> ⚠️ All new files MUST be created at the exact paths shown.

```
bilu-store/
├── mobile/                                  # React Native / Expo app
│   ├── app/
│   │   ├── _layout.tsx                      # Root layout: auth guard + drawer
│   │   ├── index.tsx                        # Redirect → /(tabs)/home or /auth/login
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx                  # Bottom tab bar layout
│   │   │   ├── home.tsx                     # Home Feed Screen
│   │   │   ├── search.tsx                   # Search Screen
│   │   │   ├── post.tsx                     # Post redirect (opens /post/create)
│   │   │   ├── chat.tsx                     # Chat List Screen
│   │   │   └── profile.tsx                  # My Profile Screen
│   │   ├── auth/
│   │   │   ├── login.tsx                    # Login Screen
│   │   │   ├── register.tsx                 # Register Screen
│   │   │   └── phone-verify.tsx             # Phone OTP Screen
│   │   ├── ad/
│   │   │   └── [adId].tsx                   # Ad Detail Screen
│   │   ├── category/
│   │   │   └── [categoryId].tsx             # Category Listings
│   │   ├── search-results.tsx               # Search Results Screen
│   │   ├── post/
│   │   │   ├── create.tsx                   # Create Ad Screen
│   │   │   └── edit/
│   │   │       └── [adId].tsx               # Edit Ad Screen
│   │   ├── chat/
│   │   │   └── [chatId].tsx                 # Chat Conversation Screen
│   │   ├── seller/
│   │   │   └── [sellerId].tsx               # Seller Profile Screen
│   │   ├── review/
│   │   │   └── create/
│   │   │       └── [sellerId].tsx           # Write Review Screen
│   │   ├── my-ads.tsx                       # My Ads Screen
│   │   ├── favorites.tsx                    # Saved Ads Screen
│   │   ├── premium/
│   │   │   └── [adId].tsx                   # Boost Ad Screen
│   │   ├── settings.tsx                     # Settings Screen
│   │   ├── profile/
│   │   │   └── edit.tsx                     # Edit Profile Screen
│   │   ├── about-app.tsx                    # About App
│   │   └── about-developer.tsx              # About Developer
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdCard.tsx                   # Reusable ad listing card
│   │   │   ├── AdImageCarousel.tsx          # Swipeable image gallery
│   │   │   ├── CategoryGrid.tsx             # Category icon grid
│   │   │   ├── CategoryChip.tsx             # Filter chip
│   │   │   ├── ChatBubble.tsx               # Single message bubble
│   │   │   ├── ChatListItem.tsx             # Chat list row
│   │   │   ├── FavoriteButton.tsx           # Heart toggle
│   │   │   ├── FilterSheet.tsx              # Search filter bottom sheet
│   │   │   ├── ImagePicker.tsx              # Multi-image picker
│   │   │   ├── LocationPicker.tsx           # City selector
│   │   │   ├── PriceDisplay.tsx             # Formatted price with currency
│   │   │   ├── RatingStars.tsx              # 1-5 star display + input
│   │   │   ├── ReviewCard.tsx               # Single review display
│   │   │   ├── SellerCard.tsx               # Seller info section
│   │   │   ├── PremiumBadge.tsx             # "Featured" / "Highlighted" badge
│   │   │   ├── ConditionBadge.tsx           # "New" / "Used" badge
│   │   │   ├── StatusBadge.tsx              # Ad status badge (active/pending/sold)
│   │   │   ├── EmptyState.tsx               # Reusable empty state
│   │   │   ├── DrawerContent.tsx            # Custom drawer
│   │   │   ├── InlineConfirm.tsx            # Inline yes/no (no modals for destructive)
│   │   │   ├── SearchBar.tsx                # Search input with debounce
│   │   │   ├── SortSelector.tsx             # Sort dropdown
│   │   │   └── NotificationBadge.tsx        # Unread count badge
│   │   │
│   │   ├── services/
│   │   │   ├── AuthService.ts               # ONLY auth operations
│   │   │   ├── AdService.ts                 # ONLY ad CRUD + status
│   │   │   ├── SearchService.ts             # ONLY search (Algolia + Firestore)
│   │   │   ├── ChatService.ts               # ONLY chat operations
│   │   │   ├── MediaService.ts              # ONLY image upload/compress
│   │   │   ├── FavoriteService.ts           # ONLY favorites
│   │   │   ├── ReviewService.ts             # ONLY reviews
│   │   │   ├── PremiumService.ts            # ONLY premium/boost
│   │   │   ├── ModerationService.ts         # ONLY reports (mobile side)
│   │   │   ├── NotificationService.ts       # ONLY notifications
│   │   │   └── UserService.ts               # ONLY user profile CRUD
│   │   │
│   │   ├── stores/
│   │   │   ├── authStore.ts                 # Zustand: auth state, current user
│   │   │   ├── adsStore.ts                  # Zustand: feed, category ads, search results
│   │   │   ├── chatStore.ts                 # Zustand: chat list, active chat, unread count
│   │   │   ├── favoritesStore.ts            # Zustand: favorite ad IDs set
│   │   │   └── uiStore.ts                   # Zustand: loading, toasts, modals
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                   # Auth state + guard logic
│   │   │   ├── useAd.ts                     # Single ad fetch + subscribe
│   │   │   ├── usePagination.ts             # Firestore cursor pagination
│   │   │   ├── useSearch.ts                 # Debounced search + filters
│   │   │   ├── useChat.ts                   # Active chat messages
│   │   │   └── useLocation.ts               # Device location
│   │   │
│   │   ├── utils/
│   │   │   ├── dateHelpers.ts               # Relative time, formatting
│   │   │   ├── priceFormatter.ts            # "ETB 15,000" formatting
│   │   │   ├── validators.ts                # Form validation helpers
│   │   │   └── deepLink.ts                  # Deep link generation
│   │   │
│   │   └── constants/
│   │       ├── colors.ts                    # Design tokens (Section 10)
│   │       ├── categories.ts                # Category definitions
│   │       ├── adStatuses.ts                # Ad status machine
│   │       ├── premiumTiers.ts              # Premium tier definitions
│   │       ├── reportReasons.ts             # Report reason definitions
│   │       ├── notificationTypes.ts         # Notification type definitions
│   │       ├── routes.ts                    # HIDE_TAB_ROUTES
│   │       ├── imageConstraints.ts          # Upload limits
│   │       ├── currencies.ts                # Supported currencies
│   │       ├── conditions.ts                # Item condition options
│   │       ├── developerConfig.ts           # About Developer
│   │       ├── privacyPolicy.ts             # Privacy text
│   │       └── termsOfService.ts            # Terms text
│   │
│   ├── assets/
│   │   └── icon.png
│   ├── app.json
│   └── __tests__/
│       ├── AdService.test.ts                # Required
│       ├── SearchService.test.ts            # Required
│       ├── ChatService.test.ts              # Required
│       ├── ReviewService.test.ts            # Required
│       ├── priceFormatter.test.ts           # Required
│       ├── validators.test.ts               # Required
│       └── dateHelpers.test.ts              # Required
│
├── web/                                     # Next.js web dashboard
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                         # Landing / home
│   │   ├── ad/[adId]/page.tsx               # Ad detail (web)
│   │   ├── category/[categoryId]/page.tsx   # Category listing
│   │   ├── seller/[sellerId]/page.tsx       # Seller profile
│   │   ├── admin/
│   │   │   ├── layout.tsx                   # Admin layout (role guard)
│   │   │   ├── page.tsx                     # Admin dashboard
│   │   │   ├── ads/page.tsx                 # Pending ads review
│   │   │   ├── reports/page.tsx             # Reports queue
│   │   │   └── users/page.tsx               # User management
│   │   └── auth/
│   │       └── login/page.tsx               # Web login
│   ├── src/
│   │   ├── components/                      # Web-specific components
│   │   ├── services/                        # Shared service contracts (web SDK)
│   │   └── lib/
│   │       └── firebase.ts                  # Firebase web init
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── functions/                               # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                         # Function exports
│   │   ├── triggers/
│   │   │   ├── onAdWrite.ts                 # Algolia sync + notifications
│   │   │   ├── onMessageCreate.ts           # Chat notification
│   │   │   ├── onReviewCreate.ts            # Review notification + rating recalc
│   │   │   └── onPremiumExpiry.ts           # Scheduled premium cleanup
│   │   └── utils/
│   │       ├── algolia.ts                   # Algolia client
│   │       └── fcm.ts                       # FCM sender
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules                          # Firestore security rules
├── firestore.indexes.json                   # Composite indexes
└── firebase.json                            # Firebase config
```

---

# SECTION 8 — DATABASE SCHEMA (FIRESTORE)

> ⚠️ All collections and document shapes defined here. Do not create additional top-level collections without updating this section.

## 8.1 Collections

```
users/{userId}
ads/{adId}
  └── status_history/{historyId}     # subcollection
chats/{chatId}
  └── messages/{messageId}           # subcollection
reviews/{reviewId}
favorites/{favoriteId}
premium_ads/{premiumAdId}
reports/{reportId}
config/premium_pricing               # single doc
config/app_settings                  # single doc (feature flags)
```

## 8.2 Document Shapes

```ts
// users/{userId}
{
  id: string,                     // same as auth UID
  name: string,
  email: string | null,
  phone: string | null,
  avatar: string | null,          // Cloudinary URL
  location: string | null,        // city name
  role: 'USER' | 'ADMIN',
  averageRating: number,          // 0–5, computed
  totalReviews: number,
  totalAds: number,
  banned: boolean,
  pushToken: string | null,       // FCM token
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
}

// ads/{adId}
{
  id: string,
  title: string,                  // 5–100 chars
  description: string,            // 20–2000 chars
  price: number,
  currency: 'ETB' | 'USD',
  category: CategoryId,
  subcategory: string | null,
  images: string[],               // Cloudinary URLs, 1–8
  thumbnails: string[],           // Cloudinary thumbnail URLs
  location: string,               // city name
  coordinates: GeoPoint | null,
  condition: 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR' | null,
  contactPreference: 'CHAT_ONLY' | 'CHAT_AND_PHONE',
  negotiable: boolean,
  sellerId: string,               // ref to users
  sellerName: string,             // denormalized for listing cards
  sellerAvatar: string | null,    // denormalized
  status: AdStatus,
  rejectionReason: string | null,
  isPremium: boolean,
  premiumTier: PremiumTierId | null,
  viewCount: number,
  favoriteCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiresAt: Timestamp,           // createdAt + 30 days
}

// chats/{chatId}
{
  id: string,                     // {sortedUid1}_{sortedUid2}_{adId}
  participants: string[],         // [uid1, uid2]
  adId: string,
  adTitle: string,                // denormalized
  adThumbnail: string,            // denormalized
  lastMessage: string,
  lastMessageAt: Timestamp,
  unreadCount: { [userId: string]: number },
  deletedBy: string[],            // users who deleted their side
  createdAt: Timestamp,
}

// chats/{chatId}/messages/{messageId}
{
  id: string,
  senderId: string,
  text: string | null,
  image: string | null,           // Cloudinary URL
  createdAt: Timestamp,
}

// reviews/{reviewId}
{
  id: string,
  reviewerId: string,
  reviewerName: string,           // denormalized
  reviewerAvatar: string | null,  // denormalized
  sellerId: string,
  rating: number,                 // 1–5
  comment: string,                // 10–500 chars
  createdAt: Timestamp,
}

// favorites/{favoriteId}
{
  id: string,
  userId: string,
  adId: string,
  savedAt: Timestamp,
}
// Composite index: userId ASC, savedAt DESC

// premium_ads/{premiumAdId}
{
  id: string,
  adId: string,
  sellerId: string,
  tierId: PremiumTierId,
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED',
  startDate: Timestamp | null,
  endDate: Timestamp | null,
  createdAt: Timestamp,
}

// reports/{reportId}
{
  id: string,
  reporterId: string,
  targetType: 'AD' | 'USER',
  targetId: string,
  reason: ReportReasonId,
  details: string | null,
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED',
  adminNote: string | null,
  createdAt: Timestamp,
  resolvedAt: Timestamp | null,
}
```

## 8.3 Required Firestore Indexes

```json
// firestore.indexes.json
[
  { "collectionGroup": "ads", "fields": [
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isPremium", "order": "DESCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]},
  { "collectionGroup": "ads", "fields": [
    { "fieldPath": "sellerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]},
  { "collectionGroup": "ads", "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]},
  { "collectionGroup": "chats", "fields": [
    { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
    { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
  ]},
  { "collectionGroup": "favorites", "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "savedAt", "order": "DESCENDING" }
  ]},
  { "collectionGroup": "reviews", "fields": [
    { "fieldPath": "sellerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]}
]
```

---

# SECTION 9 — TYPESCRIPT INTERFACES (COMPLETE)

**File: `src/types/index.ts`**

```ts
// ─── Categories ──────────────────────────────────────────
export type CategoryId =
  | 'ELECTRONICS' | 'VEHICLES' | 'REAL_ESTATE' | 'FASHION'
  | 'HOME_FURNITURE' | 'JOBS' | 'SERVICES' | 'EDUCATION'
  | 'SPORTS' | 'OTHER';

// ─── Ad Status ───────────────────────────────────────────
export type AdStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SOLD'
  | 'EXPIRED' | 'REJECTED' | 'REMOVED';

// ─── Ad Condition ────────────────────────────────────────
export type AdCondition = 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR';

// ─── Contact Preference ──────────────────────────────────
export type ContactPreference = 'CHAT_ONLY' | 'CHAT_AND_PHONE';

// ─── Currency ────────────────────────────────────────────
export type Currency = 'ETB' | 'USD';

// ─── Premium ─────────────────────────────────────────────
export type PremiumTierId = 'FEATURED' | 'TOP_SEARCH' | 'HOMEPAGE' | 'HIGHLIGHT';
export type PremiumStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED';

// ─── Report ──────────────────────────────────────────────
export type ReportReasonId =
  | 'SPAM' | 'PROHIBITED_ITEM' | 'SCAM' | 'WRONG_CATEGORY'
  | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

// ─── User ────────────────────────────────────────────────
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

// ─── Ad ──────────────────────────────────────────────────
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
  images: string[];            // local URIs before upload
  location: string;
  coordinates?: { lat: number; lng: number };
  condition?: AdCondition;
  contactPreference: ContactPreference;
  negotiable: boolean;
}

export type UpdateAdInput = Partial<CreateAdInput>;

// ─── Chat ────────────────────────────────────────────────
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

// ─── Review ──────────────────────────────────────────────
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

// ─── Premium ─────────────────────────────────────────────
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

// ─── Report ──────────────────────────────────────────────
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

// ─── Pagination ──────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;       // last doc ID for next page
  hasMore: boolean;
}

// ─── Search ──────────────────────────────────────────────
export interface SearchFilters {
  categoryId?: CategoryId;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: AdCondition;
  sortBy: 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RELEVANCE';
}

// ─── Notification ────────────────────────────────────────
export type NotificationType =
  | 'NEW_MESSAGE' | 'AD_APPROVED' | 'AD_REJECTED'
  | 'AD_INTEREST' | 'PREMIUM_EXPIRING' | 'NEW_REVIEW';

// ─── Stores ──────────────────────────────────────────────
export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
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
  subscribeToChats: () => Unsubscribe;
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
```

---

# SECTION 10 — DESIGN TOKENS

**File: `src/constants/colors.ts`**

> ⚠️ All colors MUST use these token names. Never hardcode hex values.

```ts
export const COLORS = {
  // Backgrounds
  BG_SCREEN:      '#F7F8FA',
  BG_CARD:        '#FFFFFF',
  BG_DISABLED:    '#EBEBEB',

  // Brand
  ACCENT:         '#FF6B35',   // Warm orange — marketplace energy
  ACCENT_LIGHT:   '#FFF0E8',
  ACCENT_DARK:    '#E55A2B',

  // Text
  TEXT_DARK:      '#1A1A2E',
  TEXT_MUTED:     '#8A8A9A',
  TEXT_ON_ACCENT: '#FFFFFF',

  // Status
  SUCCESS_GREEN:  '#4CAF50',
  ERROR_RED:      '#F44336',
  WARNING_AMBER:  '#FF9800',
  INFO_BLUE:      '#2196F3',

  // Premium
  PREMIUM_GOLD:   '#FFB800',

  // Rating
  STAR_GOLD:      '#FFC107',
  STAR_GRAY:      '#E0E0E0',

  // Chat
  CHAT_SENT_BG:   '#FF6B35',   // Same as ACCENT
  CHAT_RECEIVED_BG: '#F0F0F5',

  // UI
  BORDER:         '#E0E0E8',
  SHADOW:         '#00000010',
  DIVIDER:        '#F0F0F5',

  // Category colors (for grid icons)
  CAT_ELECTRONICS:    '#4ECDC4',
  CAT_VEHICLES:       '#45B7D1',
  CAT_REAL_ESTATE:    '#96CEB4',
  CAT_FASHION:        '#DDA0DD',
  CAT_HOME_FURNITURE: '#FFEAA7',
  CAT_JOBS:           '#74B9FF',
  CAT_SERVICES:       '#A29BFE',
  CAT_EDUCATION:      '#FD79A8',
  CAT_SPORTS:         '#00B894',
  CAT_OTHER:          '#B0B0B0',
} as const;

export const FONT_SIZE = {
  XS:  11,
  SM:  13,
  MD:  15,
  LG:  17,
  XL:  22,
  XXL: 28,
  PRICE: 24,   // Price display
} as const;
```

---

# SECTION 12 — ERROR HANDLING & FALLBACK CONTRACTS

> ⚠️ Every failure mode has a defined behavior. The app must never crash silently.

**12.1 Firebase Auth Failure** — If login/register fails: show inline error with Firebase error message (mapped to user-friendly strings). "Invalid phone number", "Email already in use", "Wrong password", "Network error — check your connection." Never show raw Firebase error codes.

**12.2 Ad Creation — Image Upload Failure** — If any image fails to upload to Cloudinary: retry once automatically. If retry fails: show toast "Some images failed to upload. Please try again." Do NOT publish the ad. Keep user on form with uploaded images intact.

**12.3 Ad Creation — Firestore Write Failure** — If Firestore write fails after images uploaded: show toast "Could not publish ad. Please try again." Images remain on Cloudinary (orphan cleanup via scheduled Cloud Function weekly).

**12.4 Chat Message Send Failure** — If Firestore write fails: show red error icon next to message. Tap to retry. Do NOT remove message from UI. Show: "Message not sent. Tap to retry."

**12.5 Search — Algolia Unavailable** — If Algolia request fails: fall back to Firestore title prefix query (limited but functional). Show subtle banner: "Search is limited. Try again later."

**12.6 FCM Token Registration Failure** — If push token registration fails: log warning. User won't receive push notifications. Chat still works via Firestore real-time. Show nothing to user — silent failure.

**12.7 Image Compression Failure** — If `expo-image-manipulator` fails: upload original image (skip compression). Log warning. May result in slower upload but ad is not blocked.

**12.8 Firestore Offline** — If device is offline: Firestore offline persistence handles reads from cache. Writes queue until online. Show subtle "Offline" badge in header. Disable "Publish Ad" button (requires online for image upload).

**12.9 Ad Not Found** — If `getAdById()` returns null: navigate back. Show toast: "This ad is no longer available."

**12.10 Banned User** — If user document has `banned: true`: force logout on auth state change. Show: "Your account has been suspended. Contact support." Prevent re-login.

---

# SECTION 13 — APP.JSON CONFIGURATION (MOBILE)

```json
{
  "expo": {
    "name": "Bilu Store",
    "slug": "bilu-store",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#FF6B35"
      },
      "package": "com.bilustore.app",
      "minSdkVersion": 26,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-image-picker",
      "expo-location",
      "@react-native-firebase/app",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#FF6B35",
          "sounds": []
        }
      ]
    ]
  }
}
```

---

# SECTION 14 — PERFORMANCE REQUIREMENTS

| Requirement | Target | Implementation |
|---|---|---|
| App cold open → Home feed | < 2s | Firestore cache + optimistic render |
| Ad detail load | < 1s | Single document fetch + cached images |
| Image upload (per image) | < 3s on 3G | Client compression to <500KB before upload |
| Search results | < 500ms | Algolia instant search |
| Chat message delivery | < 300ms | Firestore real-time listener |
| FlatList scroll (100 ads) | 60fps | `getItemLayout`, fixed card height, image caching |
| Ad creation form → published | < 10s total | Parallel image uploads |
| Pagination (next page) | < 500ms | Cursor-based Firestore queries |

---

# SECTION 15 — ANTI-PATTERNS (WHAT THE AI MUST NEVER DO)

- 🚫 Never process payments in-app in MVP — premium is external payment + admin activation
- 🚫 Never expose seller phone number in ad listing — only after "Chat with Seller" or "Call" button tap by authenticated user
- 🚫 Never upload raw uncompressed images to Cloudinary — always compress first
- 🚫 Never write Firestore queries inline in components — all through `src/services/`
- 🚫 Never call Firebase Auth methods outside of `AuthService`
- 🚫 Never call Cloudinary upload outside of `MediaService`
- 🚫 Never allow ad posting without authentication
- 🚫 Never allow reviewing yourself
- 🚫 Never allow duplicate reviews (same reviewer → same seller)
- 🚫 Never show DRAFT, PENDING_REVIEW, REJECTED, or REMOVED ads to buyers
- 🚫 Never skip ad status validation — enforce state machine transitions
- 🚫 Never hardcode premium prices — read from Firestore `config/premium_pricing`
- 🚫 Never hardcode color hex values — use `COLORS` tokens
- 🚫 Never hardcode font sizes — use `FONT_SIZE` constants
- 🚫 Never use `any` TypeScript type — strict mode ON
- 🚫 Never add a library not in Section 5 — ask first
- 🚫 Never hardcode developer info — use `developerConfig.ts`
- 🚫 Never store message content in Algolia — only ad data
- 🚫 Never allow banned users to post, chat, or review
- 🚫 Never create chat without both users being authenticated
- 🚫 Never skip Firestore security rules — all access must be authenticated and authorized
- 🚫 Never use Firestore for full-text search — use Algolia
- 🚫 Never send more than 5 FCM notifications per user per hour (rate limit in Cloud Function)

---

# SECTION 16 — REQUIRED TEST CONTRACTS

## 16.1 `__tests__/AdService.test.ts`

```ts
describe('AdService', () => {
  it('createAd validates required fields');
  it('createAd rejects title < 5 chars');
  it('createAd rejects description < 20 chars');
  it('createAd rejects 0 images');
  it('createAd rejects > 8 images');
  it('createAd auto-approves for trusted sellers');
  it('createAd sets PENDING_REVIEW for new sellers');
  it('updateStatus enforces valid transitions');
  it('updateStatus rejects invalid transitions');
  it('markAsSold sets status to SOLD');
  it('republishAd resets EXPIRED to PENDING_REVIEW');
  it('deleteAd soft-deletes (sets REMOVED)');
  it('getAdsByCategory returns only ACTIVE ads');
  it('getAdsByCategory shows premium ads first');
});
```

## 16.2 `__tests__/SearchService.test.ts`

```ts
describe('SearchService', () => {
  it('searchByKeyword returns results from Algolia');
  it('searchByKeyword applies category filter');
  it('searchByKeyword applies price range filter');
  it('browseWithFilters uses Firestore compound query');
  it('browseWithFilters paginates correctly');
  it('returns empty result for no matches');
});
```

## 16.3 `__tests__/ChatService.test.ts`

```ts
describe('ChatService', () => {
  it('getOrCreateChat returns existing chat if exists');
  it('getOrCreateChat creates new chat if not exists');
  it('chatId format uses sorted UIDs + adId');
  it('sendMessage adds to subcollection');
  it('sendMessage updates lastMessage on chat doc');
  it('markAsRead resets unread count');
});
```

## 16.4 `__tests__/ReviewService.test.ts`

```ts
describe('ReviewService', () => {
  it('submitReview creates review doc');
  it('submitReview recalculates seller averageRating');
  it('canReview returns false for self-review');
  it('canReview returns false for duplicate review');
  it('canReview returns false if no prior chat');
  it('rejects rating outside 1–5');
  it('rejects comment < 10 chars');
});
```

## 16.5 `__tests__/priceFormatter.test.ts`

```ts
describe('priceFormatter', () => {
  it('formats ETB 15000 as "ETB 15,000"');
  it('formats USD 99.99 as "$99.99"');
  it('formats 0 as "Free"');
  it('handles large numbers with commas');
});
```

## 16.6 `__tests__/validators.test.ts`

```ts
describe('validators', () => {
  it('validateAdTitle rejects < 5 chars');
  it('validateAdTitle rejects > 100 chars');
  it('validateAdDescription rejects < 20 chars');
  it('validateAdPrice rejects negative');
  it('validateAdPrice accepts 0 (free)');
  it('validateReviewComment rejects < 10 chars');
  it('validateReviewRating rejects 0');
  it('validateReviewRating rejects 6');
});
```

## 16.7 `__tests__/dateHelpers.test.ts`

```ts
describe('dateHelpers', () => {
  it('relativeTime returns "Just now" for < 60s');
  it('relativeTime returns "2h ago" for 2 hours');
  it('relativeTime returns "Yesterday"');
  it('relativeTime returns date for older');
});
```

---

# SECTION 17 — FIRESTORE SECURITY RULES

```
// firestore.rules (critical excerpt)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: authenticated can read any user, can only write own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && !resource.data.banned;
    }

    // Ads: anyone can read ACTIVE, only owner can write
    match /ads/{adId} {
      allow read: if resource.data.status == 'ACTIVE'
                  || request.auth.uid == resource.data.sellerId
                  || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow create: if request.auth != null
                    && !get(/databases/$(database)/documents/users/$(request.auth.uid)).data.banned;
      allow update: if request.auth.uid == resource.data.sellerId
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      allow delete: if false; // soft delete only
    }

    // Chats: only participants can read/write
    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }

    // Reviews: authenticated can create (one per seller), anyone can read
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.auth.uid != request.resource.data.sellerId;
    }

    // Favorites: only owner
    match /favorites/{favId} {
      allow read, write: if request.auth.uid == resource.data.userId
                         || request.auth.uid == request.resource.data.userId;
    }

    // Reports: authenticated can create, only admin can read/update
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }

    // Config: anyone can read, only admin can write
    match /config/{docId} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
  }
}
```

> ⚠️ These rules are CRITICAL for security. Never deploy without them. Test with Firebase Emulator before deploying.

---

# SECTION 18 — FUTURE FEATURES (v2 — DO NOT BUILD IN MVP)

| Feature | Architecture Note |
|---|---|
| In-app payments | Integrate Telebirr / Chapa / Stripe. Add `payments` collection. PremiumService handles payment verification. |
| AI price suggestion | Cloud Function calls OpenAI with category + condition + location. Returns suggested price range. |
| Video ads | Cloudinary supports video upload. Add `video` field to ad doc. Max 30s, 720p. |
| Location-based search | GeoFirestore or Algolia geosearch. Requires coordinates on all ads. |
| Seller analytics dashboard | Cloud Function aggregates: views, favorites, messages per ad. Web dashboard charts. |
| Automated scam detection | Cloud Function with keyword blacklist + image duplicate detection via Cloudinary. |
| Multi-language | i18n with `react-i18next`. Strings already abstracted in constants. |
| Dark mode | `COLORS` token system ready. Add `DARK_COLORS` + ThemeContext. |
| iOS support | Expo managed — near-zero effort. Firebase works on both platforms. |
| Push notification preferences | Per-type toggle in settings. Filter in Cloud Function before sending. |
| Saved searches | `saved_searches` collection. Notify when new ads match criteria. |

---

# SECTION 19 — SUCCESS METRICS

| Metric | Target | How Measured |
|---|---|---|
| Time to first ad posted | < 2 min from registration | Analytics: auth timestamp → first ad timestamp |
| Ad creation → published | < 30s (form + upload) | Client-side timer |
| Search to contact | < 3 taps (search → ad → chat) | Navigation depth tracking |
| Chat response time | < 5 min average | Firestore query: message timestamps |
| Home feed render | < 2s cold start | Performance profiler |
| Image upload speed | < 3s per image on 3G | Client-side timer |
| Crash rate | 0 unhandled errors | Error fallback contracts in Section 12 |
| Security | 0 unauthorized data access | Firestore rules + emulator tests |
| Premium conversion | 5% of active sellers | Firestore query: premium_ads / total sellers |
| Moderation queue | < 4h average review time | Admin dashboard metrics |

---

---

# SECTION 20 — PAYMENT ARCHITECTURE

## Overview

Premium boosts are paid through in-app payment flow using **Chapa** (primary) and **Telebirr** (secondary). No payment credentials are ever held on the mobile client — all API calls go through Firebase Cloud Functions (HTTPS callable or HTTPS trigger).

## Payment Flow

```
Mobile App                    Cloud Function               Chapa / Telebirr
    │                               │                              │
    │── initializePayment() ───────>│                              │
    │   { adId, tierId, method }    │── POST /transaction/init ──>│
    │                               │<── { checkout_url, tx_ref } ─│
    │<── { url, tx_ref } ──────────│                              │
    │                               │                              │
    │── open WebView / USSD push    │                              │
    │                               │                              │
    │                               │<── Webhook POST ─────────────│
    │                               │   (HMAC-SHA256 verified)     │
    │                               │── verify tx ────────────────>│
    │                               │<── { status: 'success' } ────│
    │                               │── activate premium in Firestore
    │                               │── send FCM notification
```

## Chapa Integration

**Environment variables** (`functions/.env`):
```
CHAPA_SECRET_KEY=CHASECK_TEST-...
CHAPA_WEBHOOK_SECRET=whsec_...
```

**Initialize payment** — HTTPS Callable `initializePayment`:
- Validates `adId` (must be owner), `tierId`, `method` ('CHAPA_HOSTED' | 'CHAPA_USSD')
- Creates a `payment_sessions` Firestore doc with `{ adId, tierId, sellerId, tx_ref, status: 'PENDING', createdAt }`
- `tx_ref` format: `bilu-{adId}-{tierId}-{timestamp}`
- For hosted: calls `POST https://api.chapa.co/v1/transaction/initialize`, returns `checkout_url`
- For USSD: calls `POST https://api.chapa.co/v1/charges?type=telebirr`, returns USSD push result

**Webhook handler** — HTTPS function `onChapaWebhook` at `/onChapaWebhook`:
- Reads raw body, verifies `x-chapa-signature` header via HMAC-SHA256
- Looks up `payment_sessions` by `tx_ref`
- Calls `GET https://api.chapa.co/v1/transaction/verify/{tx_ref}` as double-check
- On `status === 'success'`: activates premium in Firestore, sends FCM to seller

**Payment session activation** (inside webhook handler):
1. Update `payment_sessions/{sessionId}` → `status: 'PAID', paidAt`
2. Call `PremiumService.activateBoost(adId, tierId, sellerId, durationDays)`
3. Send FCM: "Your boost is now live!"

## Telebirr Integration

**Environment variables** (`functions/.env`):
```
TELEBIRR_APP_ID=...
TELEBIRR_APP_KEY=...
TELEBIRR_SHORT_CODE=...
TELEBIRR_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
```

**Flow**: RSA-encrypt `appSecret` using Telebirr public key → AES-128-ECB encrypt the payload using the decrypted `appSecret` → POST to Fabric Gateway → receive `toPayUrl` → mobile opens WebView → Telebirr calls `notifyUrl` on success.

**Note**: Telebirr has no public sandbox. Development and testing require a merchant account from Ethio Telecom.

## Firestore: payment_sessions Collection

```
payment_sessions/{sessionId}
  tx_ref:      string   // unique: "bilu-{adId}-{tierId}-{ts}"
  adId:        string
  tierId:      PremiumTierId
  sellerId:    string
  method:      'CHAPA_HOSTED' | 'CHAPA_USSD' | 'TELEBIRR'
  status:      'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
  amount:      number
  currency:    'ETB'
  createdAt:   number
  paidAt:      number | null
```

## Security Rules

```
match /payment_sessions/{sessionId} {
  allow read: if request.auth.uid == resource.data.sellerId;
  allow write: if false; // only Cloud Functions write
}
```

## Anti-patterns (additions to §15)

- NEVER call Chapa or Telebirr APIs from the mobile client — only Cloud Functions
- NEVER store `tx_ref` as the document ID (use auto-ID, store `tx_ref` as a field for querying)
- NEVER activate premium without server-side verification via `GET /transaction/verify/{tx_ref}`
- NEVER expose `CHAPA_SECRET_KEY` or `TELEBIRR_APP_KEY` in any client bundle

---

# SECTION 21 — AUTHENTICATION SYSTEM

## Auth Methods

| Method | Package | Status |
|--------|---------|--------|
| Email / Password | Firebase Auth (built-in) | Active |
| Phone OTP | Firebase Auth (built-in) | Active |
| Google Sign-In | `@react-native-google-signin/google-signin` | Active |
| Facebook Login | `react-native-fbsdk-next` | Active |

All methods converge into `upsertSocialUser()` in `AuthService.ts`, which creates a Firestore `users` doc on first login and updates `lastLoginAt` on subsequent logins.

## Google Sign-In Flow

1. App calls `GoogleSignin.signIn()` → returns `{ idToken }`
2. App calls `AuthService.loginWithGoogle(idToken)`
3. Service calls `GoogleAuthProvider.credential(idToken)` → `signInWithCredential(auth, credential)`
4. `upsertSocialUser()` creates/updates Firestore `users` doc

**Required setup**:
- Add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to `.env`
- Configure `GoogleSignin.configure({ webClientId })` in app entry point
- Add `com.google.android.gms:play-services-auth` to Android via `expo-build-properties`
- Add `GoogleService-Info.plist` to iOS project

## Facebook Login Flow

1. App calls `LoginManager.logInWithPermissions(['public_profile', 'email'])`
2. On success: `AccessToken.getCurrentAccessToken()` → get `accessToken.accessTokenString`
3. App calls `AuthService.loginWithFacebook(accessToken)`
4. Service calls `FacebookAuthProvider.credential(accessToken)` → `signInWithCredential(auth, credential)`
5. `upsertSocialUser()` creates/updates Firestore `users` doc

**Required setup**:
- Create Facebook App at developers.facebook.com
- Add `EXPO_PUBLIC_FACEBOOK_APP_ID` and `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN` to `.env`
- Configure in `app.json` under `expo.android.facebookAppId` and `expo.ios.facebookAppId`

## Login Screen Layout

```
[Logo + Subtitle]
[Email Input]
[Password Input]
[Sign In Button]
──── or ────
[Sign in with Phone]
[Continue with Google]   ← new
[Continue with Facebook] ← new
[Don't have an account? Sign Up]
```

## Registration Screen

Same social buttons appear below the email/password form with identical behavior.

---

> **END OF PRP — Bilu Store v1.0 MVP**
>
> **Changelog — Original PRD → PRP v1.0 (10/10 Edition):**
>
> - **§0** — AI session start prompt + 17 hard rules covering auth, media, chat, moderation, and type safety
> - **§1** — Triple-platform snapshot: mobile (Expo SDK 51), web (Next.js 14), backend (Cloud Functions) — all version-pinned with bundle IDs and SDK versions
> - **§2** — Full content inventory: 10 categories, 7-state ad status machine with auto-approve logic, 4 premium tiers with pricing architecture, 7 report reasons, 6 notification types with exact template strings, image upload constraints (compression targets, max sizes, Cloudinary folder paths)
> - **§3** — 24-route screen map with auth guards, 5-tab bottom bar with FAB-style Post button, complete drawer spec with guest vs authenticated states
> - **§4.1** — AuthService: 3 auth methods (phone + Google + email), user document creation on first auth, auth guard with redirect-after-login pattern
> - **§4.2** — AdService: 12-field creation form with exact validation rules, complete CRUD contract with pagination, status transition enforcement, auto-approve qualification logic
> - **§4.3** — SearchService: dual-mode architecture (Algolia keyword + Firestore filtered browse), Algolia sync Cloud Function spec
> - **§4.4** — ChatService: deterministic chatId format, real-time subscription, image messaging, soft-delete with both-sides purge, complete UI bubble spec
> - **§4.5** — MediaService: compression pipeline (70% JPEG, <500KB target), Cloudinary folder structure, thumbnail generation
> - **§4.6** — FavoriteService: optimistic UI toggle, real-time subscription, auth redirect for guests
> - **§4.7** — ReviewService: one-review-per-buyer-per-seller enforcement, averageRating recalculation, canReview guard (no self-review, must have chatted)
> - **§4.8** — PremiumService: external payment flow (MVP), admin activation, scheduled expiry Cloud Function
> - **§4.9** — ModerationService: mobile report submission + web admin panel with approve/reject/ban
> - **§4.10–4.11** — Complete screen layouts: home feed (spotlight + categories + featured + recent), ad detail (gallery + price + seller + similar + action bar)
> - **§5** — 20 mobile packages + 5 web packages + 3 Cloud Function packages + 30 approved Ionicons
> - **§6** — 80+ files across mobile/, web/, functions/ directories with clear ownership annotations
> - **§8** — Firestore schema: 8 collections, all document shapes with field types, 6 required composite indexes
> - **§9** — 25+ TypeScript interfaces/types including all status enums, pagination contract, 5 Zustand store contracts
> - **§10** — 24 color tokens (warm orange marketplace theme) + category-specific colors + typography scale
> - **§12** — 10 named error fallback contracts: auth failure, image upload failure, chat send failure, Algolia fallback, offline mode, banned user handling
> - **§13** — Complete app.json with Firebase config and 6 Android permissions
> - **§14** — 8 performance targets including image upload speed and pagination response
> - **§15** — 22 anti-patterns: no in-app payments, no exposed phone numbers, no uncompressed uploads, no inline Firestore, no full-text Firestore search, FCM rate limiting
> - **§16** — 7 test files with 45+ named test cases
> - **§17** — Complete Firestore security rules: user isolation, owner-only writes, participant-only chat, admin-only moderation, soft-delete enforcement
> - **§18** — 11 future features with migration notes (payments, AI pricing, video, geosearch, scam detection)