# Bilu Store — Product Requirements Document (PRD)

**Version**: 2.0 (Production upgrade of PRP v1.0)
**Status**: Pending approval — no application code until all 4 docs are approved
**Stack**: Expo (NativeWind) · Convex · Turso (libSQL) · Clerk · Cloudinary · Sentry · Algolia · Chapa/Telebirr · AdMob
**Scope**: Supersedes `prp.md` for Phase 2 (everything after MVP). Preserves Cloudinary image pipeline; migrates Firebase Auth → Clerk, Firestore → Turso + Convex, Firebase Functions → Convex functions.

---

## 0. Guiding Principles

1. **Zero-trash code.** No unused imports, no boilerplate, no AI slop. Every file justifies its existence.
2. **Server-authoritative state.** Anything money-touching (escrow, payouts, commission, countdowns) lives in Convex — never on the device.
3. **Human-only access paths.** Every Convex function begins with `ctx.auth` check; every Turso query goes through a typed data-access module.
4. **Cloudflare R2 reference in the original PRP is aspirational — Cloudinary is the production image store and MUST NOT be modified.**
5. **Free-tier first.** Every system must stay inside Clerk's 10k MAU, Convex's 1M function calls/mo, Turso's 9GB + 1B row reads, Sentry's 5k events/mo. Explicit guardrails in `IMPLEMENTATION_PLAN.md`.
6. **Don't build for the hypothetical.** Every feature below ships only if the upgrade phase in `IMPLEMENTATION_PLAN.md` includes it.

---

## 1. Product Snapshot

| Field | Value |
|---|---|
| App Name | Bilu Store |
| Bundle ID | `com.bilustore.app` |
| Platforms | Android (primary), iOS (stretch), Web (browse-only, public) |
| Mobile | React Native 0.81 via Expo SDK 54, TypeScript strict |
| Navigation | Expo Router v6 + Bottom Tabs + Drawer |
| Styling | NativeWind (Tailwind for RN) |
| State | Zustand 5 (client UI) + Convex hooks (server state) |
| Auth | **Clerk** (Google, Email OTP, Phone OTP via AfricasTalking) |
| Reactive DB | **Convex** (chat, activity feed, viral score, escrow countdowns) |
| Durable DB | **Turso (libSQL)** (users, listings, orders, reviews, audit logs) |
| Images | Cloudinary (preserved) |
| Search | Convex full-text search → swappable to Algolia |
| Payments | Chapa (hosted + USSD), Telebirr OpenAPI |
| Monitoring | Sentry (mobile + Convex) |
| Ads | AdMob (free users only) |
| Admin | Next.js 14 (App Router) + Shadcn/ui + Tremor |

---

## 2. Users & Roles

### 2.1 Role model
Stored in **Clerk `publicMetadata`** (read-only from client, writable only by Convex Admin Actions):

```ts
publicMetadata = {
  role: "buyer" | "seller" | "admin",
  plan: "free" | "pro",
  verificationTier: 1 | 2 | 3,
  sellerTrustScore: number,  // 0–100, computed nightly
  planExpiresAt: number | null,
  proTrialUsed: boolean,
}
```

### 2.2 Seller verification tiers

| Tier | Requirements | Capabilities |
|---|---|---|
| **1** | Phone + Email verified | Browse, save, chat |
| **2** | Tier 1 + Fayda QR upload + selfie | Sell ≤ 5 items at once, ≤ 10,000 ETB each |
| **3** | Tier 2 + Trade License + TIN | Unlimited listings, "Verified" badge |

**Fayda integration strategy**:
- Now: manual upload of Fayda QR image + selfie → Convex stores URLs → admin approves/rejects.
- Later: placeholder `VerificationService.ts` with adapter method `submitForAutomatedReview(userId)` so we can swap in the official Fayda API when available.
- **Never store the raw Fayda number.** Turso `verification_requests` stores only `submission_url` (Cloudinary), `status`, `admin_note`, `reviewed_at`. On approval, `users.verification_tier` is bumped — the Fayda document is deleted from Cloudinary.

### 2.3 Admin
`role: "admin"` gates the Next.js web dashboard. No mobile admin UI.

---

## 3. Auth & Identity (Clerk)

### 3.1 Flows
- **Sign-up/sign-in**: Google OAuth, Email OTP, Phone OTP.
- **Phone OTP** uses AfricasTalking via a Clerk custom SMS provider webhook (Convex HTTP Action `sendSmsOtp`). Rationale: Clerk's built-in Twilio doesn't cover Ethiopian operators reliably.
- **Session**: Clerk session tokens auto-attached to every Convex request via `convex/clerk`.

### 3.2 User creation
1. Clerk webhook `user.created` → Convex Action `onClerkUserCreated` → inserts row into Turso `users` (FK = Clerk user ID).
2. Default `role: "buyer"`, `plan: "free"`, `verificationTier: 1`.
3. Mirror in Convex `users` table for reactive queries.

### 3.3 Role elevation
- `buyer → seller`: automatic on first listing attempt (after verification check).
- `seller → admin`: manual only, via `adminTools.setRole` Convex mutation guarded by existing admin check.

### 3.4 Step-up auth
Required before:
- Releasing escrow funds (seller side)
- Changing payout account
- Admin login to Next.js dashboard
- Any ban/unban action

Implementation: Clerk `requireReauth({ afterMinutes: 5 })` before sensitive Convex mutations.

---

## 4. Secure Deal / Escrow Engine

### 4.1 State machine
```
pending_payment → held → verified → completed
                   ↓         ↓
                refunded   refunded (admin)
                   ↓
                disputed (buyer-raised before code entry)
```

### 4.2 Flow
1. **Buyer** taps "Buy Securely" on ad → selects payment method (Chapa / Telebirr) → Convex mutation `escrow.initiate` creates `escrow_deals` row (`status: pending_payment`), calls payment provider, returns checkout URL.
2. Buyer completes payment → provider webhook → Convex Action `escrow.onPaymentConfirmed` → generates **6-digit delivery code**, hashes with **bcrypt (cost 10)**, stores hash only. Plain code returned once in response to the paying buyer's session and also mirrored to a short-lived `escrow_codes` Convex table (TTL 10 min, buyer-readable). Status → `held`.
3. **Countdown**: buyer chooses delivery window (default 48h, max 7d). `countdown_expires_at = now + window`. Convex `ctx.scheduler.runAfter(window, "escrow.onCountdownExpiry", { dealId })` is registered.
4. Buyer physically hands 6-digit code to seller at handover (or enters via QR handoff screen).
5. **Seller** enters code → Convex mutation `escrow.verify` runs `bcrypt.compare`. On success: status → `verified`, `verified_at = now`, payout scheduled after optional 0–8h settle window (configurable per tier — Pro sellers = 0h).
6. Payout scheduled action runs `payoutService.send({ method, account, amount })` to seller's Telebirr/CBE/bank. On success: status → `completed`, commission retained by platform wallet.
7. **If countdown expires with no code entry**: scheduled action triggers auto-refund to buyer. Status → `refunded`.
8. **Dispute window**: buyer may call `escrow.dispute(reason)` at any time BEFORE code is verified. Status → `disputed`. Admin resolves via dashboard.

### 4.3 Hard invariants
- **The 6-digit code is hashed with bcrypt (cost 10). Never stored plain in Turso.** The short-lived Convex `escrow_codes` record holds plain text only for the buyer, TTL 10 min, readable only by `buyer_id == ctx.auth.userId`.
- **Countdown lives server-side in Convex.** No device-side timer can influence state.
- **Once `escrow.verify` succeeds, the deal is final.** No rollback; any refund requires admin dispute resolution.
- **Concurrency**: Convex mutations are transactional — simultaneous code attempts either succeed once or all fail once state ≠ `held`.

### 4.4 Commission
| Plan | Rate |
|---|---|
| Free seller | 2.5%–5.0% (tiered by `amount` — see table below) |
| Pro seller | 1.5% flat |

| Amount | Free rate |
|---|---|
| ≤ 500 ETB | 5.0% |
| 501 – 5,000 ETB | 3.5% |
| > 5,000 ETB | 2.5% |

Stored as `commission_amount` (number, ETB) on the `escrow_deals` row at initiation. Immutable after creation.

> **Migration note**: existing code uses a flat 9.5% (`onInitiateEscrow.ts:6`). The new rate table is authoritative and must be adopted in the Convex rewrite. The existing Firebase escrow is NOT patched — it is replaced.

### 4.5 Audit
Every status change → `audit_logs` row (see SYSTEM.md §3). Append-only.

---

## 5. Intelligence & Algorithms

### 5.1 Viral Score (per listing)
```
score = (views × 1 + clicks × 5 + saves × 8 + sales × 20)
      / (hoursPosted + 2)^1.5
```

- Computed in Convex mutation `intel.recordInteraction` on every view/click/save/sale.
- Persisted to `listings.viral_score` (Turso) via Convex Action batching (max once / 60s per listing to avoid write storms).
- **Pro multiplier**: if `seller.plan == "pro"`, score *= 1.5 at read time (not at write — keeps underlying data clean).

### 5.2 Soft tracking
- Scroll past without click within 1.5s = `partial_view`.
- Tracked silently via `intel.partialView` mutation (batched client-side, flushed every 10s).
- After 3 `partial_view`s from same user on same listing with zero click → add `(user_id, listing_id)` to Convex `user_listing_suppressions` table. That listing is down-ranked 50% for that user for 7 days.

### 5.3 Seller Trust Score
Computed nightly in Turso SQL (scheduled Convex Action `intel.rebuildTrustScores` at 03:00 UTC):

```
fulfillment_rate  = (successful_sales / total_orders) × 100
response_time_hrs = avg(first_reply_ms) / 3600000
review_score      = weighted_avg(rating, weight = verified_buyer ? 3 : 1)

trust_score = (fulfillment_rate × 0.5)
            + ((24 - clamp(response_time_hrs, 0, 24)) / 24 × 25)
            + (review_score / 5 × 25)
```

- Written to `users.seller_trust_score` (Turso).
- Mirrored to **Clerk `publicMetadata.sellerTrustScore`** so mobile app can render the badge instantly on login without an extra query.

### 5.4 Search ranking signal
Final listing rank = `viral_score × (0.5 + 0.5 × trust_score/100) × (is_pro ? 1.5 : 1) × suppression_factor`.

---

## 6. Pro Tier

### 6.1 Seller Pro
- 1.5× viral score multiplier (applied at read time)
- 1.5% escrow commission (vs 2.5–5%)
- Unlimited active listings (free = 5)
- One-click re-list on expiry
- Analytics: view heatmap by city (Addis, Adama, Bahir Dar, Mekelle, Hawassa, Jimma, Dire Dawa, other)
- Gold "Verified Pro" badge
- Ghost Mode: profile/listing views invisible to viewed party
- Early boost: Pro listings surface in feed 30 min before the general timeline

### 6.2 Buyer Pro
- Ad-free UI
- First Look: new listings 30 min before free users (queue in Convex, released by scheduled action)
- Phone hidden until buyer opts in to reveal (protects seller from scraping)
- "Verified Sellers Only" filter toggle
- Pro UI skin: glassmorphism search, full-bleed cards, gold shadow

### 6.3 Pro UI upgrade
Activated when `publicMetadata.plan === "pro"`:
- Theme: Deep Obsidian `#1A1A2E` + Gold `#D4AF37` (see DESIGN.md §2.2)
- Custom haptics on tap (via `expo-haptics` medium impact)
- Lottie shimmer on avatar
- Hero cards: 2:1 full-bleed image, higher-res Cloudinary transform

### 6.4 Subscription
- Plans: **7-day trial** (TikTok referral only, one per user lifetime) → monthly **299 ETB** / yearly **2,990 ETB** (17% discount).
- Payment: Chapa webhook → Convex Action `pro.onChapaProPayment` → updates Clerk `publicMetadata.plan`, `planExpiresAt`.
- Expiry: scheduled Convex action checks daily — on expiry, downgrades + trims listings above the 5-item cap to `ARCHIVED`.

---

## 7. Admin Deep Control

### 7.1 Access
- Only users with Clerk `publicMetadata.role == "admin"` can open the Next.js web dashboard.
- Every admin mutation: `ctx.auth → assertAdmin(ctx) → logAuditEvent(actor_id, action, metadata)`.

### 7.2 Real-time activity feed
- Convex reactive query over `user_activity` table.
- Feed entries: `"[name] viewed [item] in [category] — [x]s ago"`.
- Admin can click entry → jumps to user profile with their last 100 actions.

### 7.3 Capabilities
- **Ban user**: calls Clerk `users.ban(userId)` (instant session revocation) + flags `users.banned = true` in Turso.
- **Shadow ban**: sets `users.visibility_score = 0` (listings never surface in search/feed but user sees normal UI). No Clerk change.
- **Impersonate user**: Clerk User Impersonation (web only, time-limited 15 min, logged in `audit_logs`).
- **Freeze deal**: `admin.freezeDeal(dealId)` → `escrow_deals.status = "disputed"`, halts scheduled payout.
- **Manually set Fayda tier**: `admin.setVerificationTier(userId, tier)`.
- **View full audit log**: per-user `audit_logs` query paginated.

### 7.4 Admin views
- **Pulse**: top 50 listings by 24h delta in viral score.
- **Ghost**: listings with >500 views and <5 clicks (price likely too high).
- **Seller Health**: ranked by trust score, with red flag if >20% refund rate last 30d.
- **Dispute queue**: all `disputed` deals sorted by createdAt.

---

## 8. Anti-Abuse & Security

### 8.1 Human verification
- **Google reCAPTCHA v3** (invisible) on: signup, listing post, escrow initiate, payout-account change.
- Token sent to Convex → verified server-side against Google API → score < 0.5 → function throws `ConvexError("captcha_failed")`.

### 8.2 Rate limiting
Implemented as Convex helper `withRateLimit(mutation, { key, perMinute })`:
- 10/min per user on generic mutations
- 3/min on `escrow.verify` (guard against code brute-force)
- 1/hr on `payoutAccount.update` (guard against swap attacks)
- bcrypt compare is constant-time; additionally, 5 failed `escrow.verify` in 10 min → 15 min lockout per (user, dealId).

### 8.3 Clerk-native
- Bot detection enabled on signup
- Password breach detection (Have-I-Been-Pwned) enabled
- Reused session token detection

### 8.4 Data protection
- No PII in client logs (Sentry `beforeSend` scrubs email, phone, address).
- Fayda documents: Cloudinary signed URLs with 5-min TTL, purged after verification decision.
- All Convex → Turso traffic is over TLS with the libSQL token.

---

## 9. Monetization

### 9.1 Ads (free users)
- AdMob banner in home feed (every 8th card)
- Interstitial between category switches (max 1 per 3 min per user)
- Rewarded video: "Watch to unlock extra listing photo slot" (optional UX sweetener)

Gating pattern:
```tsx
{user?.publicMetadata?.plan !== 'pro' && <AdMobBanner />}
```

### 9.2 Pro subscription
See §6.4.

### 9.3 Escrow commission
See §4.4. Auto-collected server-side.

### 9.4 Referral trial
- TikTok deep link `bilustore://ref/<campaignId>` → 7-day Pro trial on first install.
- `proTrialUsed` flag on Clerk metadata prevents abuse.

---

## 10. Search

### 10.1 Architecture
Single entrypoint: `convex/search.ts → search(input)`. Behind a stable type signature, implementation is swappable.

### 10.2 Phase 1 — Convex FTS
- Built-in `withSearchIndex` on `listings` table (fields: `title`, `description`, `category`).
- Filters: category, price range, location (city radius via simple lat/lng bounding box), condition.
- Free tier comfortable: ~500k searches/mo at current projection.

### 10.3 Phase 2 — Algolia swap
- Flip env flag `SEARCH_ENGINE=algolia`.
- Convex Action proxies to Algolia with app-side key (never ship admin key).
- Settings: Prefix Search = All, Typo Tolerance min 2 chars.

### 10.4 UX
- Debounce 200ms after keystroke.
- Location autocomplete: Google Places Autocomplete with session tokens (keeps under the $200 monthly credit).

---

## 11. Marketing Hooks

- **Share listing** button: generates branch.io or Firebase Dynamic Link replacement (plain HTTPS deep link: `bilustore.app/l/<listingId>`) opening to the ad. Share sheet for WhatsApp, Telegram, TikTok.
- **Viral auto-card**: on share, Convex Action generates a 1080×1920 card (Cloudinary transformation) with title + price + seller name + "Available on Bilu Store".
- **TikTok referral**: see §9.4.
- **Win-back email**: Clerk webhook on `session.ended` tracked in Turso — after 14d of inactivity, scheduled action sends "We miss you" email with a highlighted listing.

---

## 12. Non-Functional Requirements

| Dimension | Target |
|---|---|
| Cold start (mobile) | < 2.0 s to interactive home feed |
| Escrow verify latency | < 400 ms p95 (bcrypt cost 10 on Convex) |
| Chat message round-trip | < 250 ms p95 (Convex reactive) |
| Crash-free sessions | > 99.5% (measured in Sentry) |
| Ad post-to-live | < 3 s (sync write + async moderation trigger) |
| Accessibility | WCAG AA on admin web; contrast-safe on mobile |
| Offline | Read-only: cached feed renders; writes queue locally and flush when online (Convex has this built-in) |

---

## 13. Hard Constraints

- **Only** use Expo, Convex, Turso, Clerk, Cloudinary, Algolia, Chapa/Telebirr, AdMob, Sentry. Do not suggest alternatives.
- **All Convex functions must `ctx.auth`-check before returning any data.**
- **All lists use `@shopify/flash-list`** (to be added). No `ScrollView` or `FlatList` for data lists.
- **Cloudinary pipeline is read-only reference — do not modify `MediaService.ts`.**
- **Never hardcode hex colors** — use tokens from `src/constants/tokens.ts` (DESIGN.md §2).
- **Never store** raw Fayda numbers, plain escrow codes (beyond 10-min Convex TTL), or payment card details.
- **Never use `any`** — strict TypeScript everywhere. Use `unknown` + narrowing.
- **Never call Firestore in new code.** Firebase is being removed.

---

## 14. Out of Scope (This Release)

- iOS App Store submission (Android + web only)
- Multi-language UI (Amharic translation deferred to v2.1)
- Seller subscription tiers beyond Pro (e.g., "Pro+")
- In-app shipping / courier integration
- Crypto payment rails

---

## 15. Open Questions — Block Implementation

1. **AfricasTalking account**: who owns it? Credentials provisioned?
2. **Fayda API**: expected availability date? Do we need any interim integration?
3. **Chapa Pro subscription product**: is there a recurring-billing plan id, or do we manage renewals ourselves via scheduled actions?
4. **Algolia index quota**: confirm free-tier 10k records + 10k ops/mo matches our projection.
5. **Admin dashboard host**: Vercel free tier sufficient? Custom domain?

These must be resolved before Phase 3 (Backend Migration) in `IMPLEMENTATION_PLAN.md` begins.
