-- Bilu Store — Turso initial schema
-- Run via: turso db shell <db-name> < convex/migrations/001_initial.sql
-- Or via the Turso CLI: turso db execute <db-name> --file convex/migrations/001_initial.sql

-- ── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    TEXT PRIMARY KEY,
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
  visibility_score      REAL NOT NULL DEFAULT 1.0,
  banned                INTEGER NOT NULL DEFAULT 0,
  payout_account_json   TEXT,
  created_at            INTEGER NOT NULL,
  last_login_at         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan   ON users(plan, plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_trust  ON users(seller_trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_city   ON users(city);

-- ── LISTINGS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id         TEXT NOT NULL REFERENCES users(id),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL,
  subcategory       TEXT,
  price             INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'ETB',
  condition         TEXT CHECK (condition IN ('NEW','LIKE_NEW','USED_GOOD','USED_FAIR')),
  negotiable        INTEGER NOT NULL DEFAULT 1,
  contact_pref      TEXT NOT NULL DEFAULT 'CHAT_ONLY',
  location_city     TEXT NOT NULL,
  lat               REAL,
  lng               REAL,
  images_json       TEXT NOT NULL DEFAULT '[]',
  thumbnails_json   TEXT NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
                    CHECK (status IN ('DRAFT','PENDING_REVIEW','ACTIVE','SOLD','EXPIRED','REJECTED','REMOVED','ARCHIVED')),
  rejection_reason  TEXT,
  is_premium        INTEGER NOT NULL DEFAULT 0,
  premium_tier      TEXT,
  view_count        INTEGER NOT NULL DEFAULT 0,
  click_count       INTEGER NOT NULL DEFAULT 0,
  save_count        INTEGER NOT NULL DEFAULT 0,
  sale_count        INTEGER NOT NULL DEFAULT 0,
  viral_score       REAL NOT NULL DEFAULT 0.0,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  expires_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_status_cat      ON listings(status, category);
CREATE INDEX IF NOT EXISTS idx_listings_status_price    ON listings(status, price);
CREATE INDEX IF NOT EXISTS idx_listings_status_location ON listings(status, location_city);
CREATE INDEX IF NOT EXISTS idx_listings_viral           ON listings(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created         ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_seller          ON listings(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_expiry          ON listings(expires_at) WHERE status = 'ACTIVE';

-- ── ESCROW DEALS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escrow_deals (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id              INTEGER NOT NULL REFERENCES listings(id),
  buyer_id                TEXT NOT NULL REFERENCES users(id),
  seller_id               TEXT NOT NULL REFERENCES users(id),
  amount                  INTEGER NOT NULL,
  commission_amount       INTEGER NOT NULL,
  payout_amount           INTEGER NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'ETB',
  payment_method          TEXT NOT NULL CHECK (payment_method IN ('CHAPA','TELEBIRR')),
  payment_tx_ref          TEXT NOT NULL UNIQUE,
  token_hash              TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN ('pending_payment','held','verified','completed','refunded','disputed')),
  countdown_expires_at    INTEGER,
  verified_at             INTEGER,
  payout_release_at       INTEGER,
  completed_at            INTEGER,
  refunded_at             INTEGER,
  disputed_at             INTEGER,
  dispute_reason          TEXT,
  dispute_resolution      TEXT,
  failed_verify_count     INTEGER NOT NULL DEFAULT 0,
  payout_account_snapshot TEXT NOT NULL DEFAULT '{}',
  created_at              INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_escrow_status_buyer   ON escrow_deals(status, buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status_seller  ON escrow_deals(status, seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_countdown      ON escrow_deals(countdown_expires_at)
  WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_escrow_payout_release ON escrow_deals(payout_release_at)
  WHERE status = 'verified';

-- ── REVIEWS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id             INTEGER NOT NULL UNIQUE REFERENCES escrow_deals(id),
  reviewer_id         TEXT NOT NULL REFERENCES users(id),
  seller_id           TEXT NOT NULL REFERENCES users(id),
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT,
  verified_purchase   INTEGER NOT NULL DEFAULT 1,
  created_at          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id, created_at DESC);

-- ── SELLER TRUST (materialized nightly) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_trust (
  seller_id         TEXT PRIMARY KEY REFERENCES users(id),
  fulfillment_rate  REAL NOT NULL,
  response_hrs      REAL NOT NULL,
  weighted_rating   REAL NOT NULL,
  trust_score       REAL NOT NULL,
  computed_at       INTEGER NOT NULL
);

-- ── USER ACTIVITY ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL REFERENCES users(id),
  verb          TEXT NOT NULL,
  object_type   TEXT NOT NULL,
  object_id     TEXT NOT NULL,
  category      TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user    ON user_activity(user_id, created_at DESC);

-- ── AUDIT LOGS (append-only) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    TEXT,
  timestamp   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id, timestamp DESC);

-- ── VERIFICATION REQUESTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_requests (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            TEXT NOT NULL REFERENCES users(id),
  target_tier        INTEGER NOT NULL CHECK (target_tier IN (2,3)),
  fayda_url          TEXT,
  selfie_url         TEXT,
  trade_license_url  TEXT,
  tin                TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  admin_id           TEXT,
  admin_note         TEXT,
  submitted_at       INTEGER NOT NULL,
  reviewed_at        INTEGER
);
CREATE INDEX IF NOT EXISTS idx_verif_status ON verification_requests(status, submitted_at);

-- ── FAVORITES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  user_id     TEXT NOT NULL REFERENCES users(id),
  listing_id  INTEGER NOT NULL REFERENCES listings(id),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id, created_at DESC);

-- ── REPORTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id   TEXT NOT NULL REFERENCES users(id),
  target_type   TEXT NOT NULL CHECK (target_type IN ('listing','user')),
  target_id     TEXT NOT NULL,
  reason        TEXT NOT NULL,
  details       TEXT,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','RESOLVED','DISMISSED')),
  admin_note    TEXT,
  created_at    INTEGER NOT NULL,
  resolved_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
