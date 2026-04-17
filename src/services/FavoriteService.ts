/**
 * FavoriteService — routed through Convex actions → Turso.
 * Firebase/Firestore references removed.
 */
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

let _client: ConvexReactClient | null = null;

export function setConvexClient(client: ConvexReactClient) {
  _client = client;
}

function client(): ConvexReactClient {
  if (!_client) throw new Error("Convex client not initialised");
  return _client;
}

export async function fetchFavoriteIds(): Promise<number[]> {
  return client().action(api.favorites.getFavorites, {});
}

export async function toggleFavorite(listingId: number): Promise<"added" | "removed"> {
  return client().action(api.favorites.toggleFavorite, { listingId });
}

export async function isFavorited(listingId: number): Promise<boolean> {
  const ids = await fetchFavoriteIds();
  return ids.includes(listingId);
}
