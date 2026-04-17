"""Build PRD.docx — 10/10 standard."""
from helpers import (
    new_doc, cover, h1, h2, h3, para, bullets, numbered, table, kv_table,
    code_block, callout, page_break, rule, BRAND_PRIMARY, DANGER, SUCCESS, WARNING
)


def build(out_path):
    d = new_doc()

    # ── COVER ────────────────────────────────────────────────────────────────
    cover(
        d,
        title="Product Requirements Document",
        subtitle="A trust-first local marketplace for Ethiopia — escrow-secured deals, "
                 "verified sellers, and a Pro tier that earns its place.",
        version="2.0",
        status="Pending Approval"
    )

    # ── 1. EXECUTIVE SUMMARY ────────────────────────────────────────────────
    h1(d, "1. Executive Summary")
    para(d,
         "Bilu Store is a local classified marketplace for Ethiopia. The current MVP works "
         "but operates on a Firebase stack that cannot scale to the trust mechanics, real-time "
         "intelligence, or pro-tier monetization the product roadmap demands. This PRD defines "
         "the v2 product: a Convex + Turso + Clerk backbone, a server-authoritative escrow engine "
         "with bcrypt-hashed delivery codes, a viral-score and seller-trust intelligence layer, "
         "an admin control plane with full audit trail, and a Pro subscription that unlocks ad-free "
         "browsing, priority surfacing, and ghost-mode privacy. The Cloudinary image pipeline is "
         "preserved untouched.")

    callout(d, "TL;DR", "We are not adding features to an MVP — we are upgrading the spine of the product. "
            "Every requirement here is what the spine must support to ship the next 12 months of roadmap.")

    # ── 2. PROBLEM STATEMENT ────────────────────────────────────────────────
    h1(d, "2. Problem Statement")

    h3(d, "2.1 User pain points (today)")
    bullets(d, [
        "Buyers fear scams: there is no held-funds mechanism. A transaction is a leap of faith. "
        "Workaround: meet-in-public + cash, which excludes the diaspora and slows commerce.",
        "Sellers cannot prove credibility. A new seller looks identical to a fraudster. "
        "Workaround: spam-posting in Telegram groups for social proof.",
        "There is no signal that distinguishes a hot listing from a stale one. "
        "Workaround: sellers re-post manually every 48 hours.",
        "Free users see the same feed as paying users. There is no monetization lever beyond ads. "
        "Workaround: none — the product leaves money on the table.",
        "Admins cannot intervene live. A scam takes days to remove. "
        "Workaround: manual Firestore edits via the console — slow, audit-free, error-prone.",
    ])

    h3(d, "2.2 Business pain points")
    bullets(d, [
        "Firebase cost trajectory: Firestore reads scale linearly with the feed. We project a $1.2k/mo "
        "infrastructure bill at 5k DAU on the current stack, vs ~$0 on the proposed stack within free tiers.",
        "Cloud Functions cold starts (1.5s p95) are unacceptable for the buy-flow.",
        "No place to cache derived data (viral score, trust score) → every read recomputes or fakes.",
        "Auth is split across multiple SDKs (Firebase Auth + RN Google Sign-In + FB SDK) with brittle wiring.",
    ])

    h3(d, "2.3 Why now")
    para(d, "A regulator-friendly trust mechanism (escrow + Fayda verification) is the single largest "
            "lever for marketplace adoption in Ethiopia in 2026. Building it on the current stack means "
            "rebuilding twice. The migration window is now or never.")

    # ── 3. GOALS & NON-GOALS ────────────────────────────────────────────────
    h1(d, "3. Goals & Non-Goals")

    h3(d, "3.1 Goals (v2 — this release)")
    bullets(d, [
        "G1. Ship escrow-secured deals (bcrypt 6-digit code, server countdown, auto-refund) covering 100% of buy-flow.",
        "G2. Migrate Auth to Clerk (Google, Email OTP, Phone OTP via AfricasTalking) with zero downtime for existing users.",
        "G3. Migrate Firestore → Turso with 100% row parity and a 30-day rollback window.",
        "G4. Migrate Firebase Functions → Convex; chat and activity feed on reactive Convex queries.",
        "G5. Launch Pro tier (7-day trial, 299 ETB/mo, 2,990 ETB/yr) with theme swap and feature gates.",
        "G6. Stand up the Next.js admin dashboard with live activity feed, ban/shadow/impersonate, and full audit log.",
        "G7. Maintain ≥ 99.5% crash-free sessions and < 2.0s cold-start TTI on Pixel 6a-class devices.",
        "G8. Stay inside free tiers (Clerk 10k MAU, Convex 1M calls/mo, Turso 9 GB / 1B reads, Sentry 5k events/mo).",
    ])

    h3(d, "3.2 Non-Goals (v2 — explicitly excluded)")
    bullets(d, [
        "iOS submission. Android + public web browse only.",
        "Multi-language UI (Amharic translation deferred to v2.1).",
        "In-app shipping or courier integration.",
        "Crypto payment rails.",
        "Subscription tiers above Pro (no Pro+).",
        "Modifying the Cloudinary image pipeline — read-only reference.",
        "Re-architecting the chat UI; only the data layer moves to Convex.",
    ])

    # ── 4. SUCCESS METRICS ──────────────────────────────────────────────────
    h1(d, "4. Success Metrics")
    table(d,
          ["Metric", "Baseline (today)", "v2 Target", "Owner", "Reported in"],
          [
              ["Buyer activation (first deal initiated within 7d of signup)", "n/a (no escrow)", "≥ 22%", "Growth", "Admin → Pulse"],
              ["Escrow completion rate", "n/a", "≥ 90% of held → completed", "Trust", "Admin → Disputes"],
              ["Mean time to refund on countdown expiry", "n/a", "≤ 60s after expiry", "Eng", "Convex logs"],
              ["Seller verification (Tier ≥ 2) within 14d", "n/a", "≥ 35% of new sellers", "Trust", "Admin → Verification"],
              ["Pro conversion (free → paid within 30d)", "0%", "≥ 4%", "Growth", "Admin → Subscriptions"],
              ["Crash-free sessions", "97.8%", "≥ 99.5%", "Eng", "Sentry"],
              ["Search to first tap (p95)", "1.4s", "≤ 0.6s", "Eng", "Convex metrics"],
              ["Infra cost / DAU", "≈ $0.018", "≤ $0.001", "Eng", "Cloud bills"],
          ],
          col_widths=[2.4, 1.5, 1.5, 0.8, 1.2])

    page_break(d)

    # ── 5. USER ROLES & PERMISSIONS ─────────────────────────────────────────
    h1(d, "5. User Roles & Permissions")

    h3(d, "5.1 Role taxonomy")
    table(d,
          ["Role", "How assigned", "Stored in"],
          [
              ["buyer", "Default on Clerk signup", "Clerk publicMetadata.role + Turso users.role"],
              ["seller", "Auto-elevated on first listing attempt (after Tier 2 verification)", "same"],
              ["admin", "Manual via adminTools.setRole Convex mutation", "same"],
          ],
          col_widths=[1.0, 3.5, 2.5])

    h3(d, "5.2 Verification tiers (sellers)")
    table(d,
          ["Tier", "Requirements", "Listing cap", "Per-item cap", "Badge"],
          [
              ["1", "Phone + Email verified", "0 (browse only)", "—", "—"],
              ["2", "Tier 1 + Fayda QR + selfie (admin-reviewed)", "5 active", "10,000 ETB", "—"],
              ["3", "Tier 2 + Trade License + TIN", "Unlimited", "Unlimited", "Verified"],
          ],
          col_widths=[0.5, 2.7, 1.0, 1.0, 1.0])

    h3(d, "5.3 Permission matrix")
    para(d, "✓ = allowed. ✗ = denied. ⚠ = allowed with step-up auth.", italic=True, color=BRAND_PRIMARY, size=10)
    table(d,
          ["Capability", "Buyer", "Seller (Tier 2)", "Seller (Tier 3 / Pro)", "Admin"],
          [
              ["Browse listings", "✓", "✓", "✓", "✓"],
              ["Save favorites", "✓", "✓", "✓", "✓"],
              ["Initiate escrow purchase", "✓", "✗ (own listing)", "✗ (own listing)", "✗"],
              ["Verify delivery (enter buyer code)", "✗", "✓", "✓", "✗"],
              ["Raise dispute", "✓", "✗", "✗", "✓"],
              ["Post listing", "✗", "✓ (≤5)", "✓ (unlimited)", "✓"],
              ["Edit own listing", "n/a", "✓", "✓", "✓"],
              ["Change payout account", "n/a", "⚠", "⚠", "⚠"],
              ["Subscribe to Pro", "✓", "✓", "✓", "n/a"],
              ["Toggle Ghost Mode", "✗", "✗", "✓ (Pro only)", "n/a"],
              ["See raw viral score", "✗", "own only", "own only", "all"],
              ["Ban / shadow-ban / impersonate user", "✗", "✗", "✗", "⚠"],
              ["Freeze escrow deal", "✗", "✗", "✗", "⚠"],
              ["Approve / reject Fayda verification", "✗", "✗", "✗", "✓"],
              ["Read audit log", "own (7d)", "own (30d)", "own (30d)", "all (∞)"],
              ["Open admin web dashboard", "✗", "✗", "✗", "✓"],
          ],
          col_widths=[2.6, 0.8, 1.1, 1.3, 0.8])

    page_break(d)

    # ── 6. WORKFLOWS ────────────────────────────────────────────────────────
    h1(d, "6. Core Workflows")

    h3(d, "6.1 Buy-flow (escrow happy path)")
    numbered(d, [
        "Buyer opens listing detail → taps Buy Securely.",
        "Selects payment method (Chapa / Telebirr) → reCAPTCHA v3 token collected silently.",
        "Mobile calls escrow.initiate(listingId, paymentMethod). Convex validates, creates Turso escrow row "
        "(status = pending_payment), calls payment provider, returns checkout URL.",
        "Buyer completes payment → provider posts webhook to Convex HTTP action.",
        "Convex generates 6-digit code, bcrypt-hashes (cost 10), stores hash in Turso, plain code in Convex "
        "escrowCodes (TTL 10 min, buyer-readable only). Status → held. Buyer sees code + QR.",
        "Buyer chooses delivery window (default 48h, max 7d). countdown_expires_at = now + window. "
        "Convex scheduler.runAt(...) registered.",
        "Buyer hands code to seller at handover.",
        "Seller enters code → escrow.verify runs bcrypt.compare. Success → status = verified, payout scheduled.",
        "After settle window (Pro = 0h, free = 8h), Convex scheduled action sends payout via "
        "Telebirr/CBE/bank. Status → completed.",
        "Buyer receives review prompt; commission retained by platform wallet.",
    ])

    h3(d, "6.2 Buy-flow — edge cases")
    table(d,
          ["Scenario", "Behavior", "User-facing message"],
          [
              ["Payment webhook never fires", "Cron escrow.reconcile runs every 30 min; queries provider; "
               "reconciles to held or refunded.", "Order under review — funds will be held or refunded within 1 hour."],
              ["Buyer enters code into seller's UI", "verify rejects with 'permission_denied' — only seller "
               "of this deal may verify.", "Only the seller can verify the delivery code."],
              ["Seller enters wrong code 5 times in 10 min", "10-min lockout per (sellerId, dealId). Lockout "
               "counter persisted in Convex rateLimits.", "Too many wrong attempts. Try again in 10 minutes."],
              ["Countdown expires while seller is mid-entry", "verify rejects with 'deadline_exceeded' "
               "even if a transaction is in flight.", "Delivery window expired — refund issued to buyer."],
              ["Buyer raises dispute after seller already verified", "Rejected. Once verified, deal is final. "
               "Buyer must contact support → admin freeze.", "This deal is final. Contact support if you have an issue."],
              ["Network drop on buyer side after payment but before status sync", "Idempotent payment_tx_ref "
               "uniqueness in Turso prevents duplicate escrow rows.", "(silent retry succeeds)"],
              ["Seller updates payout account between init and payout", "Snapshot of payout_account at "
               "initiation is used. Update applies to future deals only.", "Payout uses the account active at purchase time."],
              ["Pro plan expires mid-deal", "Commission rate locked at initiation. Pro perks (0h settle) lock too.", "(no message)"],
          ],
          col_widths=[1.8, 2.7, 2.5])

    h3(d, "6.3 Verification workflow (Tier 1 → 2)")
    numbered(d, [
        "Seller taps Sell on FAB; system detects verification_tier < 2.",
        "Routes to verification screen. Seller uploads Fayda QR image + selfie (Cloudinary signed URL, 5-min TTL).",
        "Convex mutation verification.submit creates verification_requests row (status = pending).",
        "Admin reviews via /admin/verification queue. Approve or reject with note.",
        "On approve: users.verification_tier = 2, Cloudinary assets deleted, audit log written.",
        "On reject: same — assets deleted (no PII retention), seller can resubmit after 24h cool-off.",
    ])

    h3(d, "6.4 Pro upgrade workflow")
    numbered(d, [
        "User taps Upgrade in settings or via TikTok deep link bilustore://ref/<campaign>.",
        "Trial path (TikTok only, once per user lifetime): grants 7d Pro immediately, sets pro_trial_used = 1.",
        "Paid path: redirected to Chapa checkout for 299 ETB / 2,990 ETB.",
        "Chapa webhook → Convex pro.onChapaProPayment → updates Turso users.plan + plan_expires_at, "
        "syncs to Clerk publicMetadata.plan.",
        "Mobile app sees metadata change via Clerk hook → ThemeProvider crossfade (240 ms) to Pro skin.",
        "Daily cron pro.expirePlans downgrades expired Pros; listings beyond cap → ARCHIVED.",
    ])

    h3(d, "6.5 Admin moderation workflow")
    numbered(d, [
        "Admin signs in via Clerk on Next.js dashboard (web only).",
        "Live activity feed surfaces a suspicious user (e.g. 12 listings posted in 90s).",
        "Admin clicks user → sees last 100 actions, deal history, current verification tier.",
        "Picks action: Ban, Shadow Ban, Impersonate (15 min), Reset Tier, or Note.",
        "Each action requires step-up auth (re-enter Clerk password) before execution.",
        "Action writes to audit_logs; user's session terminated within 60s on Ban.",
    ])

    page_break(d)

    # ── 7. REPORTING REQUIREMENTS ───────────────────────────────────────────
    h1(d, "7. Reporting Requirements")

    h3(d, "7.1 Reports — what each role sees")
    table(d,
          ["Report", "Audience", "Refresh", "Metrics shown"],
          [
              ["Pulse", "Admin", "Live (Convex reactive)", "Top 50 listings by 24h Δ viral score; CTR; saves"],
              ["Ghost", "Admin", "Hourly", ">500 views & <5 clicks (price-too-high signal)"],
              ["Seller Health", "Admin", "Daily", "Trust score, refund rate, response time"],
              ["Disputes queue", "Admin", "Live", "Open disputes by age + amount"],
              ["Verification queue", "Admin", "Live", "Pending Fayda submissions, oldest first"],
              ["Audit log", "Admin", "Live", "All admin/system actions, filterable"],
              ["My Listings", "Seller", "Live", "Status, views, saves, viral score (own listings)"],
              ["My Deals", "Seller / Buyer", "Live", "Escrow status, countdown, payout date"],
              ["Profile views (Pro)", "Pro Seller", "Live", "Anonymous viewer city + device, 30d window"],
              ["My Audit", "All users", "Live", "Own actions; buyer 7d, seller 30d retention"],
          ],
          col_widths=[1.6, 1.4, 1.2, 2.8])

    h3(d, "7.2 Metric definitions (canonical)")
    table(d,
          ["Metric", "Formula"],
          [
              ["Viral Score", "(views×1 + clicks×5 + saves×8 + sales×20) / (hoursPosted+2)^1.5"],
              ["Trust Score", "fulfillment×0.5 + responseFactor×25 + reviewScore×25  (0–100)"],
              ["Fulfillment rate", "successful_sales / total_orders × 100"],
              ["Response time (hrs)", "avg(first_reply_ms) / 3.6e6"],
              ["CTR", "clicks / impressions"],
              ["Refund rate (30d)", "refunded_deals_30d / completed_or_refunded_deals_30d"],
              ["Pro conversion", "users_with_plan='pro' / users_with_lifetime ≥ 30d"],
              ["DAU / MAU", "distinct user_id with ≥1 user_activity event in window"],
          ],
          col_widths=[2.0, 4.5])

    # ── 8. ACCEPTANCE CRITERIA ──────────────────────────────────────────────
    h1(d, "8. Acceptance Criteria")
    para(d, "Every requirement listed below ships only when its checks pass on staging and once on prod.",
         italic=True, color=BRAND_PRIMARY, size=10)

    table(d,
          ["ID", "Requirement", "Acceptance Check"],
          [
              ["AC-AUTH-1", "Clerk Google sign-in", "Sign in with a fresh Google account → user row created in Turso, role=buyer, lands on home."],
              ["AC-AUTH-2", "Clerk Phone OTP via AfricasTalking", "Enter +2519… → SMS arrives ≤ 30s → 6-digit code authenticates."],
              ["AC-AUTH-3", "Step-up auth on payout change", "Without recent re-auth, payout.update returns 'reauth_required'."],
              ["AC-ESC-1", "Bcrypt-hashed code in Turso", "Inspect token_hash — starts with $2b$10$, length 60. Plain code never present."],
              ["AC-ESC-2", "Server countdown drives refund", "Pay deal with 60s window → 60s after expiry, status = refunded automatically."],
              ["AC-ESC-3", "5-fail lockout", "Submit 5 wrong codes → 6th rejected for 10 min."],
              ["AC-ESC-4", "Commission rate table", "Deal at 400 ETB → commission = 20 ETB (5%); deal at 6,000 ETB → 150 ETB (2.5%); Pro seller deal at 6,000 → 90 ETB (1.5%)."],
              ["AC-INTEL-1", "Viral score recompute", "20 view events on a listing → viral score increases ≤ 60s later."],
              ["AC-INTEL-2", "Trust score nightly", "Cron run produces seller_trust row for every user with ≥ 1 review."],
              ["AC-INTEL-3", "3-partial-view suppression", "Scroll past a listing 3× without click → that listing absent or down-ranked from next feed query."],
              ["AC-PRO-1", "Theme swap on plan flip", "Toggle plan in test → mobile theme swaps within one session refresh, ≤ 240 ms transition."],
              ["AC-PRO-2", "Free user listing cap", "Free seller posts 6th listing → blocked with 'Upgrade to Pro' CTA."],
              ["AC-ADMIN-1", "Ban revokes session", "Ban a logged-in user → their next API call within 60s returns 'banned'."],
              ["AC-ADMIN-2", "Audit log immutable", "Attempt UPDATE / DELETE on audit_logs → fails (no code path exists; CI lint forbids it)."],
              ["AC-SEC-1", "reCAPTCHA enforced", "Post listing without captcha token → 'captcha_failed'."],
              ["AC-SEC-2", "PII-free Sentry", "Sample crash with email in payload → Sentry event has email scrubbed."],
              ["AC-PERF-1", "Cold-start TTI", "Pixel 6a release build → home feed interactive within 2.0s p95."],
              ["AC-MIG-1", "Firestore→Turso parity", "Reconciliation script reports 100% row count match (or documented exceptions)."],
          ],
          col_widths=[1.0, 2.6, 3.0])

    page_break(d)

    # ── 9. DEPENDENCIES & RISKS ─────────────────────────────────────────────
    h1(d, "9. Dependencies & Risks")

    h3(d, "9.1 External dependencies")
    table(d,
          ["Dep", "Used for", "Owner", "Mitigation if down"],
          [
              ["Clerk", "Auth, user sessions", "Vendor", "Cached session tokens 24h; degraded sign-up only."],
              ["Convex", "Functions + reactive DB", "Vendor", "Read-only mode using last-known Turso snapshot."],
              ["Turso", "Durable storage", "Vendor", "1 read replica; nightly snapshot to S3-compatible store."],
              ["Cloudinary", "Image storage (preserved)", "Vendor", "Read-through CDN cache; uploads queue locally."],
              ["Chapa", "Payments", "Vendor", "Telebirr fallback offered automatically."],
              ["Telebirr", "Payments", "Vendor", "Chapa fallback offered automatically."],
              ["AfricasTalking", "Phone OTP SMS", "Vendor", "Fall back to Email OTP for sign-in."],
              ["AdMob", "Ads (free users)", "Vendor", "If down, hide ad slots silently — no error UI."],
              ["Sentry", "Crash + perf telemetry", "Vendor", "Local buffer; no impact on user."],
              ["Google reCAPTCHA v3", "Bot defense", "Vendor", "If service errors, default to allow + log warning."],
          ],
          col_widths=[1.1, 1.6, 0.8, 3.2])

    h3(d, "9.2 Risk register")
    table(d,
          ["ID", "Risk", "Likelihood", "Impact", "Mitigation", "Owner"],
          [
              ["R-1", "Committed Firebase admin key (already in repo) abused", "Medium", "Critical", "Purge with git-filter-repo + rotate key in P11.", "Eng Lead"],
              ["R-2", "Convex free tier exceeded mid-month", "Medium", "High", "Activity logs batched, rate limits, $0-cap alerts at 70%.", "Eng"],
              ["R-3", "Bcrypt cost 10 too slow at scale", "Low", "Medium", "Load-test in P12; if p95 > 400ms, drop to cost 9.", "Eng"],
              ["R-4", "Chapa lacks recurring billing → churn risk", "Medium", "Medium", "Self-managed renewal cron; reminder push 3d before expiry.", "PM"],
              ["R-5", "AfricasTalking SMS deliverability in rural areas", "Medium", "Medium", "Email-OTP fallback always offered.", "PM"],
              ["R-6", "Migration data loss in Firestore→Turso", "Low", "Critical", "Read-only Firestore export retained 30d; reconciliation gate before cut-over.", "Eng Lead"],
              ["R-7", "Pro adoption below 4% target", "Medium", "High", "Trial via TikTok; ghost-mode + ad-free as primary hooks; A/B price.", "Growth"],
              ["R-8", "Fayda manual review backlog", "High", "Medium", "Two trained reviewers; SLA 24h; auto-rejection if image unreadable.", "Ops"],
              ["R-9", "Bcrypt-changed escrow strands in-flight Firebase deals", "High", "Medium", "Pre-cutover migration freezes all in-flight deals → admin manual close.", "Eng Lead"],
              ["R-10", "AdMob policy violation suspends account", "Low", "High", "GDPR-style consent flow; family-safe ad filters on.", "Eng"],
          ],
          col_widths=[0.5, 2.4, 0.8, 0.7, 2.5, 0.6])

    page_break(d)

    # ── 10. OPEN QUESTIONS LOG ──────────────────────────────────────────────
    h1(d, "10. Open Questions Log")
    para(d, "Status updated weekly. An open question marked Blocking holds the next phase from starting.",
         italic=True, color=WARNING, size=10)

    table(d,
          ["ID", "Question", "Owner", "Status", "Due", "Blocks"],
          [
              ["Q-1", "AfricasTalking account ownership + credentials", "Founder", "Open", "2026-04-22", "P3"],
              ["Q-2", "Fayda API timeline — interim manual review acceptable?", "Founder", "Open", "2026-04-25", "P8"],
              ["Q-3", "Chapa recurring billing — native or self-managed?", "Founder + Eng", "Open", "2026-04-23", "P9"],
              ["Q-4", "Algolia free-tier limits sufficient for projection?", "Eng", "Open", "2026-04-30", "P5"],
              ["Q-5", "Vercel hosting plan + custom admin subdomain", "Founder", "Open", "2026-05-05", "P8"],
              ["Q-6", "Pro pricing 299/2,990 ETB — confirm w/ market test", "Growth", "Open", "2026-05-15", "P9"],
              ["Q-7", "Country expansion plan (Kenya / Uganda) — does schema need multi-currency?", "Founder", "Open", "2026-06-01", "v3"],
              ["Q-8", "Disputed deal resolution SLA + commission policy on refunds", "Ops", "Open", "2026-04-25", "P6"],
              ["Q-9", "Push notification tokens — keep in Turso or Convex?", "Eng", "Open", "2026-04-20", "P3"],
              ["Q-10", "Web app — public browse only, or also escrow buy-flow?", "Founder", "Open", "2026-04-25", "P8"],
          ],
          col_widths=[0.4, 3.0, 1.1, 0.7, 0.9, 0.5])

    # ── 11. DECISION LOG ────────────────────────────────────────────────────
    h1(d, "11. Decision Log")
    para(d, "Material decisions made and the alternatives rejected.", italic=True, size=10)

    table(d,
          ["#", "Decision", "Alternatives considered", "Why this won", "Date"],
          [
              ["D-1", "Convex + Turso (split reactive vs durable)", "Single Firestore (status quo); Supabase; Postgres + Pusher",
               "Convex gives transactional mutations + reactivity for free; Turso gives SQL + low cost. "
               "Single Firestore would not scale economically.", "2026-04-12"],
              ["D-2", "Clerk (replace Firebase Auth)", "Auth.js; Supabase Auth; Stay on Firebase Auth",
               "Built-in impersonation, bot detection, breached-password check, organizations primitive. "
               "Phone OTP via webhook keeps AfricasTalking pluggable.", "2026-04-12"],
              ["D-3", "Bcrypt over SHA-256 for delivery code", "SHA-256 (current); Argon2; HMAC w/ pepper",
               "Argon2 is overkill for 6-digit codes (already low entropy); SHA-256 is brute-forceable in ms. "
               "Bcrypt cost-10 with rate limiting + 5-fail lockout is sufficient.", "2026-04-13"],
              ["D-4", "Cloudinary preserved (not R2)", "Migrate to Cloudflare R2 per original PRP",
               "Cloudinary already produces transformed URLs the app depends on. R2 would require rewriting "
               "MediaService and a separate transformation service. Not worth the work this release.", "2026-04-13"],
              ["D-5", "Server-authoritative countdown via Convex scheduler", "Client-driven countdown w/ server check on submit",
               "Client clocks lie, devices sleep, refunds must be deterministic.", "2026-04-13"],
              ["D-6", "Nightly trust score (not real-time)", "Real-time recompute on every event",
               "Trust score is slow-moving; nightly cron uses 1/100th the compute.", "2026-04-14"],
              ["D-7", "Admin web only, no mobile admin", "Mobile admin tab with role-gating",
               "Reduces attack surface; admin actions need careful keyboard input (notes, dispute resolution).", "2026-04-14"],
              ["D-8", "Commission tiered, not flat", "Existing flat 9.5%; flat 5%; flat 2.5%",
               "Cheap items punished by high % → marketplace dies at low end. Tiered keeps low-end alive while "
               "preserving margin on high-ticket.", "2026-04-15"],
              ["D-9", "FlashList for all data lists", "Stay on FlatList; bun migrate later",
               "Memory wins are immediate; the migration is mechanical.", "2026-04-15"],
              ["D-10", "Reviews must reference a completed deal", "Allow free-form reviews (status quo)",
               "Eliminates fake reviews; aligns trust score signal with transaction reality.", "2026-04-16"],
          ],
          col_widths=[0.4, 1.6, 1.7, 2.7, 0.7])

    # ── 12. APPENDIX ────────────────────────────────────────────────────────
    h1(d, "12. Appendix")
    h3(d, "12.1 Glossary")
    table(d,
          ["Term", "Meaning"],
          [
              ["Escrow deal", "A purchase where funds are held by the platform until buyer-issued code is verified by seller."],
              ["Delivery code", "6-digit number generated by the system, given to the buyer, handed to the seller at handover."],
              ["Held / Verified / Completed / Refunded / Disputed", "Lifecycle states of an escrow deal."],
              ["Viral score", "Per-listing engagement signal driving feed and search ranking."],
              ["Trust score", "Per-seller composite (fulfillment, response time, weighted reviews) on 0–100."],
              ["Fayda", "Ethiopian national digital ID; QR upload is the Tier-2 verification artifact."],
              ["Pro", "Paid tier (299 ETB/mo or 2,990 ETB/yr) granting ad-free, ghost mode, etc."],
              ["Ghost mode", "Pro feature: user's profile and listing views are hidden from the viewed party."],
              ["Pulse / Ghost (admin)", "Two distinct admin reports — Pulse = trending; Ghost = high-views/low-clicks."],
              ["Step-up auth", "Force a re-authentication within last 5 min before sensitive action."],
          ],
          col_widths=[1.7, 4.8])

    h3(d, "12.2 Document control")
    kv_table(d, [
        ["Document ID", "BS-PRD-002"],
        ["Supersedes", "prp.md (BS-PRP-001, v1.0)"],
        ["Authors", "Engineering"],
        ["Approvers", "Founder, Eng Lead, PM, Ops Lead"],
        ["Review cadence", "Weekly during P0–P12; monthly thereafter"],
        ["Next review", "2026-04-24"],
        ["Companion docs", "DESIGN.docx, SYSTEM.docx, IMPLEMENTATION_PLAN.docx"],
    ])

    d.save(out_path)
    print(f"PRD.docx written: {out_path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "PRD.docx"
    build(out)
