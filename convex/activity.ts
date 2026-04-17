import { mutation, query, internalMutation } from "convex/server";
import { v } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { assertAdmin } from "./helpers/assertAdmin";
import { withRateLimit } from "./helpers/withRateLimit";

const ACTIVITY_PRUNE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Public mutations ──────────────────────────────────────────────────────

/**
 * Log a user activity event. Batched on the client (flush every 10s, max 20/batch).
 * Debounced at the call site to stay inside Convex free-tier function limits.
 */
export const logActivity = mutation({
  args: {
    verb: v.string(),
    objectType: v.string(),
    objectId: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { verb, objectType, objectId, category }) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `activity.log:${userId}`, 60);

    await ctx.db.insert("userActivity", {
      userId,
      verb,
      objectType,
      objectId,
      category,
      createdAt: Date.now(),
    });
  },
});

// ── Admin queries ─────────────────────────────────────────────────────────

/**
 * Real-time activity feed for the admin dashboard.
 * Returns the 100 most recent events across all users.
 */
export const streamActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    await assertAdmin(ctx);
    return ctx.db
      .query("userActivity")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

/**
 * Last 100 actions for a specific user (admin view).
 */
export const getUserActivity = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 100 }) => {
    await assertAdmin(ctx);
    return ctx.db
      .query("userActivity")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .take(limit);
  },
});

// ── Internal cron handlers ─────────────────────────────────────────────────

export const pruneOldActivity = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ACTIVITY_PRUNE_AGE_MS;
    const old = await ctx.db
      .query("userActivity")
      .withIndex("by_created")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(500);

    await Promise.all(old.map((doc) => ctx.db.delete(doc._id)));
    return old.length;
  },
});
