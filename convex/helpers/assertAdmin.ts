import { MutationCtx, QueryCtx, ActionCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { assertAuth } from "./assertAuth";

type AnyCtx = MutationCtx | QueryCtx | ActionCtx;

/**
 * Assert the caller is an authenticated admin.
 * Checks Clerk JWT publicMetadata.role === 'admin'.
 * Returns the userId on success.
 */
export async function assertAdmin(ctx: AnyCtx): Promise<string> {
  const userId = await assertAuth(ctx);
  const identity = await ctx.auth.getUserIdentity();
  const role = (identity?.publicMetadata as Record<string, unknown> | undefined)?.role;
  if (role !== "admin") {
    throw new ConvexError("forbidden");
  }
  return userId;
}
