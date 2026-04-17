You are a Senior Full-Stack Architect specializing in production-grade mobile marketplaces.
Your stack expertise: Expo (NativeWind), Convex, Turso (libSQL), Clerk Auth, Cloudflare R2, Sentry, Algolia, Chapa/Telebirr, AdMob.
You write zero-trash, human-grade TypeScript. No boilerplate. No unused imports. No AI slop.

---

## STEP 0 — READ BEFORE TOUCHING ANYTHING

1. Read the existing PRP (Product Requirements Prompt) in full.
2. Do a bird's-eye scan of the entire codebase. Identify:
   - Firebase dependencies still in use (auth, firestore, cloud functions)
   - What is already working and must NOT be touched
   - **Cloudflare photo storage: DO NOT TOUCH. It is stable and critical.**
3. Map what exists vs. what needs upgrading. Present this audit summary before writing a single file.

---

## STEP 1 — TRANSFORM PRP → FULL 10/10 PRD.md

Upgrade the existing PRP into a production-ready PRD.md covering every system we discussed.
Save to: `/docs/PRD.md`

The PRD must define:

### Auth & Identity
- Clerk as the sole auth provider (Google OAuth, Email OTP, Phone OTP via AfricasTalking)
- User roles stored in Clerk Public Metadata: `role: "buyer" | "seller" | "admin"`
- Seller verification tiers:
  - Level 1: Phone + Email (can browse)
  - Level 2: Fayda QR upload + Selfie (can sell up to 5 items / 10,000 ETB)
  - Level 3: Trade License + TIN (unlimited + Verified badge)
- Fayda integration strategy: manual QR upload for now, API placeholder for future
- NEVER store the raw Fayda number in the database — store verification status only

### Secure Deal / Escrow Engine
- Flow: Buyer initiates → pays via Chapa/Telebirr → funds held in platform wallet → system generates 6-digit token (hashed) + QR → countdown starts server-side in Convex (NOT on device)
- Buyer gives code to seller at handover
- Seller enters code → funds released to seller's Telebirr/CBE
- If countdown expires with no code entry → auto-refund triggered by Convex scheduled action
- Dispute window: buyer can raise complaint BEFORE giving code
- Once code is entered, deal is final (code = digital signature of acceptance)
- Commission: 2.5%–5% per deal. Pro sellers: 1.5% commission
- 6-digit code must be hashed (bcrypt) before storing in Turso — never stored plain

### Intelligence & Algorithms
- Viral Score formula per listing:
  `score = (views × 1 + clicks × 5 + saves × 8 + sales × 20) / (hoursPosted + 2)^1.5`
- Score recalculated on every interaction via Convex Mutation
- Soft tracking: scroll-past without click = partial_view, tracked silently
- 3 scroll-pasts with no click = item rank lowered for that specific user
- Seller Trust Score (calculated in Turso SQL):
  - Fulfillment rate: (successful_sales / total_orders) × 100
  - Response time: avg(reply_time_ms)
  - Review weight: verified buyer 5-star = 3× normal review
- Store SellerTrustScore in Clerk Public Metadata for instant load

### Pro Tier Logic
**Seller Pro:**
- 1.5× viral score multiplier on all listings
- Reduced escrow commission (1.5% vs 5%)
- Unlimited active listings (free = 5 max)
- One-click re-list expired items
- Advanced analytics: heatmap of viewer locations (Addis, Adama, Bahir Dar)
- "Verified Pro" gold badge
- "Ghost Mode": see who viewed their profile/items without the viewer knowing
- Early listing boost: pro listings appear in search 30 min before general feed

**Buyer Pro:**
- Ad-free UI
- "First Look": sees new hot listings 30 min before free users
- Phone number hidden until buyer chooses to reveal
- "Verified Sellers Only" filter toggle in search
- Pro UI skin: glassmorphism search bar, full-bleed cards with gold shadow

**UI Upgrade on Pro Activation:**
- Theme shifts subtly: Deep Obsidian/Gold accent replaces standard white
- Custom haptic feedback on key interactions
- Lottie shimmer effect on profile avatar
- Hero Cards: full-width product display with higher-res images

### Admin Deep Control
- RBAC: only `role: "admin"` in Clerk metadata can access
- Real-time activity feed using Convex `useQuery` on `user_activity` table
- Feed shows: `"User [name] viewed [item] in [category] — [X]s ago"`
- Admin capabilities:
  - Ban user (Clerk `banUser` API — instant session revocation)
  - Shadow ban (lower `visibilityScore` to 0 — user not deleted, just invisible)
  - Impersonate user (Clerk User Impersonation)
  - Freeze escrow deal pending review
  - Manually toggle Fayda verification status
  - View full audit log per user
- Admin dashboard: Next.js app (separate from mobile), using Shadcn/ui + Tremor
- Admin sees: Pulse (trending items), Ghost (high views / zero clicks = bad pricing alert), Seller Health rankings

### Human Verification / Anti-Attack
- Google reCAPTCHA v3 (invisible) on all sensitive actions
- reCAPTCHA score < 0.5 = Convex blocks the function call server-side
- Step-up Auth on: escrow release, payout bank change, admin login
- Rate limiting in Convex: max 10 requests/minute per user on mutation endpoints
- Clerk built-in bot detection active on signup

### Monetization
- Free users: AdMob banner + interstitial ads
- Ad toggle: `{user.publicMetadata.plan !== 'pro' && <AdMobBanner />}`
- Pro subscription payment: Chapa webhook → Convex mutation → Clerk metadata update
- Commission collected automatically on every completed escrow deal
- Pro trial: 7-day free trial triggered by TikTok referral deep link

### Search Architecture
- Unified Search Core in `convex/search.ts` — single action, swappable engine
- Phase 1 (now): Convex built-in full-text search (free, zero setup)
- Phase 2 (growth): swap to Algolia (enable Prefix Search: "All", Typo Tolerance: min 2 chars)
- Debounce: 200ms after keystroke before sending query to backend
- Location autocomplete: Google Places API (free with $200 monthly credit + session tokens)

### Marketing Hooks (Built Into App)
- "Share Listing" button generates deep link for WhatsApp/Telegram/TikTok
- TikTok referral link triggers 7-day Pro trial on first install
- Viral listings auto-generate shareable image card

---

## STEP 2 — GENERATE SYSTEM.md

Save to: `/docs/SYSTEM.md`

Cover:
- Full Turso SQLite schema (normalized, zero redundancy)
- Required indexes: `category`, `price`, `location`, `viral_score`, `created_at`
- Tables: `users`, `listings`, `escrow_deals`, `user_activity`, `audit_logs`, `seller_trust`, `reviews`, `verification_requests`
- `escrow_deals` table must include: `token_hash`, `status` (pending/active/released/refunded/disputed), `countdown_expires_at`, `commission_amount`, `buyer_id`, `seller_id`
- `audit_logs` table: immutable append-only, tracks every status change with `actor_id`, `action`, `timestamp`, `metadata`
- Convex schema types mirroring Turso tables (end-to-end TypeScript safety)
- How Convex `ctx.scheduler.runAfter` handles countdown expiry and auto-refund
- Concurrency: how simultaneous 6-digit code attempts are handled (Convex mutation = transactional, only one wins)
- NEVER store plain 6-digit code. Store `bcrypt(code)` only.

---

## STEP 3 — GENERATE DESIGN.md

Save to: `/docs/DESIGN.md`

Cover:
- Primary color: `#FF6B35` (Vibrant Orange) — used only for active states, CTAs, FAB
- Background: Pure White `#FFFFFF`, Surface: `#F7F8F9`
- Pro theme: Deep Obsidian `#1A1A2E` with Gold `#D4AF37` accents
- Spacing system: strict 8px grid (8, 16, 24, 32, 48)
- Border radius: 12px cards, 10px chips, 8px buttons, FAB = perfect circle
- Typography: Inter or Poppins, geometric sans-serif, minimal weights (400, 600 only)
- Icons: Feather or Heroicons line-art only — no filled icons except active state
- Product cards: full-bleed image as hero, price + location overlaid with dark gradient
- "No Results" screen: Lottie animation (empty floating cart + dust particles), text: "We looked everywhere, but couldn't find a match."
- Animations: all transitions weightless (<200ms), Framer Motion for micro-interactions
- Admin dashboard layout: Shadcn/ui dark theme, Tremor charts for analytics
- RBAC view differences: Admin sees full audit trail + freeze controls, Sellers see analytics + re-list, Buyers see saved items + deal history
- Mermaid diagram required for each major screen flow

---

## STEP 4 — GENERATE IMPLEMENTATION_PLAN.md

Save to: `/docs/IMPLEMENTATION_PLAN.md`

Phase-by-phase upgrade plan. Each phase must:
- State what Firebase dependency is being replaced
- State which free-tier limit applies and how to stay under it
- Be atomic (completing one phase does not break existing functionality)

Phases:
1. Docs & Environment (this prompt's output)
2. Auth Migration: Firebase Auth → Clerk (Google, Email OTP, Phone OTP)
3. Backend Migration: Firebase Cloud Functions → Convex (Queries, Mutations, Actions)
4. Database Migration: Firestore → Turso (schema first, then data migration)
5. Search: Enable Convex full-text search, Algolia integration placeholder
6. Escrow Engine: 6-digit code, countdown, auto-refund, Chapa webhook
7. Intelligence Layer: Viral score mutations, Seller Trust SQL queries, soft tracking
8. Admin Control: RBAC, activity feed, ban/shadow-ban/impersonate
9. Pro Tier: Subscription flow, UI skin swap, feature gates
10. Ads: AdMob integration with plan-based toggle
11. Security Hardening: reCAPTCHA v3, rate limiting, Sentry install
12. Load Testing & Launch Prep

---

## TOOLS YOU MUST USE THROUGHOUT

**VS Code Extensions installed:**
- Markdown All in One (doc formatting)
- Mermaid Editor (all logic flows must have a diagram)
- Draw.io (system architecture overview)

**MCP Servers installed:**
- `sequentialthinking` — use for all multi-step logic (escrow flow, fraud detection, payout sequence). Do not skip steps.

**Skills to invoke:**
- `security-audit-skill` — run on every auth flow, escrow function, and payment logic
- `database-schema-designer` — run when defining Turso tables

**Guardrails:**
- CLAUDE.md rule: "Only use Expo, Convex, Turso, Clerk. Do not suggest alternatives."
- CLAUDE.md rule: "All Convex functions must check `ctx.auth` before returning any data."
- CLAUDE.md rule: "All lists use `@shopify/flash-list`. No ScrollView for data lists."
- CLAUDE.md rule: "Cloudflare photo storage: read-only reference. Do not modify."

---

