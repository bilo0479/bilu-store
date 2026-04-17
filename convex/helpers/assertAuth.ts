import { MutationCtx, QueryCtx, ActionCtx } from "convex/server";
import { ConvexError } from "convex/values";

type AnyCtx = MutationCtx | QueryCtx | ActionCtx;

/**
 * Extract the authenticated Clerk user ID from ctx.auth.
 * Throws ConvexError("unauthenticated") if no valid session.
 * Must be the FIRST call in every Convex function handler.
 */
export async function assertAuth(ctx: AnyCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("unauthenticated");
  }
  // Clerk puts the user ID in the subject field of the JWT
  return identity.subject;
}
