import { MutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

const WINDOW_MS = 60_000;

/**
 * Rolling 1-minute rate limiter stored in Convex rateLimits table.
 * @param key     e.g. "escrow.verify:userId123"
 * @param limit   max calls per minute (default 10)
 */
export async function withRateLimit(
  ctx: MutationCtx,
  key: string,
  limit = 10,
): Promise<void> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  if (!existing) {
    await ctx.db.insert("rateLimits", { key, windowStart: now, count: 1 });
    return;
  }

  if (existing.windowStart < windowStart) {
    // Window expired — reset
    await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    return;
  }

  if (existing.count >= limit) {
    throw new ConvexError("rate_limit_exceeded");
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}
