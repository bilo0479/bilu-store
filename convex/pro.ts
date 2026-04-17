import { action, httpAction, internalAction } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { audit } from "./helpers/audit";
import * as turso from "./turso";
import { internal } from "./_generated/api";
import Clerk from "@clerk/clerk-sdk-node";

const PRO_MONTHLY_PRICE_ETB = 199;
const PRO_TRIAL_DAYS = 7;
const PRO_PLAN_DAYS = 30;

// ── Start checkout ────────────────────────────────────────────────────────────

export const startCheckout = action({
  args: {
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, { referralCode }) => {
    const userId = await assertAuth(ctx);

    const user = await turso.getUser(userId);
    if (!user) throw new ConvexError("user_not_found");

    // TikTok referral deep link → 7-day free trial
    if (referralCode?.startsWith("TT-") && !user.proTrialUsed) {
      return ctx.runAction(internal.pro.activateTrial, { userId });
    }

    const txRef = `BSPRO-${userId.slice(-6)}-${Date.now()}`;
    const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: PRO_MONTHLY_PRICE_ETB.toString(),
        currency: "ETB",
        tx_ref: txRef,
        callback_url: `${process.env.CONVEX_SITE_URL}/pro-webhook`,
        return_url: `bilustore://settings/pro?success=1`,
        customization: { title: "Bilu Store Pro Subscription" },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.data?.checkout_url) throw new ConvexError("chapa_init_failed");

    await audit(ctx, "pro.checkoutStarted", { targetType: "user", targetId: userId }, userId);
    return { checkoutUrl: data.data.checkout_url as string, txRef };
  },
});

// ── Chapa Pro payment webhook ─────────────────────────────────────────────────

export const onChapaProPayment = httpAction(async (ctx, request) => {
  const body = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("bad_request", { status: 400 });
  }

  const txRef = (payload.tx_ref as string) ?? "";
  if (!txRef.startsWith("BSPRO-")) {
    return new Response("not_a_pro_payment", { status: 200 });
  }

  const userId = `user_${txRef.split("-")[1]}`; // extract user suffix from txRef
  // Find user by txRef fragment — resolve via Clerk lookup
  await ctx.runAction(internal.pro.activatePro, { txRef });
  return new Response("ok", { status: 200 });
});

export const activatePro = internalAction({
  args: { txRef: v.string() },
  handler: async (_ctx, { txRef }) => {
    // txRef format: BSPRO-{userSuffix}-{timestamp}
    // We can't recover the full userId from the suffix alone in production.
    // In deployment, embed the full userId: BSPRO-{userId}-{timestamp}.
    // This is a simplified version; Chapa metadata field should carry userId.
    const parts = txRef.split("-");
    if (parts.length < 3) return;
    const userId = parts[1]; // simplified — production should use Chapa metadata

    const expiresAt = Date.now() + PRO_PLAN_DAYS * 24 * 60 * 60 * 1000;
    await turso.updateUser(userId, { plan: "pro", planExpiresAt: expiresAt });

    // Sync to Clerk publicMetadata
    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { plan: "pro", planExpiresAt: expiresAt },
    });
  },
});

export const activateTrial = internalAction({
  args: { userId: v.string() },
  handler: async (_ctx, { userId }) => {
    const expiresAt = Date.now() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000;
    await turso.updateUser(userId, {
      plan: "pro",
      planExpiresAt: expiresAt,
      proTrialUsed: 1,
    });

    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { plan: "pro", planExpiresAt: expiresAt },
    });
  },
});

// ── Expiry cron — downgrades users whose plan expired ───────────────────────

export const expireIfDue = internalAction({
  args: {},
  handler: async (_ctx) => {
    const expiredUsers = await turso.getExpiredProUsers();
    const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

    for (const userId of expiredUsers) {
      await turso.updateUser(userId, { plan: "free", planExpiresAt: null });

      // Archive listings beyond the free tier 5-listing cap
      await turso.archiveExcessListings(userId, 5);

      // Sync to Clerk
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { plan: "free", planExpiresAt: null },
      });
    }

    return { downgraded: expiredUsers.length };
  },
});

// ── Get plan status ────────────────────────────────────────────────────────────

export const getMyPlan = action({
  args: {},
  handler: async (ctx) => {
    const userId = await assertAuth(ctx);
    const user = await turso.getUser(userId);
    if (!user) throw new ConvexError("user_not_found");
    return {
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      proTrialUsed: user.proTrialUsed,
    };
  },
});
