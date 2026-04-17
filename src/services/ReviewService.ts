/**
 * ReviewService — routed through Convex actions → Turso.
 * Firebase/Firestore references removed.
 */
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { ReviewRow } from "@bilustore/shared";

let _client: ConvexReactClient | null = null;

export function setConvexClient(client: ConvexReactClient) {
  _client = client;
}

function client(): ConvexReactClient {
  if (!_client) throw new Error("Convex client not initialised");
  return _client;
}

export async function fetchReviews(sellerId: string, limit = 20): Promise<ReviewRow[]> {
  return client().action(api.reviews.getSellerReviews, { sellerId, limit });
}

export async function submitReview(input: {
  dealId: number;
  sellerId: string;
  rating: number;
  comment?: string;
}): Promise<ReviewRow> {
  return client().action(api.reviews.createReview, input);
}
