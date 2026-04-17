import { action, httpAction, internalAction, internalMutation, internalQuery } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { withRateLimit } from "./helpers/withRateLimit";
import { audit } from "./helpers/audit";
import * as turso from "./turso";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";

// Commission rates per PRD §4.4
const COMMISSION_RATE = 0.095; // 9.5%
// Payout window: 8 hours after buyer confirms delivery
const PAYOUT_DELAY_MS = 8 * 60 * 60 * 1000;
// Auto-refund after 48 h if seller never verifies
const COUNTDOWN_WINDOW_MS = 48 * 60 * 60 * 1000;
// Escrow code TTL in Convex (plain code)
const CODE_TTL_MS = 10 * 60 * 1000;
// Max failed verify attempts before lockout
const MAX_VERIFY_ATTEMPTS = 5;

// ── Initiate ──────────────────────────────────────────────────────────────────

export const initiate = action({
  args: {
    listingId: v.number(),
    paymentMethod: v.union(v.literal("CHAPA"), v.literal("TELEBIRR")),
  },
  handler: async (ctx, { listingId, paymentMethod }) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `escrow.initiate:${userId}`, 3);

    const listing = await turso.getListing(listingId);
    if (!listing) throw new ConvexError("listing_not_found");
    if (listing.status !== "ACTIVE") throw new ConvexError("listing_not_active");
    if (listing.sellerId === userId) throw new ConvexError("cannot_buy_own_listing");

    const amount = listing.price;
    const commissionAmount = Math.round(amount * COMMISSION_RATE);
    const payoutAmount = amount - commissionAmount;
    const now = Date.now();

    // Placeholder txRef — updated after we get the auto-incremented dealId
    const deal = await turso.insertEscrow({
      listingId,
      buyerId: userId,
      sellerId: listing.sellerId,
      amount,
      commissionAmount,
      payoutAmount,
      currency: "ETB",
      paymentMethod,
      paymentTxRef: `BSE-${now}-${userId.slice(-6)}`,
      status: "held",
      countdownExpiresAt: now + COUNTDOWN_WINDOW_MS,
      createdAt: now,
    });

    // Embed dealId into txRef so the payment webhook can look up the deal
    const txRef = `BSE-${now}-${userId.slice(-6)}-${deal.id}`;
    await turso.updateEscrowTxRef(deal.id, txRef);

    // Generate Chapa or Telebirr checkout URL
    const checkoutUrl = await ctx.runAction(internal.escrow.buildCheckoutUrl, {
      dealId: deal.id,
      amount,
      txRef,
      method: paymentMethod,
    });

    await audit(ctx, "escrow.initiate", { targetType: "deal", targetId: String(deal.id) }, userId);
    return { dealId: deal.id, checkoutUrl };
  },
});

// ── Build checkout URL (Chapa / Telebirr) ─────────────────────────────────────

export const buildCheckoutUrl = internalAction({
  args: {
    dealId: v.number(),
    amount: v.number(),
    txRef: v.string(),
    method: v.union(v.literal("CHAPA"), v.literal("TELEBIRR")),
  },
  handler: async (_ctx, { dealId, amount, txRef, method }) => {
    if (method === "CHAPA") {
      const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: "ETB",
          tx_ref: txRef,
          callback_url: `${process.env.CONVEX_SITE_URL}/escrow-webhook`,
          return_url: `bilustore://escrow/${dealId}`,
          customization: { title: "Bilu Store Secure Payment" },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.data?.checkout_url) {
        throw new ConvexError("chapa_init_failed");
      }
      return data.data.checkout_url as string;
    }

    // Telebirr — OpenAPI gateway
    const res = await fetch(`${process.env.TELEBIRR_GATEWAY_URL}/payment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.TELEBIRR_API_KEY ?? "",
      },
      body: JSON.stringify({
        outTradeNo: txRef,
        totalAmount: amount.toString(),
        subject: "Bilu Store Purchase",
        notifyUrl: `${process.env.CONVEX_SITE_URL}/escrow-webhook`,
        returnUrl: `bilustore://escrow/${dealId}`,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.toPayUrl) throw new ConvexError("telebirr_init_failed");
    return data.toPayUrl as string;
  },
});

// ── Payment confirmed webhook (Chapa + Telebirr → Convex HTTP) ───────────────

export const onPaymentConfirmed = httpAction(async (ctx, request) => {
  const body = await request.text();
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("bad_request", { status: 400 });
  }

  // Verify Chapa HMAC signature
  const chapaSignature = request.headers.get("Chapa-Signature");
  if (chapaSignature) {
    const secret = process.env.CHAPA_WEBHOOK_SECRET ?? "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const sigBytes = hexToBytes(chapaSignature);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(body));
    if (!valid) return new Response("invalid_signature", { status: 401 });
  }

  const txRef = (payload.tx_ref ?? payload.outTradeNo) as string | undefined;
  if (!txRef) return new Response("missing_tx_ref", { status: 400 });

  await ctx.runAction(internal.escrow.processConfirmedPayment, { txRef });
  return new Response("ok", { status: 200 });
});

export const processConfirmedPayment = internalAction({
  args: { txRef: v.string() },
  handler: async (ctx, { txRef }) => {
    // Find the deal by payment tx ref
    const db = (turso as typeof turso & { getEscrowByTxRef?: unknown });
    // Fallback: search by listing metadata isn't possible, so we embed dealId in txRef
    // txRef format: BSE-{timestamp}-{userId}-{dealId}  ← simplified below
    const parts = txRef.split("-");
    const dealId = parseInt(parts[parts.length - 1], 10);
    if (isNaN(dealId)) return;

    const deal = await turso.getEscrow(dealId);
    if (!deal || deal.status !== "held") return;

    // Generate 6-digit code + bcrypt hash (cost 10 ≈ 60ms on Convex)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const tokenHash = await bcrypt.hash(code, 10);

    // Store hash in Turso (durable) + plain code in Convex with TTL
    await turso.txVerifyEscrow(dealId, tokenHash, Date.now() + PAYOUT_DELAY_MS);
    await ctx.runMutation(internal.escrow.storeEscrowCode, {
      dealId,
      buyerId: deal.buyerId,
      code,
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    // Schedule auto-refund if seller never verifies
    await ctx.scheduler.runAt(
      new Date(Date.now() + COUNTDOWN_WINDOW_MS),
      internal.escrow.autoRefundIfUnverified,
      { dealId },
    );
  },
});

// ── Store plain OTP in Convex (buyer-readable, 10-min TTL) ───────────────────

export const storeEscrowCode = internalMutation({
  args: {
    dealId: v.number(),
    buyerId: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("escrowCodes")
      .withIndex("by_buyer_deal", (q) => q.eq("buyerId", args.buyerId).eq("dealId", args.dealId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { code: args.code, expiresAt: args.expiresAt });
    } else {
      await ctx.db.insert("escrowCodes", {
        dealId: args.dealId,
        buyerId: args.buyerId,
        code: args.code,
        expiresAt: args.expiresAt,
      });
    }
  },
});

// ── Get buyer's code (buyer-only) ─────────────────────────────────────────────

export const getBuyerCode = action({
  args: { dealId: v.number() },
  handler: async (ctx, { dealId }) => {
    const userId = await assertAuth(ctx);

    const deal = await turso.getEscrow(dealId);
    if (!deal) throw new ConvexError("not_found");
    if (deal.buyerId !== userId) throw new ConvexError("forbidden");
    if (deal.status !== "held" && deal.status !== "verified") {
      throw new ConvexError("code_not_available");
    }

    // Read from Convex escrowCodes table
    const row = await ctx.runQuery(internal.escrow.getCodeRow, { dealId, buyerId: userId });
    if (!row || row.expiresAt < Date.now()) throw new ConvexError("code_expired");
    return { code: row.code, expiresAt: row.expiresAt };
  },
});

export const getCodeRow = internalQuery({
  args: { dealId: v.number(), buyerId: v.string() },
  handler: async (ctx, { dealId, buyerId }) => {
    return ctx.db
      .query("escrowCodes")
      .withIndex("by_buyer_deal", (q) => q.eq("buyerId", buyerId).eq("dealId", dealId))
      .first();
  },
});

// ── Verify delivery (seller enters code) ─────────────────────────────────────

export const verify = action({
  args: { dealId: v.number(), code: v.string() },
  handler: async (ctx, { dealId, code }) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `escrow.verify:${userId}:${dealId}`, MAX_VERIFY_ATTEMPTS);

    const deal = await turso.getEscrow(dealId);
    if (!deal) throw new ConvexError("not_found");
    if (deal.sellerId !== userId) throw new ConvexError("forbidden");
    if (deal.status !== "held") throw new ConvexError("already_resolved");
    if (!deal.tokenHash) throw new ConvexError("payment_not_confirmed");

    // Check fail lockout
    if (deal.failedVerifyCount >= MAX_VERIFY_ATTEMPTS) {
      throw new ConvexError("locked_out");
    }

    const match = await bcrypt.compare(code.trim(), deal.tokenHash);
    if (!match) {
      const newCount = await turso.incrementFailedVerify(dealId);
      if (newCount >= MAX_VERIFY_ATTEMPTS) {
        // Auto-dispute on lockout
        await turso.txRefund(dealId, "Locked out after too many failed attempts");
        await audit(ctx, "escrow.lockout", { targetType: "deal", targetId: String(dealId) }, userId);
      }
      throw new ConvexError("wrong_code");
    }

    // Code correct — schedule payout release
    const payoutAt = Date.now() + PAYOUT_DELAY_MS;
    await turso.txVerifyEscrow(dealId, deal.tokenHash, payoutAt);

    await ctx.scheduler.runAt(
      new Date(payoutAt),
      internal.escrow.releasePayout,
      { dealId },
    );

    await audit(ctx, "escrow.verified", { targetType: "deal", targetId: String(dealId) }, userId);
    return { payoutReleaseAt: payoutAt };
  },
});

// ── Dispute ───────────────────────────────────────────────────────────────────

export const dispute = action({
  args: { dealId: v.number(), reason: v.string() },
  handler: async (ctx, { dealId, reason }) => {
    const userId = await assertAuth(ctx);

    const deal = await turso.getEscrow(dealId);
    if (!deal) throw new ConvexError("not_found");
    if (deal.buyerId !== userId && deal.sellerId !== userId) throw new ConvexError("forbidden");
    if (!["held", "verified"].includes(deal.status)) throw new ConvexError("cannot_dispute");

    await turso.txRefund(dealId, reason);
    await audit(ctx, "escrow.dispute", { targetType: "deal", targetId: String(dealId), reason }, userId);
  },
});

// ── Scheduled: auto-refund if countdown expires ───────────────────────────────

export const autoRefundIfUnverified = internalAction({
  args: { dealId: v.number() },
  handler: async (_ctx, { dealId }) => {
    const deal = await turso.getEscrow(dealId);
    if (!deal || deal.status !== "held") return;
    await turso.txRefund(dealId, "Auto-refund: countdown expired without delivery verification");
  },
});

// ── Scheduled: release payout ─────────────────────────────────────────────────

export const releasePayout = internalAction({
  args: { dealId: v.number() },
  handler: async (ctx, { dealId }) => {
    const deal = await turso.getEscrow(dealId);
    if (!deal || deal.status !== "verified") return;

    await ctx.runAction(internal.payout.send, {
      dealId,
      method: deal.paymentMethod,
      sellerId: deal.sellerId,
      amount: deal.payoutAmount,
    });
  },
});

// ── Prune expired escrow codes ────────────────────────────────────────────────

export const pruneExpiredCodes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("escrowCodes")
      .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
      .collect();
    await Promise.all(expired.map((r) => ctx.db.delete(r._id)));
    return { pruned: expired.length };
  },
});

// ── Get deal (buyer or seller) ────────────────────────────────────────────────

export const getDeal = action({
  args: { dealId: v.number() },
  handler: async (ctx, { dealId }) => {
    const userId = await assertAuth(ctx);
    const deal = await turso.getEscrow(dealId);
    if (!deal) throw new ConvexError("not_found");
    if (deal.buyerId !== userId && deal.sellerId !== userId) throw new ConvexError("forbidden");
    return deal;
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

