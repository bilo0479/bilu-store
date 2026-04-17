# Bilu Store — Oncall Runbook

**Last updated**: 2026-04-17  
**Stack**: Convex (backend) · Turso (SQL) · Clerk (auth) · Chapa (payments) · Expo (mobile)

---

## 1. Monitoring Endpoints

| What | Where |
|------|-------|
| Convex dashboard | https://dashboard.convex.dev |
| Turso metrics | https://turso.tech/app → your org |
| Clerk dashboard | https://dashboard.clerk.com |
| Chapa transactions | https://dashboard.chapa.co |
| Sentry errors | https://sentry.io → bilu-store project |

---

## 2. Common Failures

### 2.1 Clerk Webhook Lag / Dropped Events

**Symptom**: New user signs up but has no Turso row; profile returns `user_not_found`.

**Cause**: Clerk webhook to `/clerk-webhook` Convex HTTP action failed or was slow.

**Fix**:
1. Go to Clerk Dashboard → Webhooks → your endpoint
2. Find the failed delivery under "Delivery Attempts"
3. Click **Resend** on the failed `user.created` event
4. If endpoint URL is wrong: update to `https://<your-deployment>.convex.site/clerk-webhook`
5. If HMAC mismatch: regenerate signing secret in Clerk → update `CLERK_WEBHOOK_SECRET` in Convex env

**Verify**: Run `convex run users:getMyProfile` from Convex dashboard for the affected userId.

---

### 2.2 Chapa Webhook Retries / Escrow Not Confirmed

**Symptom**: User paid but escrow stays in `held` status; buyer sees "Payment pending".

**Cause**: Chapa's webhook to `/escrow-webhook` (or `/pro-webhook`) failed.

**Fix**:
1. Check Chapa dashboard → Transactions → find tx_ref
2. If status is `success` in Chapa but Convex shows `held`:
   - Manually trigger: `convex run escrow:processConfirmedPayment --args '{"txRef":"BSE-..."}'`
   - Or contact Chapa support to replay the webhook
3. Verify HMAC: ensure `CHAPA_WEBHOOK_SECRET` in Convex env matches Chapa dashboard
4. Check Convex logs → HTTP Actions → `/escrow-webhook` for error traces

**Verify**: `SELECT * FROM escrow_deals WHERE payment_tx_ref = 'BSE-...'` in Turso console.

---

### 2.3 Turso Replica Lag

**Symptom**: User posts a listing; it appears immediately but then disappears for ~2s on refresh.

**Cause**: Turso primary → replica replication lag (typically < 200ms but can spike).

**Fix** (no immediate action needed — this is eventual consistency):
1. For reads immediately after writes, ensure queries go to primary:
   - Turso libSQL client: add `?read_your_writes=true` flag if supported
2. If lag exceeds 5s consistently: check Turso status page (https://status.turso.tech)
3. Scale up Turso plan if p99 lag > 2s at current DAU

---

### 2.4 Escrow Auto-Refund Fired Incorrectly

**Symptom**: Seller claims to have confirmed delivery but buyer got refund.

**Cause**: Seller didn't enter code within 48h window OR countdown timer fired due to clock skew.

**Fix**:
1. Check `escrow_deals` row: `SELECT * FROM escrow_deals WHERE id = <dealId>`
2. If `status = 'refunded'` and seller has evidence: manually call `admin.ts resolveDispute` to pay out seller
3. Update `COUNTDOWN_WINDOW_MS` constant in `convex/escrow.ts` if 48h is too tight for your market

---

### 2.5 AdMob Ads Not Showing

**Symptom**: Free users see empty banner slots.

**Cause**: Either test IDs in prod build, or consent not granted.

**Fix**:
1. Verify `EXPO_PUBLIC_ADMOB_BANNER_ANDROID_ID` / `EXPO_PUBLIC_ADMOB_BANNER_IOS_ID` are set in `.env`
2. Check `ConsentGate` — UMP form may have been declined → ads disabled by policy
3. Verify AdMob account is approved and unit IDs are active

---

### 2.6 Pro Plan Not Activating After Payment

**Symptom**: User paid 199 ETB but `usePlan()` still returns `"free"`.

**Cause**: Chapa pro webhook failed or Clerk metadata update failed.

**Fix**:
1. Find transaction in Chapa with txRef prefix `BSPRO-`
2. Verify webhook hit `/pro-webhook` → Convex logs
3. Manually: `convex run pro:activatePro --args '{"userId":"user_xxx"}'`
4. Clerk metadata update may have failed: check `CLERK_SECRET_KEY` is valid
5. Tell user to sign out and back in (Clerk refreshes `publicMetadata` on new session)

---

### 2.7 reCAPTCHA Blocking Legitimate Users

**Symptom**: Users see "captcha_failed" on listing creation or escrow initiation.

**Cause**: Score threshold too aggressive, or token expired.

**Fix**:
1. Check Sentry for `captcha_failed` error rate — if > 5% of requests, lower threshold
2. Edit `MIN_SCORE` in `convex/helpers/assertCaptcha.ts` (e.g. 0.3)
3. Deploy updated Convex functions
4. If widespread: temporarily set `RECAPTCHA_SECRET_KEY=` (empty) in Convex env to disable

---

## 3. Free-Tier Headroom Check (Run monthly)

```sql
-- Turso row counts
SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL SELECT 'listings', COUNT(*) FROM listings
UNION ALL SELECT 'escrow_deals', COUNT(*) FROM escrow_deals
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
```

Turso free tier: 500 MB storage, 1B row reads/month.  
Convex free tier: 1M function calls/day, 64 MB DB.  
At 1k DAU: ~50k function calls/day → well within free tier.

---

## 4. Deployment Checklist

Before each production release:
- [ ] `pnpm typecheck` passes (root)
- [ ] `cd web && pnpm lint` passes
- [ ] `npx convex deploy` completes without errors
- [ ] Sentry release tagged: `npx sentry-cli releases new <version>`
- [ ] Source maps uploaded: `npx sentry-cli releases files <version> upload-sourcemaps dist/`
- [ ] Smoke test: create listing → initiate escrow → verify delivery on staging device

---

## 5. Rollback

Each phase branch is preserved for 14 days post-merge.

```bash
# Revert a Convex deploy
npx convex deploy --cmd-url-env-var-name CONVEX_DEPLOY_KEY -- --version <previous-version>

# Revert mobile: release a hotfix build or use EAS Update
eas update --branch production --message "rollback to vX.Y.Z"
```
