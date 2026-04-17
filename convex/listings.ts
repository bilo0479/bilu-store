import { action, internalAction, internalMutation, mutation, query } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { withRateLimit } from "./helpers/withRateLimit";
import { audit } from "./helpers/audit";
import * as turso from "./turso";
import { internal } from "./_generated/api";

const LISTING_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Public queries ────────────────────────────────────────────────────────────

export const getFeed = action({
  args: {
    category: v.optional(v.string()),
    locationCity: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAuth(ctx);
    return turso.listActiveListings({ ...args, limit: args.limit ?? 20 });
  },
});

export const getListingById = action({
  args: { id: v.number() },
  handler: async (ctx, { id }) => {
    await assertAuth(ctx);
    const listing = await turso.getListing(id);
    if (!listing) throw new ConvexError("not_found");
    return listing;
  },
});

export const getMyListings = action({
  args: {},
  handler: async (ctx) => {
    const userId = await assertAuth(ctx);
    return turso.getSellerListings(userId);
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createListing = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    price: v.number(),
    condition: v.optional(v.string()),
    negotiable: v.optional(v.boolean()),
    contactPref: v.optional(v.string()),
    locationCity: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    images: v.array(v.string()),
    thumbnails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `listing.create:${userId}`, 5);

    // Check tier (buyer cannot post — must be seller or verified)
    const identity = await ctx.auth.getUserIdentity();
    const tier = (identity?.publicMetadata as Record<string, unknown>)?.verificationTier as number ?? 1;
    if (tier < 2) throw new ConvexError("verification_required");

    const now = Date.now();
    const listing = await turso.insertListing({
      sellerId: userId,
      title: args.title,
      description: args.description,
      category: args.category,
      subcategory: args.subcategory,
      price: args.price,
      condition: args.condition as "NEW" | "LIKE_NEW" | "USED_GOOD" | "USED_FAIR" | undefined,
      negotiable: args.negotiable !== false ? 1 : 0,
      contactPref: args.contactPref ?? "CHAT_ONLY",
      locationCity: args.locationCity,
      lat: args.lat,
      lng: args.lng,
      imagesJson: JSON.stringify(args.images),
      thumbnailsJson: JSON.stringify(args.thumbnails),
      createdAt: now,
      updatedAt: now,
      expiresAt: now + LISTING_TTL_MS,
    });

    await ctx.runMutation(internal.listings.syncListingToConvex, { listing });
    await audit(ctx, "listing.create", { targetType: "listing", targetId: String(listing.id) }, userId);
    return listing;
  },
});

export const updateListing = action({
  args: {
    id: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    locationCity: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await assertAuth(ctx);
    const existing = await turso.getListing(id);
    if (!existing) throw new ConvexError("not_found");
    if (existing.sellerId !== userId) throw new ConvexError("forbidden");

    await turso.updateListing(id, {
      ...(patch.title && { title: patch.title }),
      ...(patch.description && { description: patch.description }),
      ...(patch.price !== undefined && { price: patch.price }),
      ...(patch.locationCity && { locationCity: patch.locationCity }),
      ...(patch.images && { imagesJson: JSON.stringify(patch.images) }),
    });

    const updated = await turso.getListing(id);
    if (updated) await ctx.runMutation(internal.listings.syncListingToConvex, { listing: updated });
    return updated;
  },
});

export const deleteListing = action({
  args: { id: v.number() },
  handler: async (ctx, { id }) => {
    const userId = await assertAuth(ctx);
    const existing = await turso.getListing(id);
    if (!existing) throw new ConvexError("not_found");
    if (existing.sellerId !== userId) throw new ConvexError("forbidden");

    await turso.updateListing(id, { status: "REMOVED" });
    await audit(ctx, "listing.remove", { targetType: "listing", targetId: String(id) }, userId);
  },
});

// ── Internal mutations (sync Turso → Convex reactive table) ──────────────────

export const syncListingToConvex = internalMutation({
  args: { listing: v.any() },
  handler: async (ctx, { listing }) => {
    const existing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("tursoId"), listing.id))
      .first();

    const convexListing = {
      tursoId: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price,
      images: listing.images,
      locationCity: listing.locationCity,
      status: listing.status,
      viralScore: listing.viralScore,
      isPro: listing.isPremium,
      createdAt: listing.createdAt,
      expiresAt: listing.expiresAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, convexListing);
    } else {
      await ctx.db.insert("listings", convexListing);
    }
  },
});

// ── Internal cron actions ──────────────────────────────────────────────────────

export const expireListingsCron = internalAction({
  args: {},
  handler: async (_ctx) => {
    const count = await turso.expireListings();
    return { expired: count };
  },
});
