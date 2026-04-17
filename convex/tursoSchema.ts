import {
  sqliteTable, text, integer, real, primaryKey, index,
} from "drizzle-orm/sqlite-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id:                 text("id").primaryKey(),
  email:              text("email"),
  phone:              text("phone"),
  name:               text("name").notNull(),
  avatarUrl:          text("avatar_url"),
  city:               text("city"),
  lat:                real("lat"),
  lng:                real("lng"),
  role:               text("role", { enum: ["buyer", "seller", "admin"] }).notNull().default("buyer"),
  plan:               text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  planExpiresAt:      integer("plan_expires_at"),
  proTrialUsed:       integer("pro_trial_used").notNull().default(0),
  verificationTier:   integer("verification_tier").notNull().default(1),
  sellerTrustScore:   real("seller_trust_score").notNull().default(50.0),
  visibilityScore:    real("visibility_score").notNull().default(1.0),
  banned:             integer("banned").notNull().default(0),
  payoutAccountJson:  text("payout_account_json"),
  createdAt:          integer("created_at").notNull(),
  lastLoginAt:        integer("last_login_at").notNull(),
}, (t) => ({
  roleIdx:   index("idx_users_role").on(t.role),
  trustIdx:  index("idx_users_trust").on(t.sellerTrustScore),
  cityIdx:   index("idx_users_city").on(t.city),
}));

// ── Listings ──────────────────────────────────────────────────────────────────
export const listings = sqliteTable("listings", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  sellerId:        text("seller_id").notNull().references(() => users.id),
  title:           text("title").notNull(),
  description:     text("description").notNull(),
  category:        text("category").notNull(),
  subcategory:     text("subcategory"),
  price:           integer("price").notNull(),
  currency:        text("currency").notNull().default("ETB"),
  condition:       text("condition", { enum: ["NEW", "LIKE_NEW", "USED_GOOD", "USED_FAIR"] }),
  negotiable:      integer("negotiable").notNull().default(1),
  contactPref:     text("contact_pref").notNull().default("CHAT_ONLY"),
  locationCity:    text("location_city").notNull(),
  lat:             real("lat"),
  lng:             real("lng"),
  imagesJson:      text("images_json").notNull().default("[]"),
  thumbnailsJson:  text("thumbnails_json").notNull().default("[]"),
  status:          text("status", {
                     enum: ["DRAFT","PENDING_REVIEW","ACTIVE","SOLD","EXPIRED","REJECTED","REMOVED","ARCHIVED"],
                   }).notNull().default("PENDING_REVIEW"),
  rejectionReason: text("rejection_reason"),
  isPremium:       integer("is_premium").notNull().default(0),
  premiumTier:     text("premium_tier"),
  viewCount:       integer("view_count").notNull().default(0),
  clickCount:      integer("click_count").notNull().default(0),
  saveCount:       integer("save_count").notNull().default(0),
  saleCount:       integer("sale_count").notNull().default(0),
  viralScore:      real("viral_score").notNull().default(0.0),
  createdAt:       integer("created_at").notNull(),
  updatedAt:       integer("updated_at").notNull(),
  expiresAt:       integer("expires_at").notNull(),
}, (t) => ({
  statusCatIdx:     index("idx_listings_status_cat").on(t.status, t.category),
  statusPriceIdx:   index("idx_listings_status_price").on(t.status, t.price),
  statusLocIdx:     index("idx_listings_status_location").on(t.status, t.locationCity),
  viralIdx:         index("idx_listings_viral").on(t.viralScore),
  createdIdx:       index("idx_listings_created").on(t.createdAt),
  sellerStatusIdx:  index("idx_listings_seller").on(t.sellerId, t.status),
}));

// ── Escrow Deals ──────────────────────────────────────────────────────────────
export const escrowDeals = sqliteTable("escrow_deals", {
  id:                     integer("id").primaryKey({ autoIncrement: true }),
  listingId:              integer("listing_id").notNull().references(() => listings.id),
  buyerId:                text("buyer_id").notNull().references(() => users.id),
  sellerId:               text("seller_id").notNull().references(() => users.id),
  amount:                 integer("amount").notNull(),
  commissionAmount:       integer("commission_amount").notNull(),
  payoutAmount:           integer("payout_amount").notNull(),
  currency:               text("currency").notNull().default("ETB"),
  paymentMethod:          text("payment_method", { enum: ["CHAPA", "TELEBIRR"] }).notNull(),
  paymentTxRef:           text("payment_tx_ref").notNull().unique(),
  tokenHash:              text("token_hash"),
  status:                 text("status", {
                            enum: ["pending_payment","held","verified","completed","refunded","disputed"],
                          }).notNull().default("pending_payment"),
  countdownExpiresAt:     integer("countdown_expires_at"),
  verifiedAt:             integer("verified_at"),
  payoutReleaseAt:        integer("payout_release_at"),
  completedAt:            integer("completed_at"),
  refundedAt:             integer("refunded_at"),
  disputedAt:             integer("disputed_at"),
  disputeReason:          text("dispute_reason"),
  disputeResolution:      text("dispute_resolution"),
  failedVerifyCount:      integer("failed_verify_count").notNull().default(0),
  payoutAccountSnapshot:  text("payout_account_snapshot").notNull().default("{}"),
  createdAt:              integer("created_at").notNull(),
}, (t) => ({
  statusBuyerIdx:  index("idx_escrow_status_buyer").on(t.status, t.buyerId),
  statusSellerIdx: index("idx_escrow_status_seller").on(t.status, t.sellerId),
}));

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = sqliteTable("reviews", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  dealId:           integer("deal_id").notNull().unique().references(() => escrowDeals.id),
  reviewerId:       text("reviewer_id").notNull().references(() => users.id),
  sellerId:         text("seller_id").notNull().references(() => users.id),
  rating:           integer("rating").notNull(),
  comment:          text("comment"),
  verifiedPurchase: integer("verified_purchase").notNull().default(1),
  createdAt:        integer("created_at").notNull(),
}, (t) => ({
  sellerIdx: index("idx_reviews_seller").on(t.sellerId, t.createdAt),
}));

// ── Seller Trust ──────────────────────────────────────────────────────────────
export const sellerTrust = sqliteTable("seller_trust", {
  sellerId:        text("seller_id").primaryKey().references(() => users.id),
  fulfillmentRate: real("fulfillment_rate").notNull(),
  responseHrs:     real("response_hrs").notNull(),
  weightedRating:  real("weighted_rating").notNull(),
  trustScore:      real("trust_score").notNull(),
  computedAt:      integer("computed_at").notNull(),
});

// ── User Activity ──────────────────────────────────────────────────────────────
export const userActivity = sqliteTable("user_activity", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  userId:     text("user_id").notNull().references(() => users.id),
  verb:       text("verb").notNull(),
  objectType: text("object_type").notNull(),
  objectId:   text("object_id").notNull(),
  category:   text("category"),
  createdAt:  integer("created_at").notNull(),
}, (t) => ({
  createdIdx: index("idx_activity_created").on(t.createdAt),
  userIdx:    index("idx_activity_user").on(t.userId, t.createdAt),
}));

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditLogs = sqliteTable("audit_logs", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  actorId:    text("actor_id").notNull(),
  action:     text("action").notNull(),
  targetType: text("target_type"),
  targetId:   text("target_id"),
  metadata:   text("metadata"),
  timestamp:  integer("timestamp").notNull(),
}, (t) => ({
  actorIdx:  index("idx_audit_actor").on(t.actorId, t.timestamp),
  actionIdx: index("idx_audit_action").on(t.action, t.timestamp),
  targetIdx: index("idx_audit_target").on(t.targetType, t.targetId, t.timestamp),
}));

// ── Verification Requests ─────────────────────────────────────────────────────
export const verificationRequests = sqliteTable("verification_requests", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  userId:          text("user_id").notNull().references(() => users.id),
  targetTier:      integer("target_tier").notNull(),
  faydaUrl:        text("fayda_url"),
  selfieUrl:       text("selfie_url"),
  tradeLicenseUrl: text("trade_license_url"),
  tin:             text("tin"),
  status:          text("status", { enum: ["pending","approved","rejected"] }).notNull().default("pending"),
  adminId:         text("admin_id"),
  adminNote:       text("admin_note"),
  submittedAt:     integer("submitted_at").notNull(),
  reviewedAt:      integer("reviewed_at"),
}, (t) => ({
  statusIdx: index("idx_verif_status").on(t.status, t.submittedAt),
}));

// ── Favorites ─────────────────────────────────────────────────────────────────
export const favorites = sqliteTable("favorites", {
  userId:    text("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  createdAt: integer("created_at").notNull(),
}, (t) => ({
  pk:      primaryKey({ columns: [t.userId, t.listingId] }),
  userIdx: index("idx_fav_user").on(t.userId, t.createdAt),
}));

// ── Reports ───────────────────────────────────────────────────────────────────
export const reports = sqliteTable("reports", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type", { enum: ["listing","user"] }).notNull(),
  targetId:   text("target_id").notNull(),
  reason:     text("reason").notNull(),
  details:    text("details"),
  status:     text("status", { enum: ["PENDING","RESOLVED","DISMISSED"] }).notNull().default("PENDING"),
  adminNote:  text("admin_note"),
  createdAt:  integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
}, (t) => ({
  statusIdx: index("idx_reports_status").on(t.status, t.createdAt),
}));
