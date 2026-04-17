import { action, internalAction } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { assertAdmin } from "./helpers/assertAdmin";
import { requireReauth } from "./helpers/requireReauth";
import { withRateLimit } from "./helpers/withRateLimit";
import { audit } from "./helpers/audit";
import * as turso from "./turso";
import Clerk from "@clerk/clerk-sdk-node";

// ── Profile ───────────────────────────────────────────────────────────────────

export const getMyProfile = action({
  args: {},
  handler: async (ctx) => {
    const userId = await assertAuth(ctx);
    const user = await turso.getUser(userId);
    if (!user) throw new ConvexError("user_not_found");
    return user;
  },
});

export const updateProfile = action({
  args: {
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `user.updateProfile:${userId}`, 10);
    await turso.updateUser(userId, {
      ...(args.name && { name: args.name }),
      ...(args.city !== undefined && { city: args.city }),
      ...(args.lat !== undefined && { lat: args.lat }),
      ...(args.lng !== undefined && { lng: args.lng }),
      ...(args.avatarUrl && { avatarUrl: args.avatarUrl }),
    });
    return turso.getUser(userId);
  },
});

export const updatePayoutAccount = action({
  args: { payoutAccountJson: v.string() },
  handler: async (ctx, { payoutAccountJson }) => {
    const userId = await assertAuth(ctx);
    await requireReauth(ctx, 5);

    // Basic JSON validation
    try { JSON.parse(payoutAccountJson); } catch { throw new ConvexError("invalid_json"); }

    await turso.updateUser(userId, { payoutAccountJson });
    await audit(ctx, "user.updatePayoutAccount", { targetType: "user", targetId: userId }, userId);
  },
});

export const onClerkUserCreated = internalAction({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const now = Date.now();
    await turso.upsertUser({
      id: args.clerkId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      createdAt: now,
      lastLoginAt: now,
    });
  },
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminBanUser = action({
  args: { userId: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, { userId, reason }) => {
    const actorId = await assertAdmin(ctx);
    await requireReauth(ctx, 5);

    await turso.updateUser(userId, { banned: 1 });

    // Revoke Clerk session immediately
    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerkClient.users.banUser(userId);

    await audit(ctx, "admin.ban", { targetType: "user", targetId: userId, reason }, actorId);
  },
});

export const adminShadowBan = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const actorId = await assertAdmin(ctx);
    await turso.updateUser(userId, { visibilityScore: 0 });
    await audit(ctx, "admin.shadowBan", { targetType: "user", targetId: userId }, actorId);
  },
});

export const adminSetVerificationTier = action({
  args: { userId: v.string(), tier: v.number() },
  handler: async (ctx, { userId, tier }) => {
    const actorId = await assertAdmin(ctx);
    if (![1,2,3].includes(tier)) throw new ConvexError("invalid_tier");

    await turso.updateUser(userId, { verificationTier: tier });

    // Sync to Clerk publicMetadata
    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { verificationTier: tier },
    });

    await audit(ctx, "admin.setVerificationTier", { targetType: "user", targetId: userId, tier }, actorId);
  },
});

export const adminSetRole = action({
  args: { userId: v.string(), role: v.string() },
  handler: async (ctx, { userId, role }) => {
    const actorId = await assertAdmin(ctx);
    if (!["buyer","seller","admin"].includes(role)) throw new ConvexError("invalid_role");

    await turso.updateUser(userId, { role: role as "buyer" | "seller" | "admin" });

    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    await audit(ctx, "admin.setRole", { targetType: "user", targetId: userId, role }, actorId);
  },
});
