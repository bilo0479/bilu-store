import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Listings (reactive mirror of Turso, 2-week retention) ─────────────────
  listings: defineTable({
    tursoId: v.number(),
    sellerId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    locationCity: v.string(),
    status: v.union(
      v.literal("ACTIVE"), v.literal("SOLD"), v.literal("EXPIRED"),
      v.literal("REMOVED"), v.literal("ARCHIVED"), v.literal("PENDING_REVIEW"),
      v.literal("DRAFT"), v.literal("REJECTED"),
    ),
    viralScore: v.number(),
    isPro: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_status_category", ["status", "category"])
    .index("by_status_viral", ["status", "viralScore"])
    .index("by_seller", ["sellerId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "category", "locationCity"],
    }),

  // ── Short-lived escrow OTPs (TTL 10 min, buyer-readable only) ────────────
  escrowCodes: defineTable({
    dealId: v.number(),
    buyerId: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  }).index("by_buyer_deal", ["buyerId", "dealId"]),

  // ── Chat ──────────────────────────────────────────────────────────────────
  conversations: defineTable({
    listingId: v.number(),
    buyerId: v.string(),
    sellerId: v.string(),
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.number(),
    unreadByBuyer: v.number(),
    unreadBySeller: v.number(),
  })
    .index("by_buyer", ["buyerId", "lastMessageAt"])
    .index("by_seller", ["sellerId", "lastMessageAt"])
    .index("by_pair_listing", ["listingId", "buyerId", "sellerId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId", "createdAt"]),

  // ── Activity feed (admin dashboard) ──────────────────────────────────────
  userActivity: defineTable({
    userId: v.string(),
    verb: v.string(),
    objectType: v.string(),
    objectId: v.string(),
    category: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // ── Per-user listing suppressions (after 3 partial views) ────────────────
  listingSuppressions: defineTable({
    userId: v.string(),
    listingId: v.number(),
    until: v.number(),
  })
    .index("by_user_listing", ["userId", "listingId"])
    .index("by_expiry", ["until"]),

  // ── Rate limit counters (rolling 1-min bucket) ───────────────────────────
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

  // ── Partial view counters ─────────────────────────────────────────────────
  partialViews: defineTable({
    userId: v.string(),
    listingId: v.number(),
    count: v.number(),
    lastAt: v.number(),
  }).index("by_user_listing", ["userId", "listingId"]),

  // ── Convex-side user mirror (for reactive queries) ───────────────────────
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin")),
    plan: v.union(v.literal("free"), v.literal("pro")),
    verificationTier: v.union(v.literal(1), v.literal(2), v.literal(3)),
    banned: v.boolean(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),
});
