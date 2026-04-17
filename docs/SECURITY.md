# Bilu Store — Security Document

**Last updated**: 2026-04-17  
**Owner**: Engineering Lead

---

## 1. Secret Storage Map

| Secret | Where stored | Who can read |
|--------|-------------|--------------|
| `CLERK_SECRET_KEY` | Convex env var | Convex runtime only |
| `CLERK_WEBHOOK_SECRET` | Convex env var | Convex runtime only |
| `TURSO_URL` | Convex env var | Convex runtime only |
| `TURSO_AUTH_TOKEN` | Convex env var | Convex runtime only |
| `CHAPA_SECRET_KEY` | Convex env var | Convex runtime only |
| `CHAPA_WEBHOOK_SECRET` | Convex env var | Convex runtime only |
| `RECAPTCHA_SECRET_KEY` | Convex env var | Convex runtime only |
| `AFRICAS_TALKING_API_KEY` | Convex env var | Convex runtime only |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Mobile `.env` | Client (public by design) |
| `EXPO_PUBLIC_CONVEX_URL` | Mobile `.env` | Client (public by design) |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile `.env` | Client (public by design) |
| `EXPO_PUBLIC_ADMOB_*` | Mobile `.env` | Client (public by design) |
| `NEXT_PUBLIC_CONVEX_URL` | Web `.env.local` | Client (public by design) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web `.env.local` | Client (public by design) |
| `CLERK_SECRET_KEY` (web) | Web `.env.local` | Next.js server only |

**Rule**: No secret ever lives in the repo. The `.gitignore` blocks `.env`, `.env.local`, and `*-firebase-adminsdk-*.json`.

---

## 2. Leaked Credential — Firebase Admin SDK

**File**: `bilu-store-e1a06-firebase-adminsdk-fbsvc-73410c5a23.json` (committed in initial commit)

**Status**: MUST be rotated immediately.

### Rotation steps
1. Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com)
2. Select the compromised key → **Delete key**
3. Generate a new service account key if still needed
4. Purge from git history:
   ```bash
   # Install BFG Repo Cleaner
   brew install bfg  # or download jar

   # Clone a fresh mirror
   git clone --mirror https://github.com/<org>/bilu-store.git bilu-store-mirror

   # Remove the file from all history
   bfg --delete-files "bilu-store-e1a06-firebase-adminsdk-fbsvc-73410c5a23.json" bilu-store-mirror

   # Clean and push
   cd bilu-store-mirror
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```
5. Invalidate all active Firebase sessions tied to that project if applicable
6. Notify team that force-push occurred — everyone must re-clone

---

## 3. Rate Limits

All public Convex actions enforce `withRateLimit()` (rolling 1-minute window):

| Endpoint | Limit |
|----------|-------|
| `escrow.initiate` | 3 / min |
| `escrow.verify` | 5 / min |
| `listings.create` | 10 / min |
| `reviews.createReview` | 5 / min |
| `favorites.toggleFavorite` | 30 / min |
| `user.updateProfile` | 10 / min |
| `intel.recordInteraction` | 1 / min per listing |
| `chat.sendMessage` | 20 / min |

Rate limit keys are scoped per `userId` so one user cannot affect another.

---

## 4. reCAPTCHA v3

- `assertCaptcha(ctx, token)` in `convex/helpers/assertCaptcha.ts`
- Score threshold: **0.5** (scores < 0.5 = bot likely → ConvexError `captcha_failed`)
- Required on: `escrow.initiate`, `escrow.verify`, `listings.create`
- Mobile client collects token via `expo-recaptcha-enterprise` or the reCAPTCHA v3 JS SDK
- `RECAPTCHA_SECRET_KEY` env var controls verification; absent = skip (dev)

---

## 5. PII Handling

- **Sentry**: `beforeSend` hook strips `email`, `ip_address`, `username` from `event.user`; runs `scrubObj()` recursive regex over `request.data`, `extra`, and breadcrumb messages/data. Pattern matches emails + Ethiopian mobile numbers (`+2519xxxxxxxx`)
- **Turso**: phone numbers stored only in `users.phone` column; never written to `audit_logs`
- **Convex**: no PII stored in Convex DB — only Clerk user IDs (opaque strings)
- **Logs**: no `console.log` of user objects; Sentry scrub is the last line of defence

---

## 6. Key Rotation Cadence

| Key | Rotation frequency |
|-----|-------------------|
| Chapa secret key | On compromise or annually |
| Clerk secret key | On compromise or when engineer leaves |
| Turso auth token | On compromise or quarterly |
| reCAPTCHA secret | On compromise |
| AfricasTalking API key | On compromise |

---

## 7. Incident Response Runbook

### Suspected credential leak
1. Immediately rotate the affected key (see §2 for Firebase procedure; analogous for others)
2. Revoke all active sessions in Clerk dashboard (Users → Bulk revoke sessions)
3. Scan git history: `git log --all --full-history -S "<secret-fragment>"`
4. If confirmed in history: BFG purge + force push + team re-clone
5. File post-mortem within 48 h

### Unusual escrow activity
1. Check Turso `escrow_deals` table: `SELECT * FROM escrow_deals WHERE status='disputed' ORDER BY created_at DESC LIMIT 50`
2. Inspect Convex logs for `captcha_failed` or `rate_limit_exceeded` spikes
3. If fraud pattern found: use `admin.ts adminBanUser` to suspend accounts
4. Escalate to Chapa support if bulk fraudulent payments detected

### Clerk webhook failure
1. Check Convex dashboard → HTTP Actions → `/clerk-webhook` error rate
2. Verify `CLERK_WEBHOOK_SECRET` in Convex env matches Clerk dashboard signing secret
3. Replay failed events from Clerk dashboard → Webhooks → Delivery Attempts

---

## 8. Dependencies Audit

Run quarterly:
```bash
pnpm audit --audit-level=high
cd web && pnpm audit --audit-level=high
```

Critical packages to watch: `convex`, `@clerk/clerk-expo`, `bcryptjs`, `expo`.
