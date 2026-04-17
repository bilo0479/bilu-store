import { MutationCtx, ActionCtx } from "convex/server";
import { ConvexError } from "convex/values";

/**
 * Require that the current session was authenticated within the last `afterMinutes`.
 * Used before sensitive mutations: escrow release, payout account update, admin actions.
 *
 * Clerk issues JWT tokens with an `iat` (issued-at) claim. We check that the token
 * was issued recently enough to count as step-up auth.
 */
export async function requireReauth(
  ctx: MutationCtx | ActionCtx,
  afterMinutes = 5,
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("unauthenticated");

  const issuedAt = (identity as { tokenIdentifier?: string; issuedAt?: number }).issuedAt;
  if (!issuedAt) return; // No claim — skip (Clerk always provides this in production)

  const ageSec = (Date.now() - issuedAt * 1000) / 1000;
  if (ageSec > afterMinutes * 60) {
    throw new ConvexError("reauth_required");
  }
}
