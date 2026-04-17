/**
 * AdService — all listing CRUD now routed through Convex actions → Turso.
 * Firebase/Firestore references removed.
 */
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { ListingRow } from "@bilustore/shared";
import type { CreateAdInput, UpdateAdInput, SearchFilters } from "../types";

// Convex client singleton — initialised by ConvexProviderWithClerk in _layout.tsx.
// Services only need the client for one-shot imperative calls outside React hooks.
let _client: ConvexReactClient | null = null;

export function setConvexClient(client: ConvexReactClient) {
  _client = client;
}

function client(): ConvexReactClient {
  if (!_client) throw new Error("Convex client not initialised");
  return _client;
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export async function fetchHomeFeed(opts: {
  cursor?: number;
  limit?: number;
} = {}): Promise<{ items: ListingRow[]; cursor: number | null; hasMore: boolean }> {
  const items = await client().action(api.listings.getFeed, {
    cursor: opts.cursor,
    limit: opts.limit ?? 20,
  });
  const last = items[items.length - 1];
  return {
    items,
    cursor: items.length === (opts.limit ?? 20) ? (last?.id ?? null) : null,
    hasMore: items.length === (opts.limit ?? 20),
  };
}

export async function fetchAdsByCategory(
  category: string,
  cursor?: number,
): Promise<{ items: ListingRow[]; cursor: number | null; hasMore: boolean }> {
  const items = await client().action(api.listings.getFeed, { category, cursor, limit: 20 });
  const last = items[items.length - 1];
  return {
    items,
    cursor: items.length === 20 ? (last?.id ?? null) : null,
    hasMore: items.length === 20,
  };
}

export async function fetchAdById(id: number): Promise<ListingRow | null> {
  try {
    return await client().action(api.listings.getListingById, { id });
  } catch {
    return null;
  }
}

export async function fetchUserAds(): Promise<ListingRow[]> {
  return client().action(api.listings.getMyListings, {});
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createAd(input: CreateAdInput): Promise<ListingRow> {
  return client().action(api.listings.createListing, {
    title: input.title,
    description: input.description,
    category: input.category,
    subcategory: input.subcategory ?? undefined,
    price: input.price,
    condition: input.condition ?? undefined,
    negotiable: input.negotiable ?? true,
    contactPref: input.contactPref ?? "CHAT_ONLY",
    locationCity: input.locationCity,
    lat: input.coordinates?.latitude,
    lng: input.coordinates?.longitude,
    images: input.images,
    thumbnails: input.images, // thumbnails generated server-side in P5
  });
}

export async function updateAd(id: number, updates: UpdateAdInput): Promise<ListingRow | null> {
  return client().action(api.listings.updateListing, {
    id,
    title: updates.title,
    description: updates.description,
    price: updates.price,
    locationCity: updates.locationCity,
    images: updates.images,
  });
}

export async function deleteAd(id: number): Promise<void> {
  await client().action(api.listings.deleteListing, { id });
}

// ── Search (delegated to SearchService / Algolia in P5) ───────────────────────

export async function searchAds(queryText: string, filters: SearchFilters): Promise<ListingRow[]> {
  return client().action(api.listings.getFeed, {
    category: filters.categoryId,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    limit: 50,
  });
}

export async function getFeaturedAds(maxItems = 10): Promise<ListingRow[]> {
  const items = await client().action(api.listings.getFeed, { limit: maxItems });
  return items.filter((l) => l.isPremium);
}
