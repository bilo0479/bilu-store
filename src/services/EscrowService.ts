/**
 * EscrowService — routed through Convex actions → Turso.
 * Firebase/Firestore references removed.
 */
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { EscrowRow } from "@bilustore/shared";

let _client: ConvexReactClient | null = null;

export function setConvexClient(client: ConvexReactClient) {
  _client = client;
}

function client(): ConvexReactClient {
  if (!_client) throw new Error("Convex client not initialised");
  return _client;
}

export async function initiateEscrow(
  listingId: number,
  paymentMethod: "CHAPA" | "TELEBIRR",
): Promise<{ dealId: number; checkoutUrl: string }> {
  return client().action(api.escrow.initiate, { listingId, paymentMethod });
}

export async function verifyDelivery(
  dealId: number,
  code: string,
): Promise<{ payoutReleaseAt: number }> {
  return client().action(api.escrow.verify, { dealId, code });
}

export async function requestRefund(dealId: number, reason: string): Promise<void> {
  await client().action(api.escrow.dispute, { dealId, reason });
}

export async function fetchEscrowDeal(dealId: number): Promise<EscrowRow | null> {
  try {
    return await client().action(api.escrow.getDeal, { dealId });
  } catch {
    return null;
  }
}

export async function fetchBuyerCode(
  dealId: number,
): Promise<{ code: string; expiresAt: number } | null> {
  try {
    return await client().action(api.escrow.getBuyerCode, { dealId });
  } catch {
    return null;
  }
}
