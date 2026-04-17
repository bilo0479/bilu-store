import { action } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { withRateLimit } from "./helpers/withRateLimit";
import * as turso from "./turso";

export const getSellerReviews = action({
  args: { sellerId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { sellerId, limit }) => {
    await assertAuth(ctx);
    return turso.getReviewsForSeller(sellerId, limit ?? 20);
  },
});

export const createReview = action({
  args: {
    dealId: v.number(),
    sellerId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `review.create:${userId}`, 5);

    if (args.rating < 1 || args.rating > 5) throw new ConvexError("invalid_rating");

    return turso.insertReview({
      dealId: args.dealId,
      reviewerId: userId,
      sellerId: args.sellerId,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
  },
});
