# Bilu Store — Step-by-Step Setup & Launch Guide

This guide walks you from zero to a running production app.  
**Time estimate**: 2–3 hours for account setup, ~30 min for code.

---

## Prerequisites

Install these tools before starting:

```bash
# Node.js 20+
node --version   # should be v20.x or v22.x

# pnpm
npm install -g pnpm

# Expo CLI
npm install -g expo-cli eas-cli

# Convex CLI
npm install -g convex

# (Optional) Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash
```

---

## Step 1 — Clone & Install Dependencies

```bash
git clone https://github.com/YOUR_ORG/bilu-store.git
cd bilu-store

# Install mobile app dependencies
pnpm install

# Install web admin dependencies
cd web && pnpm install && cd ..
```

---

## Step 2 — Create Accounts (Free Tiers)

### 2a. Clerk (Auth)
1. Go to https://clerk.com → Create account → New application
2. Name it "Bilu Store"
3. Enable: **Phone number**, **Email**, **Google**, **Facebook** sign-in methods
4. Go to **API Keys** → copy `Publishable Key` and `Secret Key`
5. Go to **Webhooks** → Add endpoint:
   - URL: `https://YOUR_DEPLOYMENT.convex.site/clerk-webhook` (fill in after Step 4)
   - Events to subscribe: `user.created`, `user.updated`, `session.ended`
   - Copy the **Signing Secret**

### 2b. Convex (Backend)
1. Go to https://dashboard.convex.dev → Create account → New project
2. Name it "bilu-store"
3. Note your deployment URL (`https://xxxxx.convex.cloud`)

### 2c. Turso (Database)
```bash
turso auth login
turso db create bilu-store
turso db show bilu-store --url          # copy URL
turso db tokens create bilu-store       # copy token
```

### 2d. Chapa (Payments)
1. Go to https://dashboard.chapa.co → Register
2. Complete KYB (business verification) — required for live payments
3. For testing: use sandbox mode, no KYB needed
4. Go to **Settings → API Keys** → copy Secret Key
5. Go to **Settings → Webhooks** → Add:
   - Escrow URL: `https://YOUR_DEPLOYMENT.convex.site/escrow-webhook`
   - Pro URL: `https://YOUR_DEPLOYMENT.convex.site/pro-webhook`
   - Copy the webhook secret

### 2e. AfricasTalking (SMS OTP)
1. Go to https://account.africastalking.com → Register
2. Create an app named "bilustore"
3. Go to **Settings → API Key** → copy it
4. For testing: use the Sandbox environment (free, no real SMS sent)

### 2f. Google reCAPTCHA v3
1. Go to https://www.google.com/recaptcha/admin → Create
2. Type: **Score based (v3)**
3. Domains: your production domain + `localhost`
4. Copy **Site Key** (goes in mobile app env) and **Secret Key** (goes in Convex env)

### 2g. Google AdMob
1. Go to https://admob.google.com → Register
2. Add app (Android + iOS)
3. Create ad units: **Banner** and **Interstitial** for each platform
4. Copy the 4 ad unit IDs

### 2h. Sentry (Error Tracking)
1. Go to https://sentry.io → Create account → New project → React Native
2. Copy the **DSN**

---

## Step 3 — Configure Environment Variables

### Mobile app (`.env` in project root)
```bash
cp .env.example .env
```
Edit `.env` and fill in:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
EXPO_PUBLIC_ADMOB_BANNER_ANDROID_ID=ca-app-pub-xxx/xxx
EXPO_PUBLIC_ADMOB_BANNER_IOS_ID=ca-app-pub-xxx/xxx
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID_ID=ca-app-pub-xxx/xxx
EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS_ID=ca-app-pub-xxx/xxx
```

### Web admin (`web/.env.local`)
```bash
cat > web/.env.local << 'EOF'
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
EOF
```

---

## Step 4 — Deploy Convex Backend

```bash
# Login and link to your project
npx convex dev --once   # this bootstraps the deployment URL

# Set all server-side secrets (replace values with yours)
npx convex env set CLERK_SECRET_KEY         "sk_test_xxx"
npx convex env set CLERK_WEBHOOK_SECRET     "whsec_xxx"
npx convex env set TURSO_URL                "libsql://your-db.turso.io"
npx convex env set TURSO_AUTH_TOKEN         "eyJ..."
npx convex env set CHAPA_SECRET_KEY         "CHASECK_TEST-xxx"
npx convex env set CHAPA_WEBHOOK_SECRET     "xxx"
npx convex env set RECAPTCHA_SECRET_KEY     "xxx"
npx convex env set AFRICAS_TALKING_API_KEY  "atsk_xxx"
npx convex env set AFRICAS_TALKING_USERNAME "bilustore"

# Deploy to production
npx convex deploy
```

Note the deployment URL — update the Clerk webhook endpoint to:
`https://YOUR_DEPLOYMENT.convex.site/clerk-webhook`

---

## Step 5 — Run the Turso Database Migration

```bash
# One-shot migration (safe to re-run — idempotent)
npx ts-node scripts/migrate/firestoreToTurso.ts
```

If you have no existing Firestore data, skip this step — Turso tables are created automatically when the first user signs up.

---

## Step 6 — Run the App (Development)

```bash
# Start Expo dev server
pnpm dev

# In another terminal — start Convex in watch mode (auto-reloads functions)
npx convex dev
```

Scan the QR code with Expo Go (Android) or Camera (iOS).

---

## Step 7 — Run the Web Admin (Development)

```bash
cd web
pnpm dev
# Open http://localhost:3000/admin
```

Sign in with a Clerk account that has `publicMetadata.role = "admin"`.  
To set admin role:
```bash
# From Clerk dashboard → Users → find user → Edit public metadata
# Set: { "role": "admin" }
```

Or via Convex:
```bash
npx convex run users:adminSetRole --args '{"targetUserId":"user_xxx","role":"admin"}'
```

---

## Step 8 — Build for Production (Android)

```bash
# Configure EAS (first time only)
eas build:configure

# Build Android APK/AAB
eas build --platform android --profile production

# Or build locally (requires Android Studio)
expo run:android --variant release
```

### App signing
EAS manages keystore automatically. For local builds:
```bash
eas credentials   # interactive setup
```

---

## Step 9 — Load Test Before Launch

Install k6: https://k6.io/docs/getting-started/installation/

```bash
# Set your test tokens
export CONVEX_URL="https://YOUR_DEPLOYMENT.convex.cloud"
export CLERK_TOKEN="your_test_jwt_token"  # from Clerk dashboard → Sessions

# Feed read: 200 rps for 2 min
k6 run scripts/loadtest/feed-read.js

# Escrow verify (bcrypt pressure): 20 rps for 30s
k6 run --env DEAL_ID=1 scripts/loadtest/escrow-verify.js

# Intel interactions: 100 rps for 60s
k6 run scripts/loadtest/intel-interaction.js
```

**Pass criteria**: p(95) < 2s for feed, no 5xx errors.

---

## Step 10 — Security Checklist Before Launch

- [ ] Rotate the Firebase Admin SDK key (see `docs/SECURITY.md §2`)
- [ ] Purge it from git history using BFG (see `docs/SECURITY.md §2`)
- [ ] Run `pnpm audit --audit-level=high` — fix any critical CVEs
- [ ] Verify Sentry is receiving events: `npx sentry-cli projects list`
- [ ] Test rate limiting: rapidly call escrow.initiate 4+ times — 4th should fail
- [ ] Test reCAPTCHA: submit a request with `captchaToken: "invalid"` — should get `captcha_failed`
- [ ] Test Pro gate: Pro account → no ads visible; Free account → banner every 8 cards

---

## Step 11 — Go Live

1. **Submit to Google Play Store**:
   - Build AAB: `eas build --platform android --profile production`
   - Upload to Play Console → Production track
   - Fill in store listing: description, screenshots (minimum 2), feature graphic
   - Privacy Policy URL (required) — see `docs/SECURITY.md` for data practices

2. **Sentry release tagging**:
   ```bash
   VERSION=$(node -e "console.log(require('./package.json').version)")
   npx sentry-cli releases new $VERSION
   npx sentry-cli releases finalize $VERSION
   ```

3. **Monitor first 48 hours**:
   - Sentry: check error rate
   - Convex dashboard: function error rate < 1%
   - Chapa dashboard: payment success rate > 95%

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "unauthenticated" from Convex | Clerk session expired — sign out + in |
| Webhook not firing | Check Clerk dashboard → Webhooks → Delivery attempts; update URL to match Convex deployment |
| Turso connection timeout | Check `TURSO_URL` format: must start with `libsql://` |
| AdMob ads blank | Ensure consent granted, check ad unit ID format `ca-app-pub-xxx/xxx` |
| Pro plan not activating | Check Chapa dashboard for webhook delivery to `/pro-webhook` |
| reCAPTCHA blocking users | Temporarily unset `RECAPTCHA_SECRET_KEY` in Convex env to disable |

For more details, see `docs/RUNBOOK.md`.

---

## Key Contacts & Resources

| Resource | URL |
|----------|-----|
| Convex docs | https://docs.convex.dev |
| Clerk docs | https://clerk.com/docs |
| Turso docs | https://docs.turso.tech |
| Chapa docs | https://developer.chapa.co |
| AfricasTalking docs | https://developers.africastalking.com |
| Expo docs | https://docs.expo.dev |
| k6 docs | https://k6.io/docs |
