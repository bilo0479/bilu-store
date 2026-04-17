"""Build SYSTEM.docx — 10/10 standard."""
from helpers import (
    new_doc, cover, h1, h2, h3, para, bullets, numbered, table, kv_table,
    code_block, callout, page_break, BRAND_PRIMARY, WARNING, DANGER, SUCCESS
)


def build(out_path):
    d = new_doc()

    cover(
        d,
        title="System Architecture & Data Specification",
        subtitle="Bilu Store v2 backbone — Convex + Turso + Clerk, end-to-end TypeScript safety, "
                 "bcrypt-only escrow, and an audit log nothing can edit.",
        version="2.0",
        status="Pending Approval"
    )

    # ── 1. ARCHITECTURE OVERVIEW ────────────────────────────────────────────
    h1(d, "1. Architecture Overview")

    h3(d, "1.1 Stack (current and authoritative)")
    table(d,
          ["Layer", "Technology", "Tier / Limit", "Why"],
          [
              ["Auth", "Clerk", "10k MAU free", "Built-in impersonation, bot detection, breached-password, organizations"],
              ["Functions / Reactive DB", "Convex", "1M function calls/mo, 8 GB egress", "Transactional mutations + reactive queries in one runtime"],
              ["Durable DB", "Turso (libSQL)", "9 GB storage, 1B row reads/mo, 25M writes/mo", "SQL + indexes + replication; canonical for non-reactive data"],
              ["Image storage", "Cloudinary (preserved)", "Existing free plan", "Read-only reference; do not modify"],
              ["Search", "Convex full-text → Algolia (Phase 2)", "Convex inclusive; Algolia free 10k records", "Single entrypoint with swappable engine"],
              ["Payments", "Chapa + Telebirr OpenAPI", "Per-tx fees only", "Local Ethiopian rails; both supported for redundancy"],
              ["Push", "expo-notifications + Convex action", "Free", "Cross-platform; integrates with Expo build pipeline"],
              ["Monitoring", "Sentry", "5k events/mo free", "Mobile + Convex node SDK; PII-scrubbing pipeline"],
              ["Captcha", "Google reCAPTCHA v3", "1M assessments/mo free", "Score-based; invisible to user"],
              ["Mobile UI", "Expo SDK 54 + React Native 0.81 + NativeWind", "—", "Tailwind ergonomics on RN; shared tokens with admin web"],
              ["Admin web", "Next.js 14 (App Router) + Shadcn/ui + Tremor", "Vercel free tier", "Server-rendered, instant deploys, Convex-native"],
          ],
          col_widths=[1.5, 2.0, 1.6, 1.4])

    h3(d, "1.2 System diagram")
    code_block(d,
"""             ┌─────────────┐                            ┌──────────────┐
             │  Mobile     │                            │  Admin Web   │
             │  (Expo)     │                            │  (Next.js)   │
             └──────┬──────┘                            └──────┬───────┘
                    │  Clerk session token                      │
                    ▼                                           ▼
             ┌─────────────────────────────────────────────────────────┐
             │                 Convex (functions + reactive DB)        │
             │  · queries     · mutations (transactional)              │
             │  · actions     · scheduler  · http endpoints  · crons   │
             └──────┬──────────────────────────────────────────┬───────┘
                    │                                           │
       ┌────────────┼─────────────┬───────────────┬─────────────┤
       ▼            ▼             ▼               ▼             ▼
   ┌───────┐  ┌──────────┐  ┌──────────┐    ┌──────────┐  ┌──────────┐
   │ Turso │  │ Cloudin. │  │ Chapa /  │    │ AfricasT │  │ Sentry / │
   │libSQL │  │ (R/O)    │  │ Telebirr │    │  / SMS   │  │ reCAPTCHA│
   └───────┘  └──────────┘  └──────────┘    └──────────┘  └──────────┘""")

    h3(d, "1.3 Why two databases")
    table(d,
          ["DB", "Role", "Reasoning"],
          [
              ["Convex", "Reactive, ephemeral, transactional",
               "Chat, activity feed, 10-min plain OTPs, escrow countdowns (scheduler), live admin queries"],
              ["Turso", "Durable, queryable, SQL-first",
               "Listings, users, reviews, audit logs, trust-score aggregates, pro subscriptions — needs SQL joins + indexes"],
          ],
          col_widths=[1.0, 1.6, 4.0])

    callout(d, "Rule of thumb",
            "Writes that must never be lost → Turso. State the UI subscribes to → Convex. "
            "Both for entities like listings: Turso canonical, Convex mirror updated in the same mutation.")

    page_break(d)

    # ── 2. DATABASE SCHEMA ──────────────────────────────────────────────────
    h1(d, "2. Database Schema (Turso)")
    para(d, "Normalized to 3NF unless noted. Money stored as integer cents (avoids float drift). "
            "Timestamps as INTEGER epoch-ms.", italic=True, size=10)

    h3(d, "2.1 users")
    code_block(d,
"""CREATE TABLE users (
  id                    TEXT PRIMARY KEY,                  -- Clerk user ID
  email                 TEXT,
  phone                 TEXT,
  name                  TEXT NOT NULL,
  avatar_url            TEXT,
  city                  TEXT,
  lat                   REAL,
  lng                   REAL,
  role                  TEXT NOT NULL DEFAULT 'buyer'
                        CHECK (role IN ('buyer','seller','admin')),
  plan                  TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free','pro')),
  plan_expires_at       INTEGER,
  pro_trial_used        INTEGER NOT NULL DEFAULT 0,
  verification_tier     INTEGER NOT NULL DEFAULT 1
                        CHECK (verification_tier IN (1,2,3)),
  seller_trust_score    REAL NOT NULL DEFAULT 50.0,
  visibility_score      REAL NOT NULL DEFAULT 1.0,         -- 0 = shadow-banned
  banned                INTEGER NOT NULL DEFAULT 0,
  payout_account_json   TEXT,                              -- encrypted JSON
  created_at            INTEGER NOT NULL,
  last_login_at         INTEGER NOT NULL
);
CREATE INDEX idx_users_role  ON users(role);
CREATE INDEX idx_users_plan  ON users(plan, plan_expires_at);
CREATE INDEX idx_users_trust ON users(seller_trust_score DESC);
CREATE INDEX idx_users_city  ON users(city);""")
    para(d, "Rationale: PK = Clerk ID keeps mapping trivial. payout_account_json is encrypted at the "
            "application layer (libsodium secretbox) — Turso sees ciphertext only.", size=10, italic=True)

    h3(d, "2.2 listings")
    code_block(d,
"""CREATE TABLE listings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id       TEXT NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  subcategory     TEXT,
  price           INTEGER NOT NULL,                          -- cents (ETB × 100)
  currency        TEXT NOT NULL DEFAULT 'ETB',
  condition       TEXT CHECK (condition IN ('NEW','LIKE_NEW','USED_GOOD','USED_FAIR')),
  negotiable      INTEGER NOT NULL DEFAULT 1,
  contact_pref    TEXT NOT NULL DEFAULT 'CHAT_ONLY',
  location_city   TEXT NOT NULL,
  lat             REAL,
  lng             REAL,
  images_json     TEXT NOT NULL,                             -- JSON array (Cloudinary URLs)
  thumbnails_json TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
                  CHECK (status IN ('DRAFT','PENDING_REVIEW','ACTIVE','SOLD',
                                    'EXPIRED','REJECTED','REMOVED','ARCHIVED')),
  rejection_reason TEXT,
  is_premium      INTEGER NOT NULL DEFAULT 0,
  premium_tier    TEXT,
  view_count      INTEGER NOT NULL DEFAULT 0,
  click_count     INTEGER NOT NULL DEFAULT 0,
  save_count      INTEGER NOT NULL DEFAULT 0,
  sale_count      INTEGER NOT NULL DEFAULT 0,
  viral_score     REAL NOT NULL DEFAULT 0.0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL
);
CREATE INDEX idx_listings_status_cat       ON listings(status, category);
CREATE INDEX idx_listings_status_price     ON listings(status, price);
CREATE INDEX idx_listings_status_location  ON listings(status, location_city);
CREATE INDEX idx_listings_viral            ON listings(viral_score DESC);
CREATE INDEX idx_listings_created          ON listings(created_at DESC);
CREATE INDEX idx_listings_seller           ON listings(seller_id, status);
CREATE INDEX idx_listings_expiry           ON listings(expires_at) WHERE status = 'ACTIVE';""")
    para(d, "Rationale: image arrays denormalized as JSON (acceptable read-heavy data); composite indexes "
            "match the actual query shapes (status+category, status+price, status+city). Partial index on "
            "expires_at limits cron scan cost.", size=10, italic=True)

    h3(d, "2.3 escrow_deals")
    code_block(d,
"""CREATE TABLE escrow_deals (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id              INTEGER NOT NULL REFERENCES listings(id),
  buyer_id                TEXT NOT NULL REFERENCES users(id),
  seller_id               TEXT NOT NULL REFERENCES users(id),
  amount                  INTEGER NOT NULL,                  -- cents
  commission_amount       INTEGER NOT NULL,                  -- cents (computed at init)
  payout_amount           INTEGER NOT NULL,                  -- amount - commission
  currency                TEXT NOT NULL DEFAULT 'ETB',
  payment_method          TEXT NOT NULL CHECK (payment_method IN ('CHAPA','TELEBIRR')),
  payment_tx_ref          TEXT NOT NULL UNIQUE,
  token_hash              TEXT,                              -- bcrypt(code, cost=10)
  status                  TEXT NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN ('pending_payment','held','verified',
                                            'completed','refunded','disputed')),
  countdown_expires_at    INTEGER,
  verified_at             INTEGER,
  payout_release_at       INTEGER,
  completed_at            INTEGER,
  refunded_at             INTEGER,
  disputed_at             INTEGER,
  dispute_reason          TEXT,
  dispute_resolution      TEXT,
  failed_verify_count     INTEGER NOT NULL DEFAULT 0,
  payout_account_snapshot TEXT NOT NULL,                     -- encrypted JSON
  created_at              INTEGER NOT NULL
);
CREATE INDEX idx_escrow_status_buyer   ON escrow_deals(status, buyer_id);
CREATE INDEX idx_escrow_status_seller  ON escrow_deals(status, seller_id);
CREATE INDEX idx_escrow_countdown      ON escrow_deals(countdown_expires_at)
  WHERE status = 'held';
CREATE INDEX idx_escrow_payout_release ON escrow_deals(payout_release_at)
  WHERE status = 'verified';""")
    callout(d, "Critical invariant",
            "token_hash is the only place a delivery code may persist in Turso. The plain code lives in "
            "Convex escrowCodes for ≤ 10 minutes, readable only by buyer_id == ctx.auth.userId.",
            color=DANGER)

    h3(d, "2.4 reviews, seller_trust, user_activity, audit_logs, verification_requests, favorites, reports")
    code_block(d,
"""CREATE TABLE reviews (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id           INTEGER NOT NULL UNIQUE REFERENCES escrow_deals(id),
  reviewer_id       TEXT NOT NULL REFERENCES users(id),
  seller_id         TEXT NOT NULL REFERENCES users(id),
  rating            INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  verified_purchase INTEGER NOT NULL DEFAULT 1,
  created_at        INTEGER NOT NULL
);
CREATE INDEX idx_reviews_seller ON reviews(seller_id, created_at DESC);

CREATE TABLE seller_trust (
  seller_id        TEXT PRIMARY KEY REFERENCES users(id),
  fulfillment_rate REAL NOT NULL,
  response_hrs     REAL NOT NULL,
  weighted_rating  REAL NOT NULL,
  trust_score      REAL NOT NULL,
  computed_at      INTEGER NOT NULL
);

CREATE TABLE user_activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id),
  verb        TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id   TEXT NOT NULL,
  category    TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_activity_created ON user_activity(created_at DESC);
CREATE INDEX idx_activity_user    ON user_activity(user_id, created_at DESC);

CREATE TABLE audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    TEXT,                                         -- JSON
  ip_hash     TEXT,                                         -- SHA-256 of IP
  user_agent  TEXT,
  timestamp   INTEGER NOT NULL
);
CREATE INDEX idx_audit_actor  ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id, timestamp DESC);

CREATE TABLE verification_requests (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           TEXT NOT NULL REFERENCES users(id),
  target_tier       INTEGER NOT NULL CHECK (target_tier IN (2,3)),
  fayda_url         TEXT,
  selfie_url        TEXT,
  trade_license_url TEXT,
  tin               TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  admin_id          TEXT,
  admin_note        TEXT,
  submitted_at      INTEGER NOT NULL,
  reviewed_at       INTEGER
);
CREATE INDEX idx_verif_status ON verification_requests(status, submitted_at);

CREATE TABLE favorites (
  user_id    TEXT NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX idx_fav_user ON favorites(user_id, created_at DESC);

CREATE TABLE reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('listing','user')),
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'PENDING'
              CHECK (status IN ('PENDING','RESOLVED','DISMISSED')),
  admin_note  TEXT,
  created_at  INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);""")

    h3(d, "2.5 Normalization rationale")
    table(d,
          ["Choice", "Reason"],
          [
              ["Money as INTEGER cents", "Eliminates float drift on commission math; SQL still sums cleanly."],
              ["images_json on listings (denormalized)", "Image arrays are read-heavy, write-rare, never queried by content. JSON column is the simplest correct choice."],
              ["payout_account_json (encrypted)", "Stored as encrypted blob; never queried. Avoids a trivial 1:1 table that would only add joins."],
              ["seller_trust as separate table", "Computed nightly; isolates volatility from users table writes."],
              ["audit_logs.ip_hash, not raw IP", "PII-minimization. Hash still allows rate-limit forensics."],
              ["verification_requests not merged into users", "Each submission is an event with its own lifecycle; user can have multiple over time."],
              ["favorites composite PK (user_id, listing_id)", "Prevents duplicate rows; natural key is the relationship itself."],
          ],
          col_widths=[2.4, 4.1])

    page_break(d)

    # ── 3. CONVEX SCHEMA ────────────────────────────────────────────────────
    h1(d, "3. Convex Schema")
    para(d, "Convex mirrors the subset of Turso tables that benefit from reactive queries. Mirror writes "
            "happen inside the same Convex mutation that writes Turso — so the typed data-access module "
            "convex/turso.ts is the only write path and consistency is automatic.", size=10, italic=True)

    code_block(d,
"""// convex/schema.ts (excerpt)
listings: defineTable({
  tursoId: v.number(),
  sellerId: v.string(),
  title: v.string(),
  category: v.string(),
  price: v.number(),
  images: v.array(v.string()),
  locationCity: v.string(),
  status: v.union(...),
  viralScore: v.number(),
  isPro: v.boolean(),
  createdAt: v.number(),
  expiresAt: v.number(),
})
  .index("by_status_category", ["status", "category"])
  .index("by_status_viral",    ["status", "viralScore"])
  .index("by_seller",          ["sellerId"])
  .searchIndex("search_title", { searchField: "title",
                                  filterFields: ["status","category","locationCity"] }),

escrowCodes: defineTable({
  dealId:    v.number(),
  buyerId:   v.string(),
  code:      v.string(),     // plain 6-digit, ≤ 10 min TTL
  expiresAt: v.number(),
}).index("by_buyer_deal", ["buyerId","dealId"]),

conversations / messages   // chat lives entirely in Convex (no Turso copy)
userActivity               // streamed live to admin
listingSuppressions        // 3-partial-view suppression
rateLimits / partialViews  // per-user counters""")

    page_break(d)

    # ── 4. AUDIT LOG SPECIFICATION ──────────────────────────────────────────
    h1(d, "4. Audit Log Specification")

    h3(d, "4.1 What is logged")
    table(d,
          ["Action key", "Actor", "Triggered by", "Target", "Required metadata"],
          [
              ["auth.signin", "user", "Clerk webhook session.created", "self", "{ provider, ip_hash, ua }"],
              ["auth.signout", "user", "Clerk webhook session.ended", "self", "{ duration_ms }"],
              ["listing.create", "seller", "listings.create mutation", "listing", "{ title, price }"],
              ["listing.update", "seller", "listings.update mutation", "listing", "{ diff }"],
              ["listing.delete", "system|admin", "listings.softDelete", "listing", "{ reason }"],
              ["escrow.initiate", "buyer", "escrow.initiate mutation", "deal", "{ amount, method }"],
              ["escrow.payment_confirmed", "system", "provider webhook", "deal", "{ provider, tx_ref }"],
              ["escrow.verify", "seller", "escrow.verify mutation", "deal", "{ payout_release_at }"],
              ["escrow.verify_fail", "seller", "escrow.verify mutation", "deal", "{ attempt }"],
              ["escrow.dispute", "buyer", "escrow.dispute mutation", "deal", "{ reason }"],
              ["escrow.auto_refund", "system", "scheduler onCountdownExpiry", "deal", "{}"],
              ["escrow.payout", "system", "scheduler releasePayout", "deal", "{ amount }"],
              ["pro.subscribe", "user", "pro.onChapaProPayment", "self", "{ plan_period }"],
              ["pro.expire", "system", "cron pro.expirePlans", "self", "{}"],
              ["verification.submit", "seller", "verification.submit", "self", "{ target_tier }"],
              ["verification.review", "admin", "verification.review", "user", "{ decision, note }"],
              ["admin.ban", "admin", "admin.banUser", "user", "{ reason }"],
              ["admin.shadow_ban", "admin", "admin.shadowBan", "user", "{ reason }"],
              ["admin.impersonate.start", "admin", "admin.impersonate", "user", "{ duration_min }"],
              ["admin.impersonate.end", "admin|system", "session end / timeout", "user", "{}"],
              ["admin.deal_freeze", "admin", "admin.freezeDeal", "deal", "{ reason }"],
              ["admin.role_change", "admin", "adminTools.setRole", "user", "{ from, to }"],
          ],
          col_widths=[1.6, 0.7, 1.5, 0.7, 2.0])

    h3(d, "4.2 Log entry format")
    code_block(d,
"""{
  id:          number,           // autoincrement
  actor_id:    string,           // user ID or 'system'
  action:      string,           // dot-namespaced verb (see 4.1)
  target_type: 'user'|'listing'|'deal'|'self'|null,
  target_id:   string|null,
  metadata:    string,           // JSON (≤ 4 KB), action-specific
  ip_hash:     string|null,      // SHA-256(ip), enables rate-limit forensics
  user_agent:  string|null,      // truncated to 200 chars
  timestamp:   number            // epoch ms
}""")

    h3(d, "4.3 Retention & immutability")
    bullets(d, [
        "Retention: indefinite for security/admin actions; 18 months for routine user actions "
        "(soft-deleted via partition swap, not row delete).",
        "Immutability: no UPDATE / DELETE code path exists. ESLint rule forbids the strings "
        "\"UPDATE audit_logs\" and \"DELETE FROM audit_logs\".",
        "Storage: same Turso DB (free-tier comfortable at 10k actions/day = 1.8 GB / 18 mo).",
        "Access: admins read all; sellers read own (last 30d); buyers read own (last 7d).",
        "Export: admin can export filtered slice as CSV; export action is itself audit-logged.",
        "Quarterly snapshot to encrypted S3-compatible bucket for compliance + DR.",
    ])

    h3(d, "4.4 PII handling in audit metadata")
    bullets(d, [
        "No raw IP, no email, no phone, no Fayda number, no payment card details in metadata.",
        "Only hashed IP, dealId, listingId, anonymized identifiers.",
        "Sentry beforeSend() applies the same scrubbing rules to crash reports.",
    ])

    page_break(d)

    # ── 5. API CONTRACTS ────────────────────────────────────────────────────
    h1(d, "5. API Contracts")
    para(d, "All endpoints are Convex queries / mutations / actions / HTTP actions. Function names below "
            "are the wire identifiers used by useQuery / useMutation on the client. Every function returns "
            "either a typed success payload or throws a ConvexError with a stable error code.", size=10, italic=True)

    h3(d, "5.1 Auth & profile")
    table(d,
          ["Function", "Kind", "Args", "Returns", "Errors"],
          [
              ["users.me", "query", "—", "User", "unauthorized"],
              ["users.updateProfile", "mutation", "{ name?, avatar_url?, city? }", "User", "validation_error"],
              ["users.byId", "query", "{ userId }", "User | null", "—"],
              ["users.savePayoutAccount", "mutation", "{ payoutAccount }", "void", "reauth_required, validation_error"],
          ],
          col_widths=[2.0, 0.7, 2.0, 1.0, 1.4])

    h3(d, "5.2 Listings")
    table(d,
          ["Function", "Kind", "Args", "Returns"],
          [
              ["listings.feed", "query", "{ cursor?, limit }", "Page<Listing>"],
              ["listings.byCategory", "query", "{ category, cursor?, filters? }", "Page<Listing>"],
              ["listings.byId", "query", "{ id }", "Listing | null"],
              ["listings.create", "mutation", "{ input, captchaToken }", "{ id }"],
              ["listings.update", "mutation", "{ id, input }", "Listing"],
              ["listings.softDelete", "mutation", "{ id, reason }", "void"],
              ["listings.relist", "mutation", "{ id }", "Listing  // pro-only single-tap"],
          ],
          col_widths=[2.0, 0.7, 2.5, 1.5])

    h3(d, "5.3 Escrow")
    table(d,
          ["Function", "Kind", "Args", "Returns", "Errors"],
          [
              ["escrow.initiate", "mutation", "{ listingId, paymentMethod, captchaToken }",
               "{ dealId, checkoutUrl, amount }", "captcha_failed, listing_unavailable, no_payout_account"],
              ["escrow.byId", "query", "{ dealId }", "Deal", "permission_denied, not_found"],
              ["escrow.myCode", "query", "{ dealId }", "{ code, expiresAt }", "expired, not_buyer"],
              ["escrow.verify", "mutation", "{ dealId, code }", "{ payoutReleaseAt }",
               "permission_denied, invalid_code, locked_out, deadline_exceeded"],
              ["escrow.dispute", "mutation", "{ dealId, reason }", "void", "deal_finalized"],
              ["escrow.list", "query", "{ side: 'buyer'|'seller', cursor? }", "Page<Deal>", "—"],
              ["escrow.onPaymentConfirmed", "httpAction (Chapa/Telebirr)", "provider payload",
               "200 OK", "signature_invalid, duplicate"],
              ["escrow.onCountdownExpiry", "internal scheduler", "{ dealId }", "void", "—"],
              ["escrow.releasePayout", "internal scheduler", "{ dealId }", "void", "payout_failed"],
          ],
          col_widths=[2.0, 1.2, 1.7, 1.4, 1.4])

    h3(d, "5.4 Intelligence & search")
    table(d,
          ["Function", "Kind", "Args", "Returns"],
          [
              ["intel.recordInteraction", "mutation", "{ listingId, verb }", "void"],
              ["intel.partialView", "mutation", "{ listingId }", "void"],
              ["intel.rebuildTrustScores", "internal cron", "—", "void"],
              ["search.search", "action", "{ query, filters }", "Page<Listing>"],
              ["search.suggest", "action", "{ prefix }", "string[]"],
          ],
          col_widths=[2.0, 1.0, 2.0, 1.5])

    h3(d, "5.5 Pro & monetization")
    table(d,
          ["Function", "Kind", "Args", "Returns"],
          [
              ["pro.startCheckout", "mutation", "{ period: 'monthly'|'yearly' }", "{ checkoutUrl }"],
              ["pro.startTrial", "mutation", "{ campaignId }", "void"],
              ["pro.onChapaProPayment", "httpAction", "Chapa payload", "200 OK"],
              ["pro.expirePlans", "internal cron", "—", "void"],
          ],
          col_widths=[2.0, 1.0, 2.0, 1.5])

    h3(d, "5.6 Admin")
    table(d,
          ["Function", "Kind", "Args", "Returns"],
          [
              ["admin.activityFeed", "query", "{ cursor? }", "Page<Activity>"],
              ["admin.banUser", "mutation", "{ userId, reason }", "void"],
              ["admin.shadowBan", "mutation", "{ userId, reason }", "void"],
              ["admin.impersonate", "mutation", "{ userId }", "{ tokenUrl }"],
              ["admin.freezeDeal", "mutation", "{ dealId, reason }", "void"],
              ["admin.resolveDispute", "mutation", "{ dealId, decision, note }", "void"],
              ["admin.reviewVerification", "mutation", "{ requestId, decision, note }", "void"],
              ["admin.setRole", "mutation", "{ userId, role }", "void"],
              ["admin.auditLog", "query", "{ actorId?, action?, cursor? }", "Page<AuditEntry>"],
          ],
          col_widths=[2.0, 1.0, 2.0, 1.5])

    h3(d, "5.7 Standard error codes")
    table(d,
          ["Code", "HTTP analog", "Meaning"],
          [
              ["unauthorized", "401", "ctx.auth missing / expired"],
              ["forbidden", "403", "Authorized but lacks permission for this resource"],
              ["validation_error", "400", "args failed v.* validation; payload includes which field"],
              ["captcha_failed", "403", "reCAPTCHA score < 0.5 or token invalid"],
              ["reauth_required", "401", "Step-up required (not within last 5 min)"],
              ["rate_limited", "429", "Per-key limit exceeded; payload includes retryAfter"],
              ["locked_out", "423", "Sensitive action lockout (e.g. 5-fail escrow verify)"],
              ["not_found", "404", "Target id does not exist"],
              ["permission_denied", "403", "Authenticated but not the buyer/seller of this deal"],
              ["deadline_exceeded", "410", "Time-bounded action attempted past its deadline"],
              ["already_resolved", "409", "Idempotency: this action already happened"],
              ["payout_failed", "502", "Provider rejected payout; retried by scheduler"],
              ["banned", "403", "Caller is banned"],
          ],
          col_widths=[1.5, 1.0, 4.0])

    page_break(d)

    # ── 6. SECURITY & AUTH MODEL ────────────────────────────────────────────
    h1(d, "6. Security & Auth Model")

    h3(d, "6.1 Identity flow")
    code_block(d,
"""Mobile/Web ─Clerk SDK─▶ Clerk hosted UI (Google / Email OTP / Phone OTP)
                       │
                       ▼
               Clerk session JWT
                       │
                       ▼ (sent on every Convex call)
               Convex middleware:
                 1. verify Clerk JWT signature
                 2. populate ctx.auth.userId
                 3. assertAuth(ctx)  // helper called at top of every fn
                 4. action-specific guards (assertAdmin, assertBuyerOf, ...)
                 5. assertCaptcha(ctx, args.captchaToken) on sensitive ops
                 6. withRateLimit(ctx, key, perMinute)
                 7. requireReauth(ctx, 5)  // for step-up
                 8. business logic
                 9. audit(ctx, action, metadata)""")

    h3(d, "6.2 Defense-in-depth controls")
    table(d,
          ["Threat", "Control", "Where it lives"],
          [
              ["Stolen session token", "Clerk session revocation + 30-min token lifetime + auto-refresh", "Clerk"],
              ["Bot signups", "Clerk built-in bot detection + reCAPTCHA on sign-up form", "Clerk + reCAPTCHA"],
              ["Brute-force escrow code", "5-fail per (user, deal) lockout + bcrypt cost 10 + 3/min rate limit", "convex/escrow.ts + helpers"],
              ["Replay payment webhook", "payment_tx_ref UNIQUE in Turso + idempotent action", "convex/escrow.ts"],
              ["XSS on admin dashboard", "Strict CSP, no inline scripts, sanitize markdown notes", "Next.js middleware"],
              ["SQL injection", "All Turso access through typed convex/turso.ts (parametrized)", "convex/turso.ts"],
              ["Privilege escalation", "ctx.auth.userId trusted only after Clerk JWT verify; assertAdmin checked per-call", "Convex middleware"],
              ["Admin account takeover", "Clerk impersonation requires step-up; 15-min cap; both ends audit-logged", "Clerk + convex/admin.ts"],
              ["PII leak via Sentry", "beforeSend() scrubs email/phone/address/ip", "src/sentry.ts"],
              ["Plain delivery code persistence", "bcrypt-hash before any persistence; plain in Convex ≤ 10 min", "convex/escrow.ts"],
              ["Fayda image leak", "Cloudinary signed URL 5-min TTL; deleted on review decision", "convex/verification.ts"],
              ["Payout to wrong account", "payout_account_snapshot at deal init; subsequent edits do not affect deal", "convex/escrow.ts"],
              ["Stolen Firebase admin key (legacy)", "Purge via git filter-repo + key rotation in P11", "Phase 11"],
          ],
          col_widths=[1.8, 3.0, 1.7])

    h3(d, "6.3 Step-up auth required for")
    bullets(d, [
        "users.savePayoutAccount",
        "admin.banUser, admin.shadowBan, admin.impersonate, admin.setRole, admin.freezeDeal",
        "Login to web admin from a new device/IP",
        "Pro plan cancellation",
    ])

    page_break(d)

    # ── 7. PERFORMANCE CONSIDERATIONS ───────────────────────────────────────
    h1(d, "7. Performance Considerations")

    h3(d, "7.1 Performance budget")
    table(d,
          ["Surface / Operation", "Target (p95)", "How measured"],
          [
              ["Cold start to interactive home feed (mobile)", "≤ 2.0 s", "Sentry performance + manual on Pixel 6a"],
              ["Warm start to home feed", "≤ 0.6 s", "Sentry performance"],
              ["listings.feed query", "≤ 250 ms", "Convex metrics"],
              ["search.search (Convex FTS)", "≤ 350 ms", "Convex metrics"],
              ["search.search (Algolia)", "≤ 250 ms", "Algolia metrics + Convex"],
              ["escrow.initiate (incl. provider call)", "≤ 1500 ms", "Convex metrics"],
              ["escrow.verify (bcrypt)", "≤ 400 ms", "Convex metrics"],
              ["Chat message round-trip", "≤ 250 ms", "Convex reactivity"],
              ["Image load (thumb)", "≤ 300 ms", "Cloudinary edge cache"],
              ["Admin activity feed initial render", "≤ 500 ms", "Vercel + Convex"],
          ],
          col_widths=[2.7, 1.3, 2.5])

    h3(d, "7.2 Strategies")
    bullets(d, [
        "Read replicas: 1 Turso replica in eu-west to keep European admin reads fast.",
        "Convex search index built into listings table — no extra hop.",
        "Cloudinary URL transformations (q_auto,f_auto,w_*) handle responsive image weight.",
        "FlashList everywhere for lists (memory + scroll perf).",
        "Activity logs + partial views batched client-side, flushed every 10 s, max 20 events/batch.",
        "Bcrypt cost = 10 (≈ 60 ms CPU on Convex). Cost will not exceed 11 without a load test.",
        "All n+1 query risks killed by ID-batch helpers in convex/turso.ts (e.g. `getListings(ids[])`).",
        "Cold-start mitigation: Clerk session cache + flash-on-warm-start home feed render from "
        "AsyncStorage hydration before the first Convex roundtrip.",
    ])

    h3(d, "7.3 Capacity projection (within free tiers)")
    table(d,
          ["Resource", "1k DAU projection", "Free-tier ceiling", "Headroom"],
          [
              ["Convex function calls / mo", "≈ 350k", "1M", "65%"],
              ["Convex bandwidth / mo", "≈ 1.6 GB", "8 GB", "80%"],
              ["Turso row reads / mo", "≈ 25M", "1B", "97.5%"],
              ["Turso storage", "≈ 50 MB", "9 GB", "99%"],
              ["Clerk MAU", "≈ 800", "10k", "92%"],
              ["Sentry events / mo", "≈ 800", "5k", "84%"],
              ["Algolia ops / mo (Phase 2)", "≈ 8k", "10k", "20%"],
          ],
          col_widths=[2.0, 1.5, 1.5, 1.5])
    callout(d, "Cost alarm",
            "Each provider's free-tier console alert configured at 70% of monthly ceiling.")

    page_break(d)

    # ── 8. MIGRATION NOTES ──────────────────────────────────────────────────
    h1(d, "8. Migration Notes (~50% stack change)")

    h3(d, "8.1 Before vs after")
    table(d,
          ["Layer", "Before (v1)", "After (v2)", "Migration mechanism"],
          [
              ["Auth", "Firebase Authentication", "Clerk", "Lift-and-shift via Clerk import API; Firebase user IDs preserved as Clerk external IDs"],
              ["Functions", "Firebase Cloud Functions", "Convex (mutations / actions / scheduler / HTTP)", "Reimplement; legacy callable URLs sunset after 14d dual-run"],
              ["Durable DB", "Firestore (NoSQL)", "Turso (SQL)", "One-shot scripts/migrate/firestoreToTurso.ts with reconciliation report"],
              ["Reactive DB", "Firestore listeners", "Convex queries", "Fresh; chat starts in Convex day 1 of P3"],
              ["Image storage", "Cloudinary", "Cloudinary (preserved)", "No change — read-only reference"],
              ["Search", "Algolia w/ Firestore fallback", "Convex FTS → Algolia (Phase 2)", "Adapter in convex/search.ts; flag-driven swap"],
              ["Push", "FCM via firebase-admin", "expo-notifications via Convex action", "Token migration on first sign-in post-cutover"],
              ["Payments", "Chapa + Telebirr (Cloud Functions)", "Chapa + Telebirr (Convex HTTP actions)", "Same providers; webhook URL re-pointed"],
              ["Captcha", "none", "Google reCAPTCHA v3", "Greenfield"],
              ["Monitoring", "none", "Sentry (mobile + Convex)", "Greenfield"],
              ["Admin moderation", "Firestore rules + manual edits", "Convex admin actions + audit log", "Greenfield"],
          ],
          col_widths=[1.0, 1.7, 1.7, 2.1])

    h3(d, "8.2 Data mapping (Firestore → Turso)")
    table(d,
          ["Firestore collection", "Turso table", "Notes"],
          [
              ["users", "users", "role normalized USER→buyer; Firebase UID preserved as Clerk external ID"],
              ["ads", "listings", "price × 100 → cents int; status enum widened; images JSON-encoded"],
              ["reviews", "reviews", "REQUIRES deal_id FK — reviews without an associated deal are discarded"],
              ["favorites", "favorites", "PK = (user_id, listing_id)"],
              ["reports", "reports", "1:1 mapping"],
              ["premium_ads", "merged into listings.is_premium + premium_tier", "premium_history table optional"],
              ["escrow_transactions", "escrow_deals", "rename; commission recomputed under new tiered rates; OTP hash NOT migrated"],
              ["escrow_otps", "Convex escrowCodes (TTL 10 min)", "one-shot migration then collection deleted"],
              ["payment_sessions", "folded into escrow_deals.payment_tx_ref", ""],
              ["chats / messages", "Convex conversations / messages", "no Turso copy; chat lives fully in Convex"],
          ],
          col_widths=[1.7, 2.4, 2.4])

    h3(d, "8.3 Cut-over plan")
    numbered(d, [
        "P3 deploys Convex + Clerk; Firebase remains the source of truth (read+write).",
        "P4 deploys Turso; migration script runs in dry-run (read-only) overnight; reconciliation report reviewed.",
        "Migration script runs in commit mode at 02:00 EAT; 30-minute write freeze on Firestore.",
        "Firestore set to read-only via rules update.",
        "Mobile app shipped via OTA update flips to Turso/Convex code paths.",
        "14-day dual-run: Convex/Turso live; Firestore read-only for emergency reference.",
        "Post-14d: Firestore project frozen; export retained 30d in encrypted bucket; then deleted.",
    ])

    h3(d, "8.4 Migration risks & mitigations")
    table(d,
          ["Risk", "Mitigation"],
          [
              ["Row-count mismatch on cut-over", "Reconciliation script gates the cut-over; PM + Eng Lead sign-off required"],
              ["Mobile clients on old version after cut-over", "Old client code path falls back to a maintenance screen pointing to Play Store update"],
              ["In-flight escrow at cut-over moment", "All deals with status ∈ {pending_payment, held} during the 30-min freeze are marked disputed and resolved manually by admin"],
              ["Firestore export breach", "Export encrypted at rest with rotated KMS key; access limited to two named engineers"],
              ["Push token loss on auth migration", "First sign-in after cut-over re-registers token via expo-notifications"],
          ],
          col_widths=[2.6, 3.9])

    page_break(d)

    # ── 9. RISK REGISTER ────────────────────────────────────────────────────
    h1(d, "9. Risk Register")
    table(d,
          ["ID", "Risk", "Likelihood", "Impact", "Mitigation"],
          [
              ["SR-1", "Convex regional outage", "Low", "High", "Mobile cached read mode; status page subscription"],
              ["SR-2", "Turso replica lag breaks consistency", "Low", "Medium", "Reads pinned to primary for write-after-read flows"],
              ["SR-3", "Bcrypt CPU saturation under spike", "Low", "Medium", "Load test at P12; cost reducible to 9 if needed"],
              ["SR-4", "Webhook signature spoofing", "Low", "Critical", "Provider-supplied HMAC verified; rejection logged"],
              ["SR-5", "Audit log table balloon (>1B rows / DB limit)", "Low", "Medium", "18-mo retention sweep + quarterly archive to S3"],
              ["SR-6", "Algolia paid tier needed sooner than projected", "Medium", "Low", "Convex FTS suffices through ~50k DAU; budgeted in cost model"],
              ["SR-7", "Cloudinary policy change on free tier", "Low", "High", "Monthly export of canonical URLs + budget for Pro plan if forced"],
              ["SR-8", "Firebase admin key already committed to git", "High (already happened)", "Critical", "P11 purge + key rotation; document incident in SECURITY.md"],
              ["SR-9", "Encryption key for payout_account_json lost", "Low", "Critical", "Key in Convex env + offline backup with founder; rotation runbook"],
              ["SR-10", "Convex schema migration breaks reactive queries", "Medium", "Medium", "Versioned migrations + canary deploy to staging Convex deployment"],
          ],
          col_widths=[0.5, 2.6, 0.9, 0.7, 1.8])

    # ── 10. OPEN QUESTIONS ──────────────────────────────────────────────────
    h1(d, "10. Open Questions Log (system)")
    table(d,
          ["ID", "Question", "Owner", "Due", "Blocks"],
          [
              ["SQ-1", "AfricasTalking sender ID approval timeline", "Founder", "2026-04-22", "P3"],
              ["SQ-2", "Confirm Convex region (us-east vs eu-west) for Ethiopia latency", "Eng", "2026-04-22", "P3"],
              ["SQ-3", "Turso replica region — eu-west sufficient or also me-south?", "Eng", "2026-04-25", "P4"],
              ["SQ-4", "Encryption-at-rest scheme for payout_account_json: libsodium box vs AES-256-GCM", "Eng", "2026-04-23", "P4"],
              ["SQ-5", "Push token table: Convex or Turso?", "Eng", "2026-04-20", "P3"],
              ["SQ-6", "Audit log archive bucket — provider + region", "Eng + Ops", "2026-05-10", "P11"],
              ["SQ-7", "Chapa webhook signature method confirmed?", "Eng", "2026-04-22", "P6"],
              ["SQ-8", "Convex deployment env split — staging + prod, or three (dev/stage/prod)?", "Eng", "2026-04-21", "P3"],
          ],
          col_widths=[0.5, 3.0, 1.1, 0.9, 0.6])

    # ── 11. DOCUMENT CONTROL ────────────────────────────────────────────────
    h1(d, "11. Document Control")
    kv_table(d, [
        ["Document ID", "BS-SYSTEM-002"],
        ["Authors", "Engineering"],
        ["Approvers", "Eng Lead, Founder"],
        ["Review cadence", "Weekly during P0–P12; monthly thereafter"],
        ["Companion docs", "PRD.docx, DESIGN.docx, IMPLEMENTATION_PLAN.docx"],
        ["Next review", "2026-04-24"],
    ])

    d.save(out_path)
    print(f"SYSTEM.docx written: {out_path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "SYSTEM.docx"
    build(out)
