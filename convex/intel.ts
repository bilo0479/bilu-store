import { action, internalAction, internalMutation, mutation } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { withRateLimit } from "./helpers/withRateLimit";
import * as turso from "./turso";
import { internal } from "./_generated/api";
import Clerk from "@clerk/clerk-sdk-node";

// ── Interaction recording (viral score writeback) ─────────────────────────────

export const recordInteraction = action({
  args: {
    listingId: v.number(),
    verb: v.union(v.literal("view"), v.literal("click"), v.literal("save"), v.literal("share")),
  },
  handler: async (ctx, { listingId, verb }) => {
    const userId = await assertAuth(ctx);
    // Throttle: max 1 write per (user, listing) per 60s to avoid inflating scores
    await withRateLimit(ctx, `intel.record:${userId}:${listingId}`, 1);

    await turso.recordListingInteraction(listingId, verb);
  },
});

// ── Partial view tracking ─────────────────────────────────────────────────────

export const partialView = mutation({
  args: { listingId: v.number() },
  handler: async (ctx, { listingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const userId = identity.subject;

    const existing = await ctx.db
      .query("partialViews")
      .withIndex("by_user_listing", (q) => q.eq("userId", userId).eq("listingId", listingId))
      .first();

    const count = (existing?.count ?? 0) + 1;
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { count, lastAt: now });
    } else {
      await ctx.db.insert("partialViews", { userId, listingId, count, lastAt: now });
    }

    // Suppress listing from this user's feed after 3 partial views without engagement
    if (count >= 3) {
      const suppressed = await ctx.db
        .query("listingSuppressions")
        .withIndex("by_user_listing", (q) => q.eq("userId", userId).eq("listingId", listingId))
        .first();

      if (!suppressed) {
        // Suppress for 7 days
        await ctx.db.insert("listingSuppressions", {
          userId,
          listingId,
          until: now + 7 * 24 * 60 * 60 * 1000,
        });
      }
    }
  },
});

// ── Nightly trust score rebuild ───────────────────────────────────────────────

export const rebuildTrustScores = internalAction({
  args: {},
  handler: async (ctx) => {
    const sellerIds = await turso.getAllSellerIds();

    // Process in batches of 500 to keep runtime < 30s
    for (let i = 0; i < sellerIds.length; i += 500) {
      const batch = sellerIds.slice(i, i + 500);
      await ctx.runAction(internal.intel.processTrustBatch, { sellerIds: batch });
    }
  },
});

export const processTrustBatch = internalAction({
  args: { sellerIds: v.array(v.string()) },
  handler: async (ctx, { sellerIds }) => {
    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

    for (const sellerId of sellerIds) {
      const trust = await turso.computeSellerTrust(sellerId);
      if (!trust) continue;

      await turso.upsertSellerTrust({
        sellerId,
        fulfillmentRate: trust.fulfillmentRate,
        responseHrs: trust.responseHrs,
        weightedRating: trust.weightedRating,
        trustScore: trust.trustScore,
        computedAt: Date.now(),
      });

      // Sync trustScore to Clerk publicMetadata (rate-capped to 1000 calls/min)
      try {
        await clerkClient.users.updateUserMetadata(sellerId, {
          publicMetadata: { sellerTrustScore: trust.trustScore },
        });
      } catch {
        // Non-critical; retry on next nightly run
      }
    }
  },
});

// ── Prune expired suppressions ────────────────────────────────────────────────

export const pruneExpiredSuppressions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("listingSuppressions")
      .withIndex("by_expiry", (q) => q.lt("until", Date.now()))
      .collect();
    await Promise.all(expired.map((r) => ctx.db.delete(r._id)));
    return { pruned: expired.length };
  },
});
