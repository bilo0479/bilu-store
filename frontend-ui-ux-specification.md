# Frontend UI/UX Design Specification

## Bilu Store — Local Classified Marketplace

**Version:** 1.0 MVP
**Last Updated:** April 2026
**Platforms:** Android (React Native / Expo) + Web Admin Dashboard (Next.js)

---

# 1. Product Overview

## 1.1 Product Goal

Bilu Store is a local classified marketplace that connects buyers and sellers in their community. It enables users to post, discover, and negotiate items for sale through direct messaging. The platform does **not** process payments or handle shipping — it facilitates local, person-to-person trade.

**Core Philosophy:** Local, Simple, Trustworthy, Fast.

## 1.2 Target Users

| Role | Description |
|------|-------------|
| **Buyer (Guest)** | Can browse ads, view details, search, and filter. Must authenticate to chat, favorite, or review. |
| **Seller (Authenticated)** | Posts ads, manages listings, chats with buyers, receives reviews. |
| **Admin** | Moderates ads (approve/reject), resolves reports, manages users. Uses the web dashboard exclusively. |

## 1.3 Core Functionality

- **Ad Posting** — Multi-step form with images, category, pricing, location
- **Search & Browse** — Keyword search (Algolia) + filtered browsing (Firestore)
- **Real-time Chat** — 1:1 messaging between buyer and seller per ad
- **Reputation System** — Star ratings and written reviews for sellers
- **Premium/Boost** — Paid tier placements (Featured, Top Search, Homepage Spotlight, Highlight)
- **Moderation** — Report flow (mobile) + admin review dashboard (web)
- **Favorites** — Save ads for later with optimistic UI updates

---

# 2. Frontend Architecture

## 2.1 Mobile App

| Aspect | Technology |
|--------|-----------|
| **Framework** | React Native 0.81.5 via Expo SDK 54 (managed workflow) |
| **Language** | TypeScript 5.x (strict mode) |
| **Navigation** | Expo Router v6 (file-based routing) — Stack + Bottom Tabs |
| **State Management** | Zustand 5.0 (5 domain stores) + TanStack React Query 5 |
| **Styling** | React Native StyleSheet with centralized design tokens (`src/constants/colors.ts`) |
| **Typography** | Inter font family (400 Regular, 500 Medium, 600 SemiBold, 700 Bold) via `@expo-google-fonts/inter` |
| **Icons** | Ionicons via `@expo/vector-icons` |
| **Haptics** | `expo-haptics` for tactile feedback on key interactions |

## 2.2 Web Dashboard

| Aspect | Technology |
|--------|-----------|
| **Framework** | Next.js 14 (App Router, `app/` directory) |
| **Language** | TypeScript 5.x (strict mode) |
| **Styling** | Tailwind CSS 3.4 with custom semantic color tokens |
| **Icons** | Lucide React 0.460 |
| **Charts** | Recharts 2.13 (admin dashboard stats) |

## 2.3 Shared Backend

| Aspect | Technology |
|--------|-----------|
| **Auth** | Firebase Authentication (Email + Phone + Google) |
| **Database** | Firebase Firestore |
| **Storage** | Cloudinary (image hosting with transformations) |
| **Search** | Algolia (full-text ad search indexing) |
| **Functions** | Firebase Cloud Functions (Node.js 20) |
| **Notifications** | Firebase Cloud Messaging + expo-notifications |

## 2.4 Folder Structure

```
bilu-store/
├── app/                          # Mobile — Expo Router pages
│   ├── (tabs)/                   # 5-tab bottom navigation
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── home.tsx
│   │   ├── search.tsx
│   │   ├── post.tsx
│   │   ├── chat.tsx
│   │   └── profile.tsx
│   ├── _layout.tsx               # Root stack layout + AuthGate
│   ├── ad/[adId].tsx
│   ├── auth/{login,register,phone-verify}.tsx
│   ├── chat/[chatId].tsx
│   ├── category/[categoryId].tsx
│   ├── post/{create,edit/[adId]}.tsx
│   ├── premium/[adId].tsx
│   ├── profile/edit.tsx
│   ├── seller/[sellerId].tsx
│   ├── review/create/[sellerId].tsx
│   ├── reviews/[sellerId].tsx
│   ├── {my-ads,favorites,settings,search-results}.tsx
│   └── {about-app,about-developer}.tsx
│
├── src/                          # Shared mobile source
│   ├── components/               # 25 reusable UI components
│   ├── constants/                # Design tokens, categories, configs
│   ├── hooks/                    # 7 custom hooks
│   ├── services/                 # 11 service modules (Firestore/API)
│   ├── stores/                   # 5 Zustand stores
│   ├── types/                    # TypeScript interfaces
│   └── utils/                    # Date, price, validation helpers
│
├── web/                          # Web admin dashboard
│   ├── app/                      # Next.js pages
│   │   ├── admin/{page,ads,reports,users}/
│   │   ├── ad/[adId]/
│   │   ├── auth/login/
│   │   ├── category/[categoryId]/
│   │   └── seller/[sellerId]/
│   └── src/
│       ├── components/           # 4 web-specific components
│       ├── services/             # 4 service modules
│       └── lib/firebase.ts
│
└── functions/                    # Firebase Cloud Functions
    └── src/triggers/             # Firestore event triggers
```

## 2.5 State Management Architecture

Five Zustand stores manage distinct domain concerns:

| Store | File | Key State |
|-------|------|-----------|
| **authStore** | `src/stores/authStore.ts` | `user`, `isAuthenticated`, `isLoading` |
| **adsStore** | `src/stores/adsStore.ts` | `homeFeed`, `categoryAds`, `searchResults`, cursor-based pagination |
| **chatStore** | `src/stores/chatStore.ts` | `chats` (ChatPreview[]), `totalUnread` (drives tab badge) |
| **favoritesStore** | `src/stores/favoritesStore.ts` | `favoriteAdIds` (Set\<string\>) — optimistic toggle |
| **uiStore** | `src/stores/uiStore.ts` | `toastMessage`, `isGlobalLoading` |

Server state (ad detail, reviews, seller profiles) is managed via **TanStack React Query** for caching and background re-fetching.

---

# 3. Navigation System

## 3.1 Mobile Navigation Hierarchy

The app uses a **two-layer** navigation model:

### Layer 1 — Root Stack (app/_layout.tsx)

A `Stack` navigator at the root wraps all screens. Modal presentations are used for auth flows.

```
Stack (Root)
├── (tabs)              — headerShown: false
├── auth/login          — modal presentation
├── auth/register       — modal presentation
├── auth/phone-verify   — modal presentation
├── ad/[adId]           — headerShown: false (custom header)
├── chat/[chatId]       — headerShown: false
├── post/create         — headerShown: false
├── post/edit/[adId]    — headerShown: false
├── seller/[sellerId]   — title: "Seller Profile"
├── category/[categoryId] — headerShown: false
├── premium/[adId]      — headerShown: false
├── profile/edit        — headerShown: false
├── my-ads              — title: "My Ads"
├── favorites           — title: "Favorites"
├── settings            — title: "Settings"
├── reviews/[sellerId]  — title: "Reviews"
├── review/create/[sellerId] — headerShown: false
├── search-results      — headerShown: false
├── about-app           — headerShown: false
└── about-developer     — headerShown: false
```

### Layer 2 — Bottom Tab Bar (app/(tabs)/_layout.tsx)

Five tabs with a central FAB-style "Post" button:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  🏠 Home │ 🔍 Search│  ➕ Post │ 💬 Chats │ 👤 Profile│
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

| Tab | Icon (Ionicons) | Badge | Special Behavior |
|-----|----------------|-------|------------------|
| Home | `home` / `home-outline` | — | Default landing tab |
| Search | `search` / `search-outline` | — | |
| Post | `add` (inside accent circle) | — | FAB button (48px circle, elevated). Redirects to `/post/create` or `/auth/login` |
| Chats | `chatbubbles` / `chatbubbles-outline` | Unread count (accent badge) | Real-time unread from chatStore |
| Profile | `person` / `person-outline` | — | Shows guest CTA if unauthenticated |

**Tab bar styling:**
- Background: `BG_CARD` (#FFFFFF)
- Active tint: `ACCENT` (#FF6B35)
- Inactive tint: `TEXT_MUTED` (#8A8A9A)
- Height: 88px (iOS) / 64px (Android)
- Elevation shadow with subtle border top

### Layer 3 — Drawer Menu (DrawerContent component)

Accessed from the hamburger icon on the Home screen. Slides in from the left with spring animation.

```
┌─────────────────────────────────┐
│  🛒 Bilu Store                  │
│  Buy & sell locally             │
├─────────────────────────────────┤
│  [Avatar] User Name             │  (or "Log In / Register" for guests)
│  ⭐ 4.5 · 12 reviews           │
│  📍 Location                    │
├─────────────────────────────────┤
│  📦 My Ads (count)              │
│  ❤️ Favorites                   │
│  ⭐ Premium Services            │
├─────────────────────────────────┤
│  ⚙️ Settings                    │
│  ℹ️ About App                   │
│  👤 About Developer             │
├─────────────────────────────────┤
│  🚪 Log Out                     │
│  App Version v1.0.0             │
└─────────────────────────────────┘
```

Width: 82% of screen. Semi-transparent backdrop overlay (rgba(0,0,0,0.4)).

## 3.2 Web Navigation

Fixed sidebar (`AdminSidebar.tsx`, 256px wide) with four navigation items:

| Item | Icon (Lucide) | Route |
|------|--------------|-------|
| Dashboard | `LayoutDashboard` | `/admin` |
| Pending Ads | `FileText` | `/admin/ads` |
| Reports | `Flag` | `/admin/reports` |
| Users | `Users` | `/admin/users` |

Active state: `bg-accent-light text-accent-dark`. Hover: `bg-bg-screen text-text-dark`. Logo + "Bilu Store" branding at top. Logout button at bottom.

## 3.3 Auth Guards

| Route Pattern | Auth Required? | Guest Behavior |
|---------------|---------------|----------------|
| Home, Search, Ad Detail, Category, Seller Profile | No | Full browsing access |
| Post, Chat, Favorites, My Ads, Profile, Review, Premium | Yes | Redirect to `/auth/login` with stored redirect intent |
| Admin Dashboard (web) | Yes + `ADMIN` role | Redirect to `/auth/login` |

Post-login redirect: After authentication, the app reads a saved redirect intent from AsyncStorage and navigates the user to their originally intended destination.

---

# 4. Page & Screen Inventory

## 4.1 Mobile App Screens (20 screens)

### Home Feed — `/(tabs)/home`

**Purpose:** Primary landing screen. Showcases categories and recent ad listings.

**Layout:**
- Custom header: hamburger menu (left), greeting + "Bilu Store" title (center), heart/favorites icon (right)
- Tappable search bar (navigates to Search tab)
- "Categories" section with horizontal `CategoryRow`
- "Recent Listings" section with 2-column `FlatList` grid of `AdCard` components
- Pull-to-refresh (`RefreshControl`)

**Main Components:** `DrawerContent`, `CategoryRow`, `AdCard`, `EmptyState`

**User Actions:** Open drawer, navigate to favorites, tap search bar, select category, tap ad card, pull to refresh, toggle favorite (with haptic feedback)

**Data Displayed:** User greeting (personalized if authenticated), category list, paginated ad feed (ACTIVE ads, sorted by `createdAt` DESC)

**Navigation Paths:**
- From: App launch, tab bar
- To: `/ad/[adId]`, `/category/[categoryId]`, `/(tabs)/search`, `/favorites`, drawer destinations

---

### Search — `/(tabs)/search`

**Purpose:** Full-text search with category and sort filters.

**Layout:**
- Fixed header with title "Search"
- Search input row: text field + submit button (accent arrow)
- Horizontal scrolling category filter chips ("All" + 10 categories)
- Horizontal scrolling sort chips (Newest, Price: Low, Price: High)
- 2-column results grid of `AdCard` components

**Main Components:** `AdCard`, `EmptyState`

**User Actions:** Type query, submit search, select category filter, change sort order, tap ad card, toggle favorite

**Data Displayed:** Search results matching query + filters. Two empty states: pre-search ("Find what you need") and no-results ("No results found")

**Navigation Paths:**
- From: Tab bar, Home search bar tap
- To: `/ad/[adId]`

---

### Post Tab — `/(tabs)/post`

**Purpose:** Redirect gateway to ad creation.

**Layout:** Centered loading/redirect screen with icon, title "Post an Ad", subtitle "Redirecting..."

**Behavior:** On focus, immediately redirects authenticated users to `/post/create` or unauthenticated users to `/auth/login`.

---

### Chat List — `/(tabs)/chat`

**Purpose:** View all active conversations.

**Layout:**
- Header with title "Messages"
- Vertical list of `ChatListItem` components
- Separator lines (indented 80px from left)

**Main Components:** `ChatListItem`, `EmptyState`

**User Actions:** Tap conversation to open chat

**Data Displayed:** Each chat shows: other user avatar + name (bold if unread), last message preview, relative timestamp (accent color if unread), unread count badge, ad title (italic, muted). Guest state shows "Sign in to chat" empty state with CTA.

**Navigation Paths:**
- From: Tab bar
- To: `/chat/[chatId]`, `/auth/login` (if guest)

---

### Profile — `/(tabs)/profile`

**Purpose:** View own profile, access account management features.

**Layout (Authenticated):**
- Profile card: avatar (80px, or initial fallback), name, location, rating stars, stats row (Ads | Reviews | Joined year)
- Menu section 1: Edit Profile, My Ads, Favorites, My Reviews
- Menu section 2: Settings, About App, About Developer, Sign Out (red)

**Layout (Guest):**
- Centered: large person icon, "Join Bilu Store" title, subtitle, "Sign In" primary button, "Create Account" secondary button

**Main Components:** `RatingStars`, `MenuItem` (internal), `Image` (expo-image)

**User Actions:** Navigate to sub-screens, sign out (with haptic warning feedback)

**Navigation Paths:**
- From: Tab bar
- To: `/profile/edit`, `/my-ads`, `/favorites`, `/reviews/[sellerId]`, `/settings`, `/about-app`, `/about-developer`, `/auth/login`, `/auth/register`

---

### Ad Detail — `/ad/[adId]`

**Purpose:** Full ad information with seller contact.

**Layout:**
- Full-width image carousel (horizontal `FlatList`, paginated, 75% screen width height)
- Floating top bar: back button + favorite/share buttons (semi-transparent circles)
- Dot indicators for multiple images (active dot wider)
- Info section: price (ACCENT, large), "Negotiable" tag, title, category badge + condition badge, location, stats (views, saves, date)
- Description section with full text
- Seller card: avatar, name, "View profile" link, chevron
- Sticky bottom bar: "Chat with Seller" button (hidden if own ad)

**Main Components:** `RatingStars`, `Image` (carousel), `FlatList` (horizontal), `AdCard` (similar ads)

**User Actions:** Swipe images, favorite (with haptic), share (system share sheet), chat with seller, view seller profile, go back

**Data Displayed:** All ad fields (images, price, currency, title, category, condition, location, view/favorite counts, creation date, description, seller info)

**Navigation Paths:**
- From: Home feed, Search results, Category listings, My Ads, Favorites
- To: `/chat/[chatId]`, `/seller/[sellerId]`, back

---

### Chat Conversation — `/chat/[chatId]`

**Purpose:** Real-time messaging between buyer and seller.

**Layout:**
- Header: back button, "Chat" title
- Inverted `FlatList` of message bubbles
- Input bar: rounded text input + send button (accent circle)

**Main Components:** `MessageBubble` (internal — supports sent/received styling, failed state with retry)

**User Actions:** Type message, send (with haptic), retry failed messages, scroll through history

**Data Displayed:** Messages with text, timestamps. Failed messages show red error icon with "Tap to retry".

**Interaction Model:**
- Sent: right-aligned, `CHAT_SENT_BG` (#FF6B35), white text, bottom-right rounded corner reduced
- Received: left-aligned, `CHAT_RECEIVED_BG` (#F0F0F5), dark text, bottom-left rounded corner reduced
- `KeyboardAvoidingView` for iOS keyboard handling

---

### Create Ad — `/post/create`

**Purpose:** Multi-field form to post a new ad listing.

**Layout:**
- Header: close (X) button, "Post Ad" title
- Scrollable form sections:
  - **Photos** — horizontal scroll of image thumbnails (80x80) + dashed add button with camera icon, counter (e.g., "3/5")
  - **Details** — Title input, Description textarea (100px height), Price input (numeric), "Negotiable" checkbox
  - **Category** — horizontal scrolling chips with category icons and colors
  - **Location** — text input
  - **Contact Preference** — toggle buttons: "Chat Only" / "Chat & Phone"
  - **Submit** — "Post Ad" accent button

**Form Validation:** Title required, description required, valid numeric price, category required, location required. Errors shown via toast.

**User Actions:** Pick images (up to 5), remove images, fill form fields, toggle negotiable, select category, choose contact preference, submit

---

### Edit Ad — `/post/edit/[adId]`

**Purpose:** Edit an existing ad. Same form as Create Ad, pre-populated with current values.

---

### Login — `/auth/login`

**Purpose:** Email/password authentication.

**Layout (modal presentation):**
- Close button (top right)
- "Bilu Store" logo (36px, accent color, bold)
- "Sign in to your account" subtitle
- Error box (red background, alert icon) when login fails
- Email input (with mail icon)
- Password input (with lock icon + visibility toggle)
- "Sign In" accent button
- "Don't have an account? Sign Up" footer link

**User Actions:** Enter credentials, toggle password visibility, submit, navigate to register

---

### Register — `/auth/register`

**Purpose:** Create new account. Modal presentation similar to login.

---

### Phone Verify — `/auth/phone-verify`

**Purpose:** SMS code verification for phone auth. Modal presentation.

---

### Category Listings — `/category/[categoryId]`

**Purpose:** Browse all active ads in a specific category.

**Layout:** Category header with icon/name, 2-column grid of `AdCard` components, paginated with cursor.

---

### Seller Profile — `/seller/[sellerId]`

**Purpose:** Public seller profile with their active listings and reviews.

**Layout:** Avatar, name, location, rating stars, review count, ad listings grid, link to reviews.

---

### Reviews List — `/reviews/[sellerId]`

**Purpose:** Paginated list of reviews for a seller.

**Main Components:** `ReviewCard` (reviewer avatar, name, rating stars, comment, date)

---

### Write Review — `/review/create/[sellerId]`

**Purpose:** Submit a star rating (1-5) and written review for a seller.

**Validation:** Rating required, comment min 10 chars / max 500 chars.

---

### My Ads — `/my-ads`

**Purpose:** View all of the current user's ad listings across all statuses.

**Main Components:** `AdCard` with `StatusBadge` overlays

---

### Favorites — `/favorites`

**Purpose:** List of saved/favorited ads.

---

### Settings — `/settings`

**Purpose:** Edit profile fields (name, phone, location) and view app info.

**Layout:** Form inputs for Name, Phone (optional), Location (optional). "Save Changes" button. Info section with app version.

---

### Premium/Boost — `/premium/[adId]`

**Purpose:** Select and purchase a premium tier for an ad.

**Tiers:** Featured (7 days), Top Search (7 days), Homepage Spotlight (3 days), Highlighted (7 days). Payment is handled externally (Telebirr/bank transfer), admin activates.

---

### Search Results — `/search-results`

**Purpose:** Dedicated results page for search queries from the home screen.

---

### About App / About Developer — `/about-app`, `/about-developer`

**Purpose:** Static informational screens with app details and developer credits.

---

## 4.2 Web Dashboard Screens (7 screens)

### Admin Dashboard — `/admin`

**Purpose:** Overview statistics and action items.

**Layout:**
- Title: "Dashboard" + subtitle "Overview of your marketplace"
- 4-column stats grid: Total Ads, Pending Review, Active Reports, Total Users (each as `StatsCard`)
- "Action Required" section: clickable banners for pending ads and active reports (conditionally shown)

**Components:** `StatsCard` (title, value, icon, color, description)

---

### Pending Ads — `/admin/ads`

**Purpose:** Review and approve/reject submitted ads.

**Layout:**
- Header with title + refresh button
- Error banner (dismissible)
- Data table with columns: Ad (thumbnail + title + location), Category (pill badge), Price, Seller, Submitted (relative time), Actions
- Actions: Approve (green) / Reject (red, expands to show reason input)
- "Load More" pagination button

---

### Reports — `/admin/reports`

**Purpose:** Review and resolve/dismiss user-submitted reports.

**Layout:**
- Header with title + refresh button
- Data table: Target (AD/USER icon + ID), Reason (red pill), Details, Reporter ID, Reported time, Actions (Resolve/Dismiss)
- "All caught up" empty state with checkmark

---

### Users — `/admin/users`

**Purpose:** View and manage registered users.

**Layout:**
- Header with title + refresh button
- Data table: User (avatar + name + email), Role, Rating, Ads count, Joined date, Status (active/banned), Actions
- `UserRow` component handles per-user actions

---

### Web Ad Detail — `/ad/[adId]`, Web Category — `/category/[categoryId]`, Web Seller — `/seller/[sellerId]`

**Purpose:** Public-facing web pages mirroring mobile ad detail, category browsing, and seller profiles. Serve as deep link landing pages.

---

### Web Login — `/auth/login`

**Purpose:** Admin authentication for the web dashboard.

---

# 5. Detailed Page Design Breakdown

## 5.1 Home Feed — Visual Hierarchy

```
┌──────────────────────────────────────────┐
│ [☰]    Hi, John                    [♡]   │ ← Header (safe area inset)
│         Bilu Store                        │    Menu btn: 44x44, rounded, white bg
│                                           │    App name: 28px, bold
├──────────────────────────────────────────┤
│ 🔍 Search for anything...                │ ← Tappable search bar
│                                           │    12px radius, border, 14px padding
├──────────────────────────────────────────┤
│ Categories                                │ ← Section title: 17px, bold
│ [📱][🚗][🏠][👕][🛋️][💼][🔧][📚]...     │ ← Horizontal scroll, CategoryRow
├──────────────────────────────────────────┤
│ Recent Listings                           │ ← Section title
│ ┌─────────┐ ┌─────────┐                  │
│ │  image   │ │  image   │                 │ ← 2-column grid, 12px gap
│ │ ♡   ⭐  │ │ ♡       │                 │
│ │ 15,000   │ │ 8,500   │                 │ ← Price: ACCENT, bold
│ │ iPhone.. │ │ Chair.. │                 │ ← Title: 13px, 2 lines max
│ │ 📍 Addis │ │ 📍 Bahir│                 │ ← Location: muted
│ └─────────┘ └─────────┘                  │
│ ┌─────────┐ ┌─────────┐                  │
│ │  ...     │ │  ...     │                 │
│ └─────────┘ └─────────┘                  │
└──────────────────────────────────────────┘
```

- Header buttons are 44x44px circular with white background and subtle shadow
- Search bar has 1px border, 12px corner radius
- Content area has 100px bottom padding to clear tab bar
- Each AdCard is `(screenWidth - 48) / 2` wide
- Image aspect ratio ~0.85:1 (85% of card width)

## 5.2 Ad Detail — Visual Hierarchy

```
┌──────────────────────────────────────────┐
│ [←]                          [♡] [share] │ ← Floating buttons over image
│                                           │    40x40, white 90% opacity, rounded
│         [Full-width image]                │ ← screenWidth x (screenWidth * 0.75)
│                                           │
│              • • ○ ○ ○                    │ ← Dot indicators (active dot = 20px wide)
├──────────────────────────────────────────┤
│ 15,000 ETB                               │ ← Price: 24px, bold 800, ACCENT
│ Negotiable                               │ ← Green text, 11px
│ iPhone 14 Pro Max — 256GB                │ ← Title: 22px, bold 700
│                                           │
│ [📱 Electronics] [Used Good]             │ ← Category badge (colored bg) + condition
│ 📍 Addis Ababa                           │ ← Location with pin icon
│ 👁 245 views  ♡ 12 saves  🕐 Mar 15     │ ← Stats row, muted text
├──────────────────────────────────────────┤
│ Description                              │ ← Section title: 17px, bold
│ Full description text with 24px line     │
│ height for comfortable reading...        │
├──────────────────────────────────────────┤
│ [avatar] John Doe                        │ ← Seller card, tappable
│          View profile  >                 │    48x48 avatar, chevron
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │  💬 Chat with Seller               │   │ ← Sticky bottom bar
│ └────────────────────────────────────┘   │    ACCENT bg, 14px radius, 16px padding
└──────────────────────────────────────────┘
```

## 5.3 Chat Conversation — Visual Hierarchy

```
┌──────────────────────────────────────────┐
│ [←]          Chat                        │ ← Header with border bottom
├──────────────────────────────────────────┤
│                                           │
│                    ┌──────────────────┐   │
│                    │ Hey, is this     │   │ ← Sent: right-aligned
│                    │ still available? │   │    ACCENT bg, white text
│                    │          2:30 PM │   │    18px border radius
│                    └──────────────────┘   │
│ ┌──────────────────┐                     │
│ │ Yes it is! Come  │                     │ ← Received: left-aligned
│ │ see it today     │                     │    #F0F0F5 bg, dark text
│ │ 2:32 PM          │                     │
│ └──────────────────┘                     │
│                                           │
├──────────────────────────────────────────┤
│ ┌────────────────────────────┐  [send]   │ ← Input bar
│ │ Type a message...          │   (●)     │    22px rounded input
│ └────────────────────────────┘           │    44x44 send button
└──────────────────────────────────────────┘
```

## 5.4 Admin Dashboard — Visual Hierarchy (Web)

```
┌────────────┬─────────────────────────────────────────┐
│ 🛒 Bilu    │  Dashboard                              │
│   Store    │  Overview of your marketplace            │
│            │                                          │
│ ADMIN PANEL│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│            │  │ 156  │ │  8   │ │  3   │ │ 342  │   │
│ ▶ Dashboard│  │Total │ │Pend. │ │Active│ │Total │   │
│   Pend. Ads│  │ Ads  │ │Review│ │Report│ │Users │   │
│   Reports  │  └──────┘ └──────┘ └──────┘ └──────┘   │
│   Users    │                                          │
│            │  Action Required                         │
│            │  ┌─────────────────────────────────┐    │
│            │  │ 📄 8 ads pending review          │    │
│            │  │ Review and approve submitted ads  │    │
│            │  └─────────────────────────────────┘    │
│ ────────── │  ┌─────────────────────────────────┐    │
│ 🚪 Log Out │  │ 🚩 3 active reports              │    │
│            │  │ Review and resolve reported content│   │
└────────────┴─────────────────────────────────────────┘
```

Sidebar: fixed 256px, full height. Content area: offset by `ml-64` (256px).

---

# 6. UI Component Library

## 6.1 Mobile Components (`src/components/`)

### AdCard

**Purpose:** Displays an ad listing in a compact card format.
**File:** `src/components/AdCard.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `ad` | `Ad` | Ad data object |
| `onPress` | `() => void` | Card tap handler |
| `onFavorite` | `() => void` (optional) | Favorite toggle handler |
| `isFavorited` | `boolean` (optional) | Current favorite state |

**Visual Behavior:**
- Width: `(screenWidth - 48) / 2` (for 2-column grid)
- Image container: 85% of card width height
- Premium badge: gold background, top-left, star icon + "Premium" text
- Favorite button: 32x32 circle, semi-transparent dark overlay, top-right
- Press feedback: opacity 0.92, scale 0.98
- Card: 12px radius, white background, subtle shadow (elevation 2)

**Used In:** Home Feed, Search, Category Listings, My Ads, Favorites

---

### AdImageCarousel

**Purpose:** Full-screen swipeable image gallery for ad detail.
**File:** `src/components/AdImageCarousel.tsx`

---

### CategoryChip

**Purpose:** Pill-shaped category selector with icon and color.
**File:** `src/components/CategoryChip.tsx`

**Visual Behavior:** Rounded pill with 1px border. Active state: accent background, white text. Inactive: white background, dark text.

**Used In:** Search filters, Create Ad form

---

### CategoryGrid (CategoryRow)

**Purpose:** Horizontal scrolling row of category items.
**File:** `src/components/CategoryGrid.tsx`

**Used In:** Home Feed

---

### ChatBubble

**Purpose:** Individual message bubble in chat conversation.
**File:** `src/components/ChatBubble.tsx`

**Visual Behavior:**
- Max width: 78% of container
- Sent: right-aligned, `#FF6B35` background, white text, bottom-right radius 4px
- Received: left-aligned, `#F0F0F5` background, dark text, bottom-left radius 4px
- Timestamp: 10px, aligned bottom-right of bubble

---

### ChatListItem

**Purpose:** Chat conversation preview in the chat list.
**File:** `src/components/ChatListItem.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `chat` | `ChatPreview` | Chat preview data |
| `onPress` | `() => void` | Tap handler |

**Visual Behavior:**
- 52x52 avatar (left), content area (center-right)
- Top row: user name (bold if unread) + relative timestamp (accent if unread)
- Middle row: last message preview (bold if unread) + unread count badge (accent circle)
- Bottom row: ad title (italic, muted, 11px)
- Press: background changes to `DIVIDER` color

**Used In:** Chat List tab

---

### ConditionBadge

**Purpose:** Displays item condition (NEW, LIKE_NEW, USED_GOOD, USED_FAIR).
**File:** `src/components/ConditionBadge.tsx`

---

### DrawerContent

**Purpose:** Slide-out navigation drawer overlay.
**File:** `src/components/DrawerContent.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Controls drawer visibility |
| `onClose` | `() => void` | Close handler |

**Visual Behavior:**
- Width: 82% of screen
- Animated slide from left edge (spring: damping 20, stiffness 200)
- Semi-transparent backdrop (40% black)
- White background with shadow

**Used In:** Home screen

---

### EmptyState

**Purpose:** Placeholder for empty lists and screens.
**File:** `src/components/EmptyState.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `string` | Ionicons icon name |
| `title` | `string` | Main heading |
| `subtitle` | `string` (optional) | Supporting text |
| `actionLabel` | `string` (optional) | Button text |
| `onAction` | `() => void` (optional) | Button handler |

**Visual Behavior:**
- Centered layout, 32px horizontal padding, 48px vertical
- 80x80 icon circle (DIVIDER background)
- Optional accent CTA button (10px radius)

**Used In:** Home (no listings), Search (no results / pre-search), Chat (no conversations / guest), Favorites (empty)

---

### FavoriteButton

**Purpose:** Heart toggle for favoriting ads.
**File:** `src/components/FavoriteButton.tsx`

**Visual Behavior:** Unfilled `heart-outline` → filled `heart` in `ERROR_RED`. Haptic feedback on toggle.

---

### FilterSheet

**Purpose:** Bottom sheet with advanced search filters.
**File:** `src/components/FilterSheet.tsx`

---

### ImagePicker

**Purpose:** Multi-image selection from device gallery.
**File:** `src/components/ImagePicker.tsx`

---

### InlineConfirm

**Purpose:** Inline confirmation dialog (e.g., delete, logout).
**File:** `src/components/InlineConfirm.tsx`

---

### LocationPicker

**Purpose:** Location selection with city name.
**File:** `src/components/LocationPicker.tsx`

---

### NotificationBadge

**Purpose:** Circular badge with count number.
**File:** `src/components/NotificationBadge.tsx`

---

### PremiumBadge

**Purpose:** Gold "Premium" indicator overlay on ad cards.
**File:** `src/components/PremiumBadge.tsx`

**Visual Behavior:** Gold background (`#FFB800`), star icon + "Premium" text, 6px radius, positioned top-left of image.

---

### PriceDisplay

**Purpose:** Formatted price with currency symbol.
**File:** `src/components/PriceDisplay.tsx`

---

### RatingStars

**Purpose:** Visual star rating display (1-5).
**File:** `src/components/RatingStars.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `rating` | `number` | Average rating (0-5) |
| `size` | `number` | Star icon size |

**Visual Behavior:** Filled stars in `STAR_GOLD` (#FFC107), empty stars in `STAR_GRAY` (#E0E0E0).

**Used In:** Profile, Seller Profile, Ad Detail, Drawer, Review Cards

---

### ReviewCard

**Purpose:** Displays a single review with reviewer info, rating, and comment.
**File:** `src/components/ReviewCard.tsx`

---

### SearchBar

**Purpose:** Styled search input with icon.
**File:** `src/components/SearchBar.tsx`

---

### SellerCard

**Purpose:** Compact seller info display (avatar, name, rating).
**File:** `src/components/SellerCard.tsx`

---

### SortSelector

**Purpose:** Sort option selector (Newest, Price: Low, Price: High, Relevance).
**File:** `src/components/SortSelector.tsx`

---

### StatusBadge

**Purpose:** Ad status indicator (DRAFT, ACTIVE, SOLD, REJECTED, etc.).
**File:** `src/components/StatusBadge.tsx`

---

### Toast

**Purpose:** Global toast notification overlay.
**File:** `src/components/Toast.tsx`

**Visual Behavior:**
- Position: absolute, 24px from edges, 80px above bottom inset
- Dark background (`TEXT_DARK`), white text, 12px radius
- Animated: fade in (200ms) → hold (2500ms) → fade out (200ms)
- Z-index: 999

**Used In:** Root layout — globally available via `uiStore.showToast()`

---

### ErrorBoundary / ErrorFallback

**Purpose:** Catches React component errors and displays a fallback UI.
**Files:** `src/components/ErrorBoundary.tsx`, `components/ErrorFallback.tsx`

---

## 6.2 Web Components (`web/src/components/`)

### AdminSidebar

**Purpose:** Fixed sidebar navigation for the admin dashboard.
**File:** `web/src/components/AdminSidebar.tsx`

**Visual Behavior:** 256px wide, full height, white background, border-right. Active link: accent-light bg + accent-dark text. Logo at top, logout at bottom.

---

### StatsCard

**Purpose:** Dashboard metric card with icon, value, and description.
**File:** `web/src/components/StatsCard.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Metric name |
| `value` | `number` | Metric value |
| `icon` | `LucideIcon` | Icon component |
| `color` | `string` | Theme color key |
| `description` | `string` | Supporting text |

---

### AdCard (Web)

**Purpose:** Web version of the ad card component.
**File:** `web/src/components/AdCard.tsx`

---

### UserRow

**Purpose:** Table row component for user management.
**File:** `web/src/components/UserRow.tsx`

---

# 7. User Experience (UX) Flows

## 7.1 Onboarding / First Launch

```
App Launch → Splash Screen (fonts loading)
  → Home Feed (guest mode)
    → Browse freely: categories, ads, search, seller profiles
    → Any auth-required action → Login modal
      → Enter email/password (or register)
        → Success → redirect to intended action
        → Failure → inline error message
```

No mandatory onboarding — users can browse immediately. Auth is deferred to the first protected action (post ad, chat, favorite).

## 7.2 Ad Posting Flow

```
Post Tab tap (or drawer "My Ads" → "New")
  → Auth check (redirect to login if needed)
  → Create Ad form
    1. Add photos (camera icon, up to 5)
    2. Enter title, description, price
    3. Toggle "Negotiable"
    4. Select category (horizontal chips)
    5. Enter location
    6. Choose contact preference
    → "Post Ad" button
      → Validate all fields (toast errors)
      → Upload images to Cloudinary
      → Create Firestore document
      → Auto-approve if seller qualifies, else PENDING_REVIEW
      → Toast "Ad posted successfully!"
      → Navigate back
```

## 7.3 Buying / Contact Flow

```
Browse/Search → Tap AdCard → Ad Detail
  → Review images (swipe carousel)
  → Read description, check price/condition
  → "Chat with Seller" button
    → Auth check (redirect to login if needed)
    → Create or retrieve chat document
    → Navigate to Chat Conversation
      → Send messages in real-time
      → Arrange meetup for local trade
```

## 7.4 Search & Discovery Flow

```
Search Tab (or Home search bar tap)
  → Type keyword → Submit (or select category chip)
  → Optional: change sort (Newest / Price: Low / Price: High)
  → Results displayed in 2-column grid
    → Tap ad → Ad Detail
    → Toggle favorite → Haptic feedback + optimistic UI update
  → No results → "Try different keywords or filters"
```

## 7.5 Review Submission Flow

```
Seller Profile → "Write Review" (if eligible)
  → Review form
    → Select star rating (1-5, tap stars)
    → Write comment (min 10 chars, max 500)
    → Submit
      → Validation check
      → Create review document
      → Recalculate seller's average rating
      → Navigate back
```

## 7.6 Admin Moderation Flow (Web)

```
Dashboard → See "8 ads pending review" banner
  → Click → Pending Ads page
    → Review table: thumbnail, title, category, price, seller, time
    → Per ad: "Approve" (green) or "Reject" (red)
      → Reject: expands inline with reason input → confirm
    → Ad removed from list after action
    → "All caught up!" when queue empty
```

## 7.7 Favorites Management Flow

```
Any AdCard (home, search, category) → Tap heart icon
  → Auth check (redirect if guest with redirect intent saved)
  → Haptic feedback (light impact)
  → Optimistic UI: heart fills red immediately
  → Background: Firestore write
  → View all: Profile → Favorites (or Home header heart icon)
```

---

# 8. Interaction Patterns

## 8.1 Tap / Press Interactions

- **Pressable with visual feedback:** All interactive elements use `Pressable` with `pressed` state
  - Cards: opacity 0.92 + scale 0.98
  - Buttons: opacity 0.85
  - Menu items: background color change to `DIVIDER`
- **Hit slop:** All small tap targets use `hitSlop={8}` for accessibility

## 8.2 Haptic Feedback

| Action | Haptic Type | Component |
|--------|------------|-----------|
| Favorite toggle | `ImpactFeedbackStyle.Light` | AdCard, AdDetail |
| Send message | `ImpactFeedbackStyle.Light` | Chat |
| Post ad | `NotificationFeedbackType.Success` | Create Ad |
| Logout | `NotificationFeedbackType.Warning` | Profile |

## 8.3 Loading States

- **Full-screen spinner:** `ActivityIndicator` (large, accent color) centered on screen — used for initial data loads
- **Pull-to-refresh:** `RefreshControl` with accent tint color — used on Home feed
- **Button loading:** `ActivityIndicator` replaces button text, button disabled with reduced opacity
- **Inline loading:** Smaller spinners within list items or action buttons

## 8.4 Empty States

Consistent `EmptyState` component across all list screens:
- 80x80 circle with muted icon
- Title (17px, semibold)
- Subtitle (15px, muted)
- Optional CTA button (accent)

## 8.5 Error Handling

- **Toast notifications:** Global toast for transient errors ("Failed to post ad", "Login failed")
- **Inline error boxes:** Red-tinted box with alert icon for form errors (login screen)
- **Failed message retry:** Chat messages that fail to send show red error icon with "Tap to retry" inline
- **Network offline banner:** Amber banner at top of screen: "Offline — limited functionality"
- **Error boundary:** React error boundary wraps entire app, shows fallback UI on crashes

## 8.6 Confirmation Patterns

- **Inline confirm:** Used for destructive actions (delete ad, ban user)
- **System alert:** Used for irreversible actions
- **Optimistic updates:** Favorites toggle immediately, syncs in background

## 8.7 Navigation Transitions

- **Stack screens:** Default horizontal slide (push/pop)
- **Modal screens:** Vertical slide-up (auth flows)
- **Drawer:** Spring-animated horizontal slide with backdrop fade

---

# 9. Mobile vs Web Design Behavior

## 9.1 Mobile UI (React Native)

| Aspect | Implementation |
|--------|---------------|
| **Layout** | Flexbox-based, `StyleSheet.create()` |
| **Navigation** | Bottom tab bar (5 tabs) + Stack + Drawer |
| **Scrolling** | `FlatList` with pagination, `ScrollView` for forms |
| **Gestures** | Swipe for image carousel, pull-to-refresh, drawer swipe |
| **Keyboard** | `KeyboardAvoidingView` for chat, `KeyboardProvider` global |
| **Safe areas** | `SafeAreaProvider` + `useSafeAreaInsets()` for notch/status bar |
| **Images** | `expo-image` with `contentFit="cover"` and transitions |
| **Typography** | Inter font, sizes: XS(11), SM(13), MD(15), LG(17), XL(22), XXL(28) |
| **Feedback** | Haptic feedback on key actions |
| **Platform** | Android-focused (tab bar height varies by platform) |

## 9.2 Web UI (Next.js + Tailwind)

| Aspect | Implementation |
|--------|---------------|
| **Layout** | Tailwind utility classes, `grid` + `flex` |
| **Navigation** | Fixed sidebar (256px) for admin |
| **Scrolling** | Native browser scroll, paginated tables |
| **Responsive** | `sm:`, `lg:` breakpoints for grid columns (1/2/4) |
| **Interaction** | CSS hover states, `transition-colors` |
| **Images** | `<img>` with Cloudinary URLs, Next.js `remotePatterns` configured |
| **Typography** | Inter font via CSS variable, system-ui fallback |
| **Feedback** | Visual hover/focus states, loading spinners |

## 9.3 Key Differences

| Feature | Mobile | Web |
|---------|--------|-----|
| Primary audience | Buyers + Sellers | Admins |
| Navigation | Bottom tabs + Drawer | Fixed sidebar |
| Ad creation | Full multi-step form | N/A (mobile only in MVP) |
| Chat | Real-time messaging | N/A (mobile only in MVP) |
| Moderation | Report submission only | Full moderation dashboard |
| Lists | Infinite scroll (FlatList) | Paginated tables |
| Actions | Haptic + animated | Hover + click |

## 9.4 Responsive Patterns (Web)

- Stats grid: `grid-cols-1` (mobile) → `sm:grid-cols-2` → `lg:grid-cols-4`
- Tables: horizontal scroll on narrow viewports
- Sidebar: fixed width (256px), no collapse in MVP

---

# 10. Design System Observations

## 10.1 Color Palette

### Primary

| Token | Hex | Usage |
|-------|-----|-------|
| `ACCENT` | `#FF6B35` | Primary CTA, active tab, links, buttons, price text |
| `ACCENT_LIGHT` | `#FFF0E8` | Active toggle background, contact preference highlight |
| `ACCENT_DARK` | `#E55A2B` | Hover state (web), pressed state variants |

### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `BG_SCREEN` | `#F7F8FA` | Page background, input backgrounds |
| `BG_CARD` | `#FFFFFF` | Cards, headers, bottom bars, tab bar |
| `BG_DISABLED` | `#EBEBEB` | Disabled button background |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `TEXT_DARK` | `#1A1A2E` | Primary text, headings |
| `TEXT_MUTED` | `#8A8A9A` | Secondary text, placeholders, labels |
| `TEXT_ON_ACCENT` | `#FFFFFF` | Text on accent-colored backgrounds |

### Status

| Token | Hex | Usage |
|-------|-----|-------|
| `SUCCESS_GREEN` | `#4CAF50` | "Negotiable" text, approve buttons |
| `ERROR_RED` | `#F44336` | Error text, favorited heart, reject buttons, danger actions |
| `WARNING_AMBER` | `#FF9800` | Offline banner, pending review indicator |
| `INFO_BLUE` | `#2196F3` | Informational badges |

### Special

| Token | Hex | Usage |
|-------|-----|-------|
| `PREMIUM_GOLD` | `#FFB800` | Premium badge background |
| `STAR_GOLD` | `#FFC107` | Filled rating stars |
| `STAR_GRAY` | `#E0E0E0` | Empty rating stars |
| `CHAT_SENT_BG` | `#FF6B35` | Sent message bubble |
| `CHAT_RECEIVED_BG` | `#F0F0F5` | Received message bubble |

### Category Colors

Each category has a unique pastel color: Teal (#4ECDC4), Blue (#45B7D1), Green (#96CEB4), Purple (#DDA0DD), Yellow (#FFEAA7), Light Blue (#74B9FF), Lavender (#A29BFE), Pink (#FD79A8), Emerald (#00B894), Gray (#B0B0B0).

## 10.2 Typography

**Font Family:** Inter (Google Fonts)

| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, descriptions |
| 500 | Medium | Labels, menu items, secondary headings |
| 600 | SemiBold | Buttons, badges, emphasis |
| 700 | Bold | Headings, prices, names |
| 800 | — | App logo, large prices |

**Size Scale (Mobile):**

| Token | Size | Usage |
|-------|------|-------|
| `XS` | 11px | Timestamps, badges, fine print |
| `SM` | 13px | Secondary text, labels |
| `MD` | 15px | Body text, buttons, inputs |
| `LG` | 17px | Section titles, names |
| `XL` | 22px | Screen titles, page headings |
| `XXL` | 28px | App name (Home header) |
| `PRICE` | 24px | Ad detail price display |

## 10.3 Spacing & Layout

- **Card padding:** 10-24px depending on density
- **Screen padding:** 16-20px horizontal
- **Section gaps:** 12-20px
- **Card border radius:** 12-16px
- **Button border radius:** 10-14px
- **Avatar sizes:** 48px (small), 52px (chat), 56px (drawer), 80px (profile)
- **Grid gap:** 12px (ad cards)
- **List separators:** 0.5-1px, `DIVIDER` color

## 10.4 Shadows & Elevation

| Level | Usage | Properties |
|-------|-------|-----------|
| Subtle | Cards, header buttons | `shadowOpacity: 0.06, shadowRadius: 4, elevation: 2` |
| Medium | Tab bar, Post FAB | `shadowOpacity: 0.35, shadowRadius: 8, elevation: 6-8` |
| Strong | Drawer panel | `shadowOpacity: 0.15, shadowRadius: 12, elevation: 16` |

## 10.5 Icon System

- **Mobile:** Ionicons (outline style for inactive, filled for active)
- **Web:** Lucide React (consistent stroke-based icons)
- **Icon sizes:** 12-14px (inline), 18-22px (navigation), 24-28px (tab bar), 48-64px (empty states)

## 10.6 Component Patterns

- **Cards:** White background, subtle shadow, 12px radius, contained content with padding
- **Pills/Chips:** Rounded (20px radius), 1px border, active state toggles fill to accent
- **Inputs:** 12px radius, 1px border (`BORDER`), 14px padding, `BG_CARD` background
- **Buttons (Primary):** Full-width, accent background, white bold text, 12-14px radius, 16px vertical padding
- **Buttons (Secondary):** Accent border, white background, accent text
- **Badges:** Small rounded pills, colored background, white bold text, min 20px width

---

# 11. UX Strengths

## 11.1 Progressive Disclosure of Auth

Users can browse the entire marketplace without signing up. Authentication is only required when they want to take action (post, chat, favorite). This reduces friction for first-time visitors and lets them discover value before committing.

## 11.2 Optimistic UI for Favorites

The favorite toggle updates instantly with haptic feedback before the Firestore write completes. This makes the interaction feel snappy and responsive even on slow connections.

## 11.3 Consistent Empty States

Every list screen uses the `EmptyState` component with contextual messaging and optional CTAs. This prevents confusion when screens are empty and guides users toward the next action.

## 11.4 Chat Message Retry

Failed chat messages remain visible with a red indicator and "Tap to retry" affordance. Users don't lose their messages or need to retype them after a network failure.

## 11.5 Centralized Design Tokens

All colors, font sizes, and spacings are defined in `src/constants/colors.ts` and the Tailwind config. This ensures visual consistency and makes theme changes trivial.

## 11.6 Service-Layer Architecture

All data access goes through dedicated service modules (`AdService`, `ChatService`, etc.), keeping components focused on UI logic and making the codebase testable and maintainable.

## 11.7 Haptic Feedback

Key interactions (favorite, send message, post ad, logout) include appropriate haptic feedback, adding tactile confirmation that enhances the native feel.

## 11.8 Offline Awareness

The app detects network status and displays a subtle amber "Offline" banner, setting user expectations without blocking interaction.

---

# 12. UX Improvement Opportunities

## 12.1 Missing Search on Home Screen

The home screen search bar is a tappable `Pressable` that navigates to the Search tab rather than providing inline search. This adds an extra navigation step and disrupts the user's flow. **Recommendation:** Enable direct text input in the home search bar with results navigating to Search Results.

## 12.2 Limited Image Count in Create Ad

The form currently limits to 5 images (via `pickImages(5 - images.length)`) while the PRP specifies a maximum of 8. **Recommendation:** Increase to 8 to match the product specification.

## 12.3 No Skeleton Loading States

Lists show a centered spinner during initial load. **Recommendation:** Implement skeleton/shimmer placeholders that match the card layout to reduce perceived load time and prevent layout shift.

## 12.4 No Pull-to-Refresh on Chat and Search

Only the Home feed has `RefreshControl`. **Recommendation:** Add pull-to-refresh on the Chat list and Search results for manual data refresh.

## 12.5 Missing "Read More" on Ad Detail

The PRP specifies a "Read More" expandable for long descriptions (>4 lines), but the current implementation shows the full description. **Recommendation:** Add a 4-line truncation with "Read More" toggle.

## 12.6 No Similar Ads Section

The PRP specifies a "More in [Category]" horizontal scroll in Ad Detail, but it's not implemented. **Recommendation:** Add a similar ads carousel fetching same-category ACTIVE ads.

## 12.7 Admin Dashboard Lacks Data Visualization

The admin dashboard shows numeric stats only. **Recommendation:** Add Recharts trend charts (daily new ads, user growth, report resolution rate) since Recharts is already a dependency.

## 12.8 No Keyboard Shortcut Hints (Web)

The admin tables have no keyboard navigation or shortcut hints. **Recommendation:** Add keyboard shortcuts for common actions (A = approve, R = reject, N = next) with a help overlay.

## 12.9 Missing Currency Selector in Create Ad

The create ad form hardcodes `currency: 'ETB'` without exposing the USD option. **Recommendation:** Add a currency toggle (ETB / USD) as specified in the PRP.

## 12.10 No Condition Selector in Create Ad

The create ad form doesn't include the condition field (NEW, LIKE_NEW, USED_GOOD, USED_FAIR). **Recommendation:** Add a condition selector for physical goods categories.

---

# 13. Future Design Recommendations

## 13.1 Scalability

- **Virtual list optimization:** Add `getItemLayout` to all `FlatList` instances (currently only on some) for consistent scroll performance at scale
- **Image lazy loading:** Implement progressive image loading with blur placeholders for the ad image carousel
- **Pagination standardization:** Unify cursor-based pagination across all list screens using a shared `usePagination` hook (already exists, should be adopted consistently)

## 13.2 UX Clarity

- **Onboarding walkthrough:** Add a first-time tutorial overlay highlighting key features (post ad, search, chat)
- **Status explanations:** Add info tooltips on ad status badges (PENDING_REVIEW, REJECTED) explaining what they mean and what the seller can do
- **Form progress indicator:** Add a step indicator or completion percentage to the Create Ad form
- **Confirmation modals:** Replace toast notifications for critical actions (ad posted, ad deleted) with brief confirmation modals or bottom sheets

## 13.3 Component Reuse

- **Shared AdCard (web):** The web `AdCard` should share the same layout structure as the mobile version for visual consistency in deep-linked pages
- **Form field component:** Extract the repeated input group pattern (label + styled TextInput) into a reusable `FormField` component
- **Action button variants:** Create a unified `Button` component with `primary`, `secondary`, `danger`, and `ghost` variants to replace inline style definitions

## 13.4 Accessibility

- **Screen reader labels:** Add `accessibilityLabel` and `accessibilityHint` to all interactive elements, especially icon-only buttons (favorite, share, menu)
- **Contrast ratios:** `TEXT_MUTED` (#8A8A9A) on `BG_SCREEN` (#F7F8FA) yields a 3.1:1 contrast ratio — below WCAG AA (4.5:1) for normal text. **Recommendation:** Darken muted text to #6A6A7A
- **Focus indicators:** Add visible focus rings for keyboard navigation on the web dashboard
- **Dynamic type support:** Respect user's system font size preferences via `allowFontScaling`
- **Reduced motion:** Provide `prefers-reduced-motion` alternatives for drawer and toast animations

## 13.5 Responsive Behavior

- **Tablet layout:** Detect larger screens and switch to a sidebar + content layout on tablets instead of bottom tabs
- **Web responsive:** Make the admin sidebar collapsible to an icon-only mode on screens under 1024px
- **Image gallery:** On larger screens, show a grid thumbnail strip below the main carousel image instead of dot indicators

## 13.6 Performance

- **Image caching:** Configure expo-image's memory and disk cache policies for frequently viewed ad thumbnails
- **List recycling:** Ensure `FlatList` items have stable keys and optimized `renderItem` to avoid unnecessary re-renders
- **Bundle size:** Monitor and code-split the web admin dashboard pages for faster initial load

---

*This document serves as the official Frontend UI/UX Design Specification for Bilu Store v1.0 MVP. It should be maintained alongside the codebase and updated as the product evolves.*
