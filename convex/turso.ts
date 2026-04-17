/**
 * Turso data-access layer — Drizzle ORM over libSQL HTTP client.
 *
 * ALL Turso reads/writes go through this module.
 * No raw SQL in feature code.
 *
 * Used ONLY inside Convex Actions (not Mutations) because
 * Convex Mutations cannot make external network calls.
 *
 * Env vars required:
 *   TURSO_DATABASE_URL   — libSQL HTTP URL from `turso db show --url <name>`
 *   TURSO_AUTH_TOKEN     — from `turso db tokens create <name>`
 */

import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, desc, lt, gt, sql, inArray } from "drizzle-orm";
import * as schema from "./tursoSchema";

import type { UserRow, ListingRow, EscrowRow, ReviewRow } from "@bilustore/shared";

// ── Client factory ────────────────────────────────────────────────────────────
// Called per-request in Convex serverless environment (no persistent connections)
function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

// ── Type helpers ──────────────────────────────────────────────────────────────

type NewUser = typeof schema.users.$inferInsert;
type NewListing = typeof schema.listings.$inferInsert;
type NewEscrow = typeof schema.escrowDeals.$inferInsert;
type NewReview = typeof schema.reviews.$inferInsert;

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(id: string): Promise<UserRow | null> {
  const db = getDb();
  const row = await db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!row) return null;
  return mapUser(row);
}

export async function upsertUser(input: NewUser): Promise<UserRow> {
  const db = getDb();
  await db.insert(schema.users)
    .values(input)
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        name: input.name,
        email: input.email,
        avatarUrl: input.avatarUrl,
        lastLoginAt: input.lastLoginAt,
      },
    });
  return (await getUser(input.id as string))!;
}

export async function updateUser(id: string, patch: Partial<NewUser>): Promise<void> {
  const db = getDb();
  await db.update(schema.users).set(patch).where(eq(schema.users.id, id));
}

export async function listUsers(opts: { limit?: number; offset?: number } = {}): Promise<UserRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.users)
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return rows.map(mapUser);
}

// ── Listings ──────────────────────────────────────────────────────────────────

export async function getListing(id: number): Promise<ListingRow | null> {
  const db = getDb();
  const row = await db.select().from(schema.listings).where(eq(schema.listings.id, id)).get();
  return row ? mapListing(row) : null;
}

export async function insertListing(input: NewListing): Promise<ListingRow> {
  const db = getDb();
  const result = await db.insert(schema.listings).values(input).returning();
  return mapListing(result[0]);
}

export async function updateListing(id: number, patch: Partial<NewListing>): Promise<void> {
  const db = getDb();
  await db.update(schema.listings)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(schema.listings.id, id));
}

export async function listActiveListings(opts: {
  category?: string;
  locationCity?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  cursor?: number;
}): Promise<ListingRow[]> {
  const db = getDb();
  const conditions = [eq(schema.listings.status, "ACTIVE")];
  if (opts.category) conditions.push(eq(schema.listings.category, opts.category));
  if (opts.locationCity) conditions.push(eq(schema.listings.locationCity, opts.locationCity));
  if (opts.minPrice !== undefined) conditions.push(gt(schema.listings.price, opts.minPrice));
  if (opts.maxPrice !== undefined) conditions.push(lt(schema.listings.price, opts.maxPrice));
  if (opts.cursor !== undefined) conditions.push(lt(schema.listings.id, opts.cursor));

  const rows = await db.select()
    .from(schema.listings)
    .where(and(...conditions))
    .orderBy(desc(schema.listings.viralScore), desc(schema.listings.createdAt))
    .limit(opts.limit ?? 20);

  return rows.map(mapListing);
}

export async function getSellerListings(sellerId: string): Promise<ListingRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.listings)
    .where(eq(schema.listings.sellerId, sellerId))
    .orderBy(desc(schema.listings.createdAt));
  return rows.map(mapListing);
}

export async function expireListings(): Promise<number> {
  const db = getDb();
  const result = await db.update(schema.listings)
    .set({ status: "EXPIRED", updatedAt: Date.now() })
    .where(and(eq(schema.listings.status, "ACTIVE"), lt(schema.listings.expiresAt, Date.now())))
    .returning({ id: schema.listings.id });
  return result.length;
}

// ── Escrow ────────────────────────────────────────────────────────────────────

export async function getEscrow(id: number): Promise<EscrowRow | null> {
  const db = getDb();
  const row = await db.select().from(schema.escrowDeals).where(eq(schema.escrowDeals.id, id)).get();
  return row ? mapEscrow(row) : null;
}

export async function insertEscrow(input: NewEscrow): Promise<EscrowRow> {
  const db = getDb();
  const result = await db.insert(schema.escrowDeals).values(input).returning();
  return mapEscrow(result[0]);
}

export async function txVerifyEscrow(
  dealId: number,
  tokenHash: string,
  payoutReleaseAt: number,
): Promise<EscrowRow> {
  const db = getDb();
  // Guard: only update if status is still 'held' — prevents double-verify
  const result = await db.update(schema.escrowDeals)
    .set({
      status: "verified",
      verifiedAt: Date.now(),
      payoutReleaseAt,
      tokenHash,
    })
    .where(and(eq(schema.escrowDeals.id, dealId), eq(schema.escrowDeals.status, "held")))
    .returning();
  if (!result[0]) throw new Error("escrow_already_resolved");
  return mapEscrow(result[0]);
}

export async function txRefund(
  dealId: number,
  reason: string,
): Promise<void> {
  const db = getDb();
  await db.update(schema.escrowDeals)
    .set({ status: "refunded", refundedAt: Date.now(), disputeReason: reason })
    .where(and(eq(schema.escrowDeals.id, dealId), eq(schema.escrowDeals.status, "held")));
}

export async function updateEscrowTxRef(dealId: number, txRef: string): Promise<void> {
  const db = getDb();
  await db.update(schema.escrowDeals)
    .set({ paymentTxRef: txRef })
    .where(eq(schema.escrowDeals.id, dealId));
}

export async function markEscrowCompleted(dealId: number): Promise<void> {
  const db = getDb();
  await db.update(schema.escrowDeals)
    .set({ status: "completed", completedAt: Date.now() })
    .where(eq(schema.escrowDeals.id, dealId));
}

export async function incrementFailedVerify(dealId: number): Promise<number> {
  const db = getDb();
  const result = await db.update(schema.escrowDeals)
    .set({ failedVerifyCount: sql`${schema.escrowDeals.failedVerifyCount} + 1` })
    .where(eq(schema.escrowDeals.id, dealId))
    .returning({ count: schema.escrowDeals.failedVerifyCount });
  return result[0]?.count ?? 0;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviewsForSeller(sellerId: string, limit = 20): Promise<ReviewRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.reviews)
    .where(eq(schema.reviews.sellerId, sellerId))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(limit);
  return rows.map(mapReview);
}

export async function insertReview(input: NewReview): Promise<ReviewRow> {
  const db = getDb();
  const result = await db.insert(schema.reviews).values(input).returning();
  return mapReview(result[0]);
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getFavorites(userId: string): Promise<number[]> {
  const db = getDb();
  const rows = await db.select({ listingId: schema.favorites.listingId })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, userId));
  return rows.map((r) => r.listingId);
}

export async function toggleFavorite(
  userId: string,
  listingId: number,
): Promise<"added" | "removed"> {
  const db = getDb();
  const existing = await db.select()
    .from(schema.favorites)
    .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.listingId, listingId)))
    .get();

  if (existing) {
    await db.delete(schema.favorites)
      .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.listingId, listingId)));
    return "removed";
  }
  await db.insert(schema.favorites).values({ userId, listingId, createdAt: Date.now() });
  return "added";
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

export async function countUsers(): Promise<number> {
  const db = getDb();
  const result = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  return result[0]?.count ?? 0;
}

export async function getListingStats(): Promise<{
  totalListings: number;
  pendingListings: number;
  activeListings: number;
}> {
  const db = getDb();
  const rows = await db.select({
    status: schema.listings.status,
    count: sql<number>`count(*)`,
  }).from(schema.listings).groupBy(schema.listings.status);

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return {
    totalListings: rows.reduce((s, r) => s + r.count, 0),
    pendingListings: byStatus["PENDING"] ?? 0,
    activeListings: byStatus["ACTIVE"] ?? 0,
  };
}

export async function countDisputedDeals(): Promise<number> {
  const db = getDb();
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.escrowDeals)
    .where(eq(schema.escrowDeals.status, "refunded"));
  return result[0]?.count ?? 0;
}

export async function getPendingListings(opts: { limit?: number; offset?: number } = {}): Promise<ListingRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.listings)
    .where(eq(schema.listings.status, "PENDING"))
    .orderBy(schema.listings.createdAt)
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return rows.map(mapListing);
}

export async function getDisputedDeals(opts: { limit?: number; offset?: number } = {}): Promise<EscrowRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.escrowDeals)
    .where(eq(schema.escrowDeals.status, "refunded"))
    .orderBy(desc(schema.escrowDeals.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return rows.map(mapEscrow);
}

export async function listAuditLogs(opts: {
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<Array<{
  id: number;
  actorId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: string | null;
  timestamp: number;
}>> {
  const db = getDb();
  const conditions = [];
  if (opts.actorId) conditions.push(eq(schema.auditLogs.actorId, opts.actorId));
  if (opts.action) conditions.push(eq(schema.auditLogs.action, opts.action));

  const query = db.select().from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.timestamp))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  const rows = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return rows;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export async function insertAuditLog(input: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(schema.auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    timestamp: Date.now(),
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function insertReport(input: {
  reporterId: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  details?: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(schema.reports).values({ ...input, createdAt: Date.now() });
}

// ── Seller Trust ──────────────────────────────────────────────────────────────

export async function upsertSellerTrust(input: typeof schema.sellerTrust.$inferInsert): Promise<void> {
  const db = getDb();
  await db.insert(schema.sellerTrust)
    .values(input)
    .onConflictDoUpdate({
      target: schema.sellerTrust.sellerId,
      set: {
        fulfillmentRate: input.fulfillmentRate,
        responseHrs: input.responseHrs,
        weightedRating: input.weightedRating,
        trustScore: input.trustScore,
        computedAt: input.computedAt,
      },
    });
}

export async function recordListingInteraction(
  listingId: number,
  verb: "view" | "click" | "save" | "share",
): Promise<void> {
  const db = getDb();
  const col = verb === "view" ? schema.listings.viewCount
    : verb === "click" ? schema.listings.clickCount
    : verb === "save" ? schema.listings.saveCount
    : null;

  if (!col) return;

  await db.update(schema.listings)
    .set({ [col.name]: sql`${col} + 1` })
    .where(eq(schema.listings.id, listingId));

  // Recompute viral score: log(views+1)*2 + clicks*3 + saves*5 + shares*8
  const row = await db.select({
    v: schema.listings.viewCount,
    cl: schema.listings.clickCount,
    s: schema.listings.saveCount,
  }).from(schema.listings).where(eq(schema.listings.id, listingId)).get();

  if (row) {
    const viralScore = Math.log1p(row.v + 1) * 2 + row.cl * 3 + row.s * 5;
    await db.update(schema.listings)
      .set({ viralScore })
      .where(eq(schema.listings.id, listingId));
  }
}

export async function computeSellerTrust(sellerId: string): Promise<{
  fulfillmentRate: number;
  responseHrs: number;
  weightedRating: number;
  trustScore: number;
} | null> {
  const db = getDb();

  // Fulfillment rate = completed deals / total deals
  const deals = await db.select({
    status: schema.escrowDeals.status,
  }).from(schema.escrowDeals).where(eq(schema.escrowDeals.sellerId, sellerId));

  if (deals.length === 0) return null;

  const completed = deals.filter((d) => d.status === "completed").length;
  const fulfillmentRate = completed / deals.length;

  // Weighted rating from reviews
  const reviews = await db.select({ rating: schema.reviews.rating })
    .from(schema.reviews)
    .where(eq(schema.reviews.sellerId, sellerId));

  const weightedRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 3.0;

  // Trust score: fulfillmentRate*50 + (weightedRating/5)*40 + min(reviews.length,10)*1
  const trustScore = Math.round(
    fulfillmentRate * 50 +
    (weightedRating / 5) * 40 +
    Math.min(reviews.length, 10)
  );

  return {
    fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
    responseHrs: 24, // Placeholder — implement chat response time in P8
    weightedRating: Math.round(weightedRating * 10) / 10,
    trustScore,
  };
}

export async function getExpiredProUsers(): Promise<string[]> {
  const db = getDb();
  const rows = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(and(
      eq(schema.users.plan, "pro"),
      lt(schema.users.planExpiresAt, Date.now()),
    ));
  return rows.map((r) => r.id as string);
}

export async function archiveExcessListings(userId: string, keepCount: number): Promise<void> {
  const db = getDb();
  const active = await db.select({ id: schema.listings.id })
    .from(schema.listings)
    .where(and(eq(schema.listings.sellerId, userId), eq(schema.listings.status, "ACTIVE")))
    .orderBy(desc(schema.listings.createdAt));

  const toArchive = active.slice(keepCount).map((r) => r.id);
  if (toArchive.length === 0) return;

  await db.update(schema.listings)
    .set({ status: "ARCHIVED", updatedAt: Date.now() })
    .where(and(
      eq(schema.listings.sellerId, userId),
      inArray(schema.listings.id, toArchive),
    ));
}

export async function getAllSellerIds(): Promise<string[]> {
  const db = getDb();
  const rows = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, "seller"));
  return rows.map((r) => r.id);
}

// ── Row mappers (DB snake_case → camelCase) ───────────────────────────────────

function mapUser(row: typeof schema.users.$inferSelect): UserRow {
  return {
    id: row.id,
    email: row.email ?? null,
    phone: row.phone ?? null,
    name: row.name,
    avatarUrl: row.avatarUrl ?? null,
    city: row.city ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    role: row.role as UserRow["role"],
    plan: row.plan as UserRow["plan"],
    planExpiresAt: row.planExpiresAt ?? null,
    proTrialUsed: row.proTrialUsed === 1,
    verificationTier: row.verificationTier as UserRow["verificationTier"],
    sellerTrustScore: row.sellerTrustScore,
    visibilityScore: row.visibilityScore,
    banned: row.banned === 1,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
    payoutAccountJson: row.payoutAccountJson ?? null,
  };
}

function mapListing(row: typeof schema.listings.$inferSelect): ListingRow {
  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory ?? null,
    price: row.price,
    currency: row.currency as ListingRow["currency"],
    condition: row.condition as ListingRow["condition"] ?? null,
    negotiable: row.negotiable === 1,
    contactPref: row.contactPref as ListingRow["contactPref"],
    locationCity: row.locationCity,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    images: JSON.parse(row.imagesJson) as string[],
    thumbnails: JSON.parse(row.thumbnailsJson) as string[],
    status: row.status as ListingRow["status"],
    rejectionReason: row.rejectionReason ?? null,
    isPremium: row.isPremium === 1,
    premiumTier: row.premiumTier ?? null,
    viewCount: row.viewCount,
    clickCount: row.clickCount,
    saveCount: row.saveCount,
    saleCount: row.saleCount,
    viralScore: row.viralScore,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  };
}

function mapEscrow(row: typeof schema.escrowDeals.$inferSelect): EscrowRow {
  return {
    id: row.id,
    listingId: row.listingId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    amount: row.amount,
    commissionAmount: row.commissionAmount,
    payoutAmount: row.payoutAmount,
    currency: row.currency as EscrowRow["currency"],
    paymentMethod: row.paymentMethod as EscrowRow["paymentMethod"],
    paymentTxRef: row.paymentTxRef,
    tokenHash: row.tokenHash ?? null,
    status: row.status as EscrowRow["status"],
    countdownExpiresAt: row.countdownExpiresAt ?? null,
    verifiedAt: row.verifiedAt ?? null,
    payoutReleaseAt: row.payoutReleaseAt ?? null,
    completedAt: row.completedAt ?? null,
    refundedAt: row.refundedAt ?? null,
    disputedAt: row.disputedAt ?? null,
    disputeReason: row.disputeReason ?? null,
    failedVerifyCount: row.failedVerifyCount,
    createdAt: row.createdAt,
  };
}

function mapReview(row: typeof schema.reviews.$inferSelect): ReviewRow {
  return {
    id: row.id,
    dealId: row.dealId,
    reviewerId: row.reviewerId,
    sellerId: row.sellerId,
    rating: row.rating as ReviewRow["rating"],
    comment: row.comment ?? null,
    verifiedPurchase: row.verifiedPurchase === 1,
    createdAt: row.createdAt,
  };
}
