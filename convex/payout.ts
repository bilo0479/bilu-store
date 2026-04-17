import { internalAction } from "convex/server";
import { v, ConvexError } from "convex/values";
import * as turso from "./turso";

// Commission rate kept in sync with escrow.ts
const COMMISSION_RATE = 0.095;

export const send = internalAction({
  args: {
    dealId: v.number(),
    method: v.union(v.literal("CHAPA"), v.literal("TELEBIRR")),
    sellerId: v.string(),
    amount: v.number(),
  },
  handler: async (_ctx, { dealId, method, sellerId, amount }) => {
    const seller = await turso.getUser(sellerId);
    if (!seller) throw new ConvexError("seller_not_found");

    let payoutAccount: Record<string, string>;
    try {
      payoutAccount = JSON.parse(seller.payoutAccountJson ?? "null");
      if (!payoutAccount) throw new Error("no account");
    } catch {
      throw new ConvexError("payout_account_not_configured");
    }

    if (method === "CHAPA") {
      await chapaTransfer({ dealId, amount, account: payoutAccount });
    } else {
      await telebirrB2C({ dealId, amount, account: payoutAccount });
    }

    // Mark deal completed in Turso
    await turso.markEscrowCompleted(dealId);
  },
});

async function chapaTransfer(opts: {
  dealId: number;
  amount: number;
  account: Record<string, string>;
}) {
  const res = await fetch("https://api.chapa.co/v1/transfers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_name: opts.account.accountName,
      account_number: opts.account.accountNumber,
      amount: opts.amount.toString(),
      currency: "ETB",
      reference: `BSP-${opts.dealId}-${Date.now()}`,
      bank_code: opts.account.bankCode,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new ConvexError(`chapa_transfer_failed: ${err}`);
  }
}

async function telebirrB2C(opts: {
  dealId: number;
  amount: number;
  account: Record<string, string>;
}) {
  const res = await fetch(`${process.env.TELEBIRR_GATEWAY_URL}/b2c/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.TELEBIRR_API_KEY ?? "",
    },
    body: JSON.stringify({
      msisdn: opts.account.phone,
      amount: opts.amount.toString(),
      outTradeNo: `BSP-${opts.dealId}-${Date.now()}`,
      subject: "Bilu Store Payout",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new ConvexError(`telebirr_b2c_failed: ${err}`);
  }
}
