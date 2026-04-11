# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bilu Store** is a full-stack marketplace application with three independently deployable components:
- **Mobile app** — React Native/Expo (iOS & Android)
- **Web admin dashboard** — Next.js
- **Backend** — Firebase Cloud Functions + Firestore

## Commands

### Mobile App (root)
```bash
pnpm dev          # Start Expo dev server
pnpm build        # Build production bundle
pnpm serve        # Run local static server
pnpm typecheck    # TypeScript type check
```

### Web Dashboard (`web/`)
```bash
cd web
pnpm dev          # Dev server on port 3000
pnpm build        # Production build
pnpm start        # Run production build
pnpm lint         # ESLint via Next.js
```

### Cloud Functions (`functions/`)
```bash
cd functions
npm run build     # Compile TypeScript
npm run serve     # Start Firebase emulator locally
npm run deploy    # Deploy to Firebase
```

### Testing
```bash
# Jest is configured at root (jest.config.js with ts-jest)
# Test files live in __tests__/
pnpm test
```

## Architecture

### Mobile App (`app/` + `src/`)
Uses **Expo Router** (file-based routing). Navigation structure:
- `app/(tabs)/` — bottom tab navigator: Home, Search, Post, Chat, Profile
- `app/auth/` — Login, Register, Phone Verify
- `app/ad/[adId].tsx` — Ad detail
- `app/chat/[chatId].tsx` — Chat conversation
- `app/post/create.tsx` — Create new ad

Business logic is separated from UI:
- `src/services/` — All Firebase/external service calls (AdService, AuthService, ChatService, SearchService, MediaService, etc.)
- `src/stores/` — Zustand global state (authStore, adsStore, chatStore, favoritesStore, uiStore)
- `src/hooks/` — React hooks that wire services + stores to components
- `src/components/` — Reusable UI components
- `src/config/` — Firebase, Cloudinary, Algolia SDK initialization
- `src/types/` — Shared TypeScript interfaces
- `src/constants/` — Colors, font sizes, categories

### Web Dashboard (`web/`)
Next.js app router under `web/app/`:
- `admin/` — Ad, user, and report moderation pages
- `auth/` — Admin login
- `category/` — Category management
- `web/src/services/` — Firebase calls (separate from mobile services)
- `web/src/components/` — Admin-only UI components (uses Tailwind CSS + Recharts)

### Cloud Functions (`functions/src/`)
Firestore event triggers + scheduled jobs:
- `triggers/onAdWrite.ts` — Syncs ad changes to Algolia
- `triggers/onMessageCreate.ts` — Sends push notifications for new chat messages
- `triggers/onReviewCreate.ts` — Sends notifications for new reviews
- `triggers/onPremiumExpiry.ts` — Downgrades expired premium ads
- `utils/algolia.ts` — Algolia index operations
- `utils/fcm.ts` — FCM push notification helpers

### Data Layer (Firestore)
Key collections and their shapes:
- `users` — profile, role (`USER`|`ADMIN`), `pushToken`, `banned`
- `ads` — listing data, Cloudinary image URLs, `isPremium`, `premiumTier`, `status`
- `conversations` + `messages` — real-time chat
- `reviews` — seller ratings
- `premiumAds` — premium tier subscriptions with `startDate`/`endDate`
- `reports` — content moderation queue

Security rules live in `firestore.rules`; composite indexes in `firestore.indexes.json`.

### External Services
| Service | Purpose | Config |
|---------|---------|--------|
| Firebase (Spark) | Auth, Firestore, Storage, Functions | `src/config/firebase.ts`, `google-services.json` |
| Cloudinary (Free) | Image upload & transformation | `src/config/cloudinary.ts` |
| Algolia (Free) | Instant search with Firestore fallback | `src/config/algolia.ts` |

Environment variables:
- Mobile: `.env` (Expo-prefixed `EXPO_PUBLIC_*`)
- Web: `web/.env.local`
- Functions: `functions/.env`

## Key Patterns

- **Search**: `SearchService.ts` uses Algolia when available and falls back to Firestore queries
- **Images**: Always go through `MediaService.ts` which uploads to Cloudinary and stores the transformed URL in Firestore
- **State flow**: UI component → custom hook (`src/hooks/`) → Zustand store + service call → Firestore
- **Premium ads**: Controlled by `PremiumService.ts` on the client and `onPremiumExpiry` function on the backend
- **Package manager**: Use `pnpm` for root and `web/`; `npm` for `functions/`
