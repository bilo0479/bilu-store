import { action } from "convex/server";
import { v } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { withRateLimit } from "./helpers/withRateLimit";
import * as turso from "./turso";

export const getFavorites = action({
  args: {},
  handler: async (ctx) => {
    const userId = await assertAuth(ctx);
    return turso.getFavorites(userId);
  },
});

export const toggleFavorite = action({
  args: { listingId: v.number() },
  handler: async (ctx, { listingId }) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `favorites.toggle:${userId}`, 30);
    return turso.toggleFavorite(userId, listingId);
  },
});
