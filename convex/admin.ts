import { action, query } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAdmin } from "./helpers/assertAdmin";
import { audit } from "./helpers/audit";
import * as turso from "./turso";
import Clerk from "@clerk/clerk-sdk-node";

// ── Dashboard stats ───────────────────────────────────────────────────────────

export const getDashboardStats = action({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    const [totalUsers, listingStats, disputeCount] = await Promise.all([
      turso.countUsers(),
      turso.getListingStats(),
      turso.countDisputedDeals(),
    ]);
    return { totalUsers, ...listingStats, disputeCount };
  },
});

// ── Users (paginated) ─────────────────────────────────────────────────────────

export const listUsers = action({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit, offset }) => {
    await assertAdmin(ctx);
    return turso.listUsers({ limit: limit ?? 50, offset: offset ?? 0 });
  },
});

export const getUserById = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await assertAdmin(ctx);
    const user = await turso.getUser(userId);
    if (!user) throw new ConvexError("not_found");
    return user;
  },
});

// ── Listings (admin view) ─────────────────────────────────────────────────────

export const listPendingListings = action({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, { limit, offset }) => {
    await assertAdmin(ctx);
    return turso.getPendingListings({ limit: limit ?? 50, offset: offset ?? 0 });
  },
});

export const approveListings = action({
  args: { listingId: v.number() },
  handler: async (ctx, { listingId }) => {
    const actorId = await assertAdmin(ctx);
    await turso.updateListing(listingId, { status: "ACTIVE" });
    await audit(ctx, "admin.approveListings", { targetType: "listing", targetId: String(listingId) }, actorId);
  },
});

export const rejectListings = action({
  args: { listingId: v.number(), reason: v.string() },
  handler: async (ctx, { listingId, reason }) => {
    const actorId = await assertAdmin(ctx);
    await turso.updateListing(listingId, { status: "REJECTED", rejectionReason: reason });
    await audit(ctx, "admin.rejectListings", { targetType: "listing", targetId: String(listingId), reason }, actorId);
  },
});

// ── Disputes ──────────────────────────────────────────────────────────────────

export const listDisputedDeals = action({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, { limit, offset }) => {
    await assertAdmin(ctx);
    return turso.getDisputedDeals({ limit: limit ?? 50, offset: offset ?? 0 });
  },
});

export const resolveDispute = action({
  args: {
    dealId: v.number(),
    resolution: v.union(v.literal("refund"), v.literal("release")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { dealId, resolution, notes }) => {
    const actorId = await assertAdmin(ctx);

    if (resolution === "refund") {
      await turso.txRefund(dealId, notes ?? "Admin resolved: refund");
    } else {
      await turso.markEscrowCompleted(dealId);
    }

    await audit(ctx, "admin.resolveDispute", {
      targetType: "deal",
      targetId: String(dealId),
      resolution,
      notes,
    }, actorId);
  },
});

// ── Audit log ─────────────────────────────────────────────────────────────────

export const listAuditLogs = action({
  args: {
    actorId: v.optional(v.string()),
    action: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    return turso.listAuditLogs(args);
  },
});

// ── Activity stream (reactive) ────────────────────────────────────────────────

export const streamActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("unauthenticated");
    const role = (identity.publicMetadata as Record<string, unknown>)?.role;
    if (role !== "admin") throw new ConvexError("forbidden");

    return ctx.db
      .query("userActivity")
      .withIndex("by_created", (q) => q.gt("createdAt", 0))
      .order("desc")
      .take(limit ?? 50);
  },
});

// ── Impersonation (time-limited 15 min via Clerk) ────────────────────────────

export const startImpersonation = action({
  args: { targetUserId: v.string() },
  handler: async (ctx, { targetUserId }) => {
    const actorId = await assertAdmin(ctx);

    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });
    // Create a time-limited impersonation sign-in token (15 min)
    const token = await clerkClient.signInTokens.createSignInToken({
      userId: targetUserId,
      expiresInSeconds: 15 * 60,
    });

    await audit(ctx, "admin.impersonation.start", {
      targetType: "user",
      targetId: targetUserId,
    }, actorId);

    return { token: token.token };
  },
});

export const endImpersonation = action({
  args: { targetUserId: v.string() },
  handler: async (ctx, { targetUserId }) => {
    const actorId = await assertAdmin(ctx);
    await audit(ctx, "admin.impersonation.end", {
      targetType: "user",
      targetId: targetUserId,
    }, actorId);
  },
});
