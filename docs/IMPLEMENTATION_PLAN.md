# Bilu Store — Implementation Plan

**Companion to**: `docs/PRD.md`, `docs/SYSTEM.md`, `docs/DESIGN.md`
**Execution rule**: each phase is atomic — completing it does not break the previous phase's working UX. Ship at the end of any phase and nothing regresses.
**Cost rule**: stay inside free tiers. Every phase calls out the free-tier ceiling and how we stay under it.

---

## Phase legend

- **Duration** = focused engineering days (1 engineer)
- **Firebase-dep replaced** = what we rip out
- **Free-tier guardrail** = what keeps the bill $0
- **Acceptance** = verifiable exit criteria

---

## P0 — Docs & Environment (YOU ARE HERE)

**Duration**: 1 day
**Firebase-dep replaced**: none
**Goal**: this plan plus PRD / SYSTEM / DESIGN approved; tooling installed.

**Acceptance**
- [ ] `docs/PRD.md`, `docs/SYSTEM.md`, `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md` committed and reviewed.
- [ ] VS Code extensions present: Markdown All in One, Mermaid Editor, Draw.io.
- [ ] MCP server `sequentialthinking` reachable.
- [ ] `security-audit-skill` + `database-schema-designer` skills registered.
- [ ] Open PRD Question set (§15) answered or explicitly deferred.

---

## P1 — Workspace & Token Foundation

**Duration**: 1 day
**Firebase-dep replaced**: none
**Goal**: pnpm workspace layout ready for Clerk + Convex + Turso + shared types.

**Steps**
1. Introduce `packages/shared/` with `types.ts` + `tokens.ts` (design tokens from DESIGN.md §2).
2. Update mobile `tsconfig.json` + `web/tsconfig.json` with path aliases to `packages/shared/*`.
3. Add `@shopify/flash-list` and `nativewind` + tailwind config.
4. Replace any `FlatList`/`ScrollView` **used for data lists** (not layouts) with `FlashList` — leave layout scrolls alone.
5. Wire Sentry (`@sentry/react-native` + `@sentry/node` for Convex adapter later).

**Free-tier guardrail**: Sentry 5k events/mo — set sample rate 0.2 on non-error traces.

**Acceptance**
- [ ] Mobile + web both build against the shared tokens module.
- [ ] Sentry init captures a test exception on both platforms.
- [ ] `pnpm typecheck` green.

---

## P2 — Clerk Auth Migration (Firebase Auth → Clerk)

**Duration**: 4 days
**Firebase-dep replaced**: `firebase/auth`, all of `src/services/AuthService.ts`, phone-verify screens, Google/Facebook SDK usage.
**Goal**: All sign-in, signup, phone OTP flows run through Clerk. Firebase Auth still initialized but no longer the primary path.

**Steps**
1. Create Clerk project; configure Google + Email OTP + Phone OTP providers.
2. Install `@clerk/clerk-expo` (mobile) and `@clerk/nextjs` (admin web).
3. Set up Clerk custom SMS provider webhook pointing to a placeholder Convex HTTP action (real implementation in P3).
4. Wrap `app/_layout.tsx` with `<ClerkProvider>`; wrap web root similarly.
5. Rewrite `app/auth/login.tsx`, `register.tsx`, `phone-verify.tsx` using Clerk's `useSignIn` / `useSignUp`.
6. Replace `AuthService` with `src/services/AuthService.ts` (Clerk-backed) exposing the same function names — minimizes call-site churn.
7. Gate screens via `useAuth()`; redirect to `/auth/login` when unauthenticated.
8. Keep the existing Firestore `users` doc temporarily — `AuthService` continues to read/write it until P4.
9. Delete `react-native-fbsdk-next` and `@react-native-google-signin/google-signin` (Clerk handles Google natively).

**Free-tier guardrail**: Clerk 10k MAU free. Disable unused providers to reduce spam signups.

**Acceptance**
- [ ] Every auth screen works end-to-end with Clerk on a real device.
- [ ] Existing user list still loads (Firestore still the data source).
- [ ] Old Firebase Auth sign-in paths are removed from code (no imports of `firebase/auth`).
- [ ] Security: verify `ctx.auth` equivalent is enforced on the one temporary Convex stub action.

---

## P3 — Convex Backbone (Firebase Functions → Convex)

**Duration**: 5 days
**Firebase-dep replaced**: `firebase-functions`, trigger scaffolding. (Keep Chapa/Telebirr services as pure modules — port them.)
**Goal**: Convex deployed; one working chat + activity feed end-to-end.

**Steps**
1. `pnpm create convex` in the repo root; commit `convex/` dir.
2. Migrate `functions/src/services/ChapaService.ts` + `TelebirrService.ts` to `convex/external/` (no Firestore deps).
3. Define `convex/schema.ts` matching SYSTEM.md §3 (Convex tables only, no Turso yet).
4. Implement `convex/chat.ts` mutations + reactive queries.
5. Swap mobile `src/services/ChatService.ts` to use `useMutation` / `useQuery` from Convex. Firestore `chats` / `messages` are now dead.
6. Implement `convex/activity.ts` (`logActivity` mutation, `streamActivity` admin query).
7. Implement `convex/clerkWebhook.ts` handling `user.created`, `user.updated`, `session.ended` events. User row creation still writes to Firestore temporarily; P4 adds Turso.
8. Set up `sendSmsOtp` HTTP action calling AfricasTalking — wire to the Clerk custom SMS webhook from P2.
9. Add `convex/helpers/assertAuth.ts`, `assertAdmin.ts`, `withRateLimit.ts`, `requireReauth.ts`.

**Free-tier guardrail**: Convex 1M function calls + 8GB bandwidth / mo. Debounce activity logs client-side (flush every 10s, max 20 events/batch).

**Acceptance**
- [ ] Chat fully functional via Convex; Firestore chat listeners removed.
- [ ] Admin web shows a live activity feed.
- [ ] `functions/` directory is in "maintenance only" — no new code lands there.
- [ ] All Convex mutations include the `assertAuth(ctx)` helper (grep-verified).

---

## P4 — Turso Migration (Firestore → Turso)

**Duration**: 6 days
**Firebase-dep replaced**: Firestore — everything except chat (already moved).
**Goal**: `users`, `listings`, `escrow_deals`, `reviews`, `favorites`, `reports`, `audit_logs`, `user_activity`, `seller_trust`, `verification_requests` live in Turso. Firestore is archived read-only.

**Steps**
1. Provision Turso DB (primary + one replica in eu-west); store URL + auth token in Convex env.
2. Run all `CREATE TABLE` + `CREATE INDEX` statements from SYSTEM.md §2. Commit as `convex/migrations/001_initial.sql`.
3. Build `convex/turso.ts` (the typed data-access layer from SYSTEM.md §3.1).
4. Write one-shot migration script `scripts/migrate/firestoreToTurso.ts`:
   - paginate each Firestore collection
   - transform per the mapping table in SYSTEM.md §8
   - write to Turso in batches of 500
   - print record-count reconciliation per collection
5. Rewrite all mobile services (`AdService`, `FavoriteService`, `ReviewService`, `UserService`, `ModerationService`, `SearchService`) to call Convex actions, which internally call `convex/turso.ts`. Delete Firestore imports from `src/`.
6. Flip `firestore.rules` to deny-all on everything we migrated. Keep `chats`/`messages` rules for now even though chat moved, in case of rollback (remove in P5).
7. Port `onAdWrite`, `onReviewCreate`, `onPremiumExpiry`, `onAdExpiry` triggers to Convex cron/mutation equivalents.

**Policy decisions surfaced**
- Reviews without an associated deal are **discarded** in migration (new rule: reviews must reference a completed deal).
- Existing escrow transactions older than cutover are marked `status='disputed'` and require admin manual finalization (OTP hash format change).

**Free-tier guardrail**: Turso free: 9 GB storage, 1B row reads/mo, 25M writes/mo. Expect ~50 MB at current data size — comfortable.

**Acceptance**
- [ ] Every service in `src/services/` (excluding `MediaService`) has zero `firebase/firestore` imports.
- [ ] Mobile browse + favorites + post flow works against Turso end-to-end.
- [ ] Admin web user table loads from Turso.
- [ ] Reconciliation report shows 100% row count parity (or the documented, approved discrepancies).

---

## P5 — Unified Search Core

**Duration**: 3 days
**Firebase-dep replaced**: Firestore-fallback search path in `SearchService.ts`.
**Goal**: single `convex/search.ts` entry, Convex FTS powering it; Algolia adapter present but behind a feature flag.

**Steps**
1. Implement `convex/search.ts` with a single exported `search({ query, filters })` action. Use Convex `withSearchIndex`.
2. Replace mobile `SearchService` with a thin wrapper that calls the Convex action.
3. Implement an Algolia adapter `convex/search_algolia.ts` behind `process.env.SEARCH_ENGINE === "algolia"`. Index syncing handled by a Convex mutation that writes to both Convex + Algolia when `listings` change.
4. Keyword debounce = 200 ms (existing — verify).
5. Add location autocomplete via Google Places session tokens (new: `src/hooks/usePlaces.ts`).

**Free-tier guardrail**: Convex FTS has no separate quota. Algolia free: 10k records + 10k ops/mo — index only `ACTIVE` listings; skip archived.

**Acceptance**
- [ ] Search works without Algolia env set (pure Convex).
- [ ] Toggling the env flag routes traffic to Algolia with no client change.
- [ ] Places autocomplete renders suggestions within 300 ms.

---

## P6 — Escrow Rewrite

**Duration**: 6 days
**Firebase-dep replaced**: every file in `functions/src/triggers/onInitiate*`, `onVerifyDelivery`, `onEscrowPayout`, `onRequestRefund`, plus the `escrow_transactions` / `escrow_otps` collections.
**Goal**: bcrypt-hashed 6-digit code, server countdown, auto-refund via scheduler, Chapa webhook → Convex HTTP action.

**Steps**
1. Build `convex/escrow.ts`:
   - `initiate({ listingId, paymentMethod })` → creates Turso row, returns Chapa/Telebirr checkout URL.
   - `onPaymentConfirmed` (HTTP action for Chapa/Telebirr webhooks) → generates code, bcrypt-hashes, stores `token_hash` in Turso + plain `code` in Convex `escrowCodes` (TTL 10 min).
   - `verify({ dealId, code })` → bcrypt.compare, rate-limited, 5-fail lockout.
   - `dispute({ dealId, reason })`.
   - `onCountdownExpiry` scheduled action → auto-refund.
   - `releasePayout` scheduled action.
2. Build `convex/payout.ts` with `send({ method, account, amount })` — wraps Chapa Transfer / Telebirr B2C.
3. Build `convex/crons.ts` with `escrowCodes.prune` every 5 min.
4. Wire mobile screens: `app/ad/[adId].tsx` Buy button, `app/escrow/[txId].tsx` (buyer view with countdown + QR + code), seller code-entry screen (new: `app/escrow/[txId]/verify.tsx`).
5. Add reCAPTCHA v3 on `initiate` and `verify` (see P10 for server verification — for now just collect the token).
6. Delete `src/services/EscrowService.ts` Firebase callable wrappers; rewrite against Convex.

**Free-tier guardrail**: bcrypt cost 10 is ~60 ms CPU on Convex — fine for < 20 verify/sec. Scheduled actions free up to cron frequency; prune every 5 min is safe.

**Acceptance**
- [ ] End-to-end test: buyer pays → receives code → seller verifies → payout scheduled → payout sent (sandbox credentials).
- [ ] Countdown expiry test: pay → do nothing → verify refund fires at `T+window`.
- [ ] Brute-force test: 6 wrong attempts → lockout engaged; 7th attempt rejected.
- [ ] `token_hash` stored, `code` only in Convex for ≤ 10 min (db inspection confirms).
- [ ] Commission amounts match the rate table in PRD §4.4.

---

## P7 — Intelligence Layer

**Duration**: 4 days
**Firebase-dep replaced**: none directly, but retires any remaining client-side sort hacks.
**Goal**: viral score live; nightly trust-score cron; soft-suppression after 3 partial views.

**Steps**
1. Implement `convex/intel.ts`:
   - `recordInteraction({ listingId, verb })` — throttled writeback to Turso (max 1/60s per listing).
   - `partialView({ listingId })` mutation + client-side batching helper `src/hooks/usePartialViewTracker.ts`.
2. SQL view `seller_trust_view` that feeds the nightly cron.
3. Cron `intel.rebuildTrustScores` → computes per seller, UPSERTs into `seller_trust`, then pushes top-line `trust_score` to Clerk metadata via batch API (respect 1000 calls/min).
4. Update feed + search ranking to apply the combined score formula (PRD §5.4).
5. Mobile: add Pro-multiplier read-time adjustment.

**Free-tier guardrail**: nightly cron touches all sellers — batch in groups of 500 to keep runtime < 30 s. Clerk metadata updates are free-tier unlimited but rate-capped.

**Acceptance**
- [ ] Feed ordering visibly reflects viral score within 1 min of 20 interactions on one listing.
- [ ] Nightly cron runs green; `seller_trust` populated for all sellers.
- [ ] Clerk `publicMetadata.sellerTrustScore` updated for at least one test user.

---

## P8 — Admin Control Plane

**Duration**: 5 days
**Firebase-dep replaced**: web dashboard's Firebase client.
**Goal**: full admin surface: activity feed, ban/shadow/impersonate, freeze, verification review, audit log.

**Steps**
1. Next.js 14 App Router scaffolding: sidebar per DESIGN.md §6.1; route guard `requireAdmin()`.
2. Replace `web/src/services/*` with Convex queries/mutations.
3. Pages:
   - `/admin` — Pulse, Ghost, Seller Health dashboards (Tremor charts).
   - `/admin/activity` — live feed.
   - `/admin/users/[id]` — profile + ban / shadow / impersonate / set-tier actions.
   - `/admin/disputes` — frozen deals queue.
   - `/admin/verification` — Fayda review queue (images lazy-loaded from signed Cloudinary URLs).
   - `/admin/audit` — filterable log.
4. Every admin mutation wrapped in `assertAdmin(ctx)` + `audit(ctx, action, meta)`.
5. Clerk User Impersonation (time-limited 15 min) wired through `@clerk/nextjs`.
6. Strip Fayda image URLs on approval/rejection (Cloudinary signed delete).

**Free-tier guardrail**: Vercel free hobby tier OK for admin traffic. Clerk impersonation free.

**Acceptance**
- [ ] Non-admin user hitting `/admin` is redirected to `/`.
- [ ] Ban user: target's session dies within 60 s; listings hidden.
- [ ] Impersonation auto-expires and logs both `start` and `end` audit events.
- [ ] Every admin action produces an `audit_logs` row.

---

## P9 — Pro Tier & Subscriptions

**Duration**: 4 days
**Firebase-dep replaced**: none — greenfield.
**Goal**: Pro subscription flow via Chapa; UI theme swap; feature gates across the app.

**Steps**
1. Chapa recurring-billing integration (or scheduled renewal via our own cron if Chapa lacks recurring — confirmed per PRD open question #3).
2. `convex/pro.ts`: `startCheckout`, `onChapaProPayment` webhook, `expireIfDue` cron.
3. Mobile: `app/settings/pro.tsx` upgrade screen + trial eligibility check.
4. `ThemeProvider` reading Clerk metadata; crossfade on plan change.
5. Gate all Pro features behind `usePlan() === "pro"`:
   - Ghost mode (profile view hiding)
   - First-look queue (30-min delay on `listings` visible to free users — implement in feed query, not by separate table)
   - Ad-free UI (see P10)
   - Unlimited listings (override the 5-listing cap)
   - One-click re-list
6. TikTok referral deep link handler → 7-day trial activation.

**Free-tier guardrail**: no external cost. First-look implemented with `WHERE created_at < now - 30min OR user.plan = 'pro'` — pure SQL, no queue table.

**Acceptance**
- [ ] Pay for Pro sandbox → plan flips → theme swaps → features unlock.
- [ ] Expiry cron downgrades test user on schedule; listings beyond 5 archived.
- [ ] Deep link trial path grants 7 days and sets `pro_trial_used = 1`.

---

## P10 — AdMob Integration & Ad-Free Gate

**Duration**: 2 days
**Firebase-dep replaced**: none.
**Goal**: ads shown to free users only.

**Steps**
1. Install `react-native-google-mobile-ads`; configure in `app.json` with the AdMob app ID.
2. Create `<FeedAdSlot />` — renders `<BannerAd />` every 8th feed card, **only when `plan !== 'pro'`**.
3. Interstitial between category switches, gated by a 3-min cooldown stored in Zustand uiStore.
4. Verify GDPR-style consent flow (AdMob requires it even in Ethiopia for some APIs).

**Free-tier guardrail**: AdMob revenue-based; no cost.

**Acceptance**
- [ ] Pro account sees zero ads.
- [ ] Free account sees banner every 8th card and interstitial at most every 3 min.
- [ ] AdMob test ads render in dev; prod IDs used in release builds.

---

## P11 — Security Hardening

**Duration**: 3 days
**Firebase-dep replaced**: none.
**Goal**: reCAPTCHA v3 server-verified; rate limits in place; Sentry fully wired; secrets audited.

**Steps**
1. Server-side reCAPTCHA verification in `convex/helpers/assertCaptcha.ts`; score < 0.5 → throw.
2. Apply `withRateLimit()` wrapper to all mutations per PRD §8.2.
3. Configure Sentry with PII scrubbing (`beforeSend` strips email/phone/address from event payloads).
4. Audit `.env` and Convex env vars: move any leaked secret into Clerk/Convex env; delete `bilu-store-e1a06-firebase-adminsdk-fbsvc-73410c5a23.json` from repo (root of repo — committed key!).
5. Rotate all keys ever touched by the leaked admin-SDK file.
6. Add `docs/SECURITY.md` summarizing: what's stored where, key rotation cadence, incident response runbook.
7. Run the `security-audit-skill` on `convex/escrow.ts` + `convex/payout.ts` + Clerk webhook handler.

**Free-tier guardrail**: reCAPTCHA free for up to 1M assessments/mo.

**Acceptance**
- [ ] `git log --all --full-history -- "bilu-store-e1a06-firebase-adminsdk-fbsvc-*.json"` shows the file is purged (use BFG / filter-repo, document in SECURITY.md).
- [ ] Firebase service account key **rotated**.
- [ ] reCAPTCHA blocks a scripted curl hitting `initiate`.
- [ ] Rate limit test: 11 rapid mutations → 11th rejected.
- [ ] Sentry events visibly have no PII on sample capture.

---

## P12 — Load Test & Launch Prep

**Duration**: 3 days
**Firebase-dep replaced**: remaining scaffolding (delete `functions/`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `google-services.json`, adminsdk json).
**Goal**: production-ready release; load tested; store listing assets finalized.

**Steps**
1. Load test Convex endpoints with `k6` or `autocannon`:
   - feed read — 200 rps for 2 min
   - `escrow.verify` — 20 rps for 30 s (bcrypt pressure)
   - `intel.recordInteraction` — 100 rps batched.
2. Verify Turso row-count / Convex function metrics are inside free tier at projected 1k DAU.
3. Remove all remaining Firebase: `functions/` deleted, imports scrubbed, `firebase` and `@react-native-firebase/*` removed from `package.json`.
4. Finalize app-store assets: icon (`assets/images/icon.png` — already refreshed), screenshots, privacy policy update reflecting new stack, terms update.
5. Run the Android release build on 3 devices (Pixel 6a, Samsung A15, Tecno Camon 20). Capture performance (TTI, frame drops).
6. Sentry release tagging wired; source maps uploaded in CI.
7. Final `docs/RUNBOOK.md` for oncall: common failures (Clerk webhook lag, Chapa webhook retries, Turso replica lag) and fixes.

**Free-tier guardrail**: load test uses dev Convex project so prod stays untouched by the spike.

**Acceptance**
- [ ] Release APK built, signed, ≥ 99.5% crash-free on canary rollout (10% users, 48h).
- [ ] All Firebase references purged (`grep -r "firebase" --include="*.ts"` returns only comments).
- [ ] `docs/RUNBOOK.md` present and reviewed by one other engineer.
- [ ] Store listing live.

---

## Cross-phase conventions

### Branching
`main` is always releasable. Each phase is a branch `phase/Pn-<slug>` merged via PR with:
- typecheck green
- Jest + RN Testing Library unit suite green
- at least one end-to-end happy path manually tested
- no `firebase/*` imports added (CI rule from P4 onward)

### Convex function template
Every Convex mutation starts with:
```ts
export const x = mutation({
  args: { /* v-validated */ },
  handler: async (ctx, args) => {
    const userId = await assertAuth(ctx);
    await assertCaptcha(ctx, args.captchaToken);
    await withRateLimit(ctx, `x:${userId}`, 10);
    // … business logic
    await audit(ctx, "x", { /* metadata */ });
  },
});
```

### Don't-do-this list
- Do not add unused dependencies.
- Do not keep dead Firebase code "for reference" — git history is the reference.
- Do not skip ops: cron jobs must be registered in `convex/crons.ts`, not kicked off ad-hoc.
- Do not write new Firestore code in any phase. Even for "quick fix".
- Do not commit credentials. Ever. (See P11 for the one already committed that must be rotated.)

---

## Rollback strategy

Each phase branch is kept alive for 14 days post-merge. Rollback = revert the merge commit. Because Turso migration (P4) is destructive on Firestore (writes stop), we keep a Firestore export (NDJSON, Cloudinary-stored encrypted) for 30 days. After 30 days, Firestore project can be deleted.

---

## Decision points that block Phase-start

| Blocker | Needed before | Owner |
|---|---|---|
| AfricasTalking API key | P3 | you |
| Fayda interim plan | P8 | you (manual review is the default) |
| Chapa recurring-billing confirmed | P9 | you |
| Algolia free-tier confirmed | P5 | engineering |
| Vercel domain for admin | P8 | you |
| App Store policy review (TikTok deep link) | P9 | you |

All resolved → green light to execute P1.
