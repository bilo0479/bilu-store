/**
 * SearchService — delegates to convex/search.ts (Convex FTS or Algolia).
 * Firebase/Firestore fallback removed.
 */
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SearchFilters } from "../types";

let _client: ConvexReactClient | null = null;

export function setConvexClient(client: ConvexReactClient) {
  _client = client;
}

function client(): ConvexReactClient {
  if (!_client) throw new Error("Convex client not initialised");
  return _client;
}

export interface SearchResult {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  locationCity: string;
  images: string[];
  isPremium?: boolean;
  sellerId: string;
  status: string;
  createdAt: number;
  [key: string]: unknown;
}

export async function searchByKeyword(
  queryText: string,
  filters?: SearchFilters,
  limit = 20,
): Promise<SearchResult[]> {
  return client().action(api.search.search, {
    queryText,
    category: filters?.categoryId,
    locationCity: filters?.city,
    minPrice: filters?.minPrice,
    maxPrice: filters?.maxPrice,
    limit,
  }) as Promise<SearchResult[]>;
}

export async function browseWithFilters(
  filters: SearchFilters,
  cursor?: number,
): Promise<{ items: SearchResult[]; cursor: number | null; hasMore: boolean }> {
  const items = await client().action(api.listings.getFeed, {
    category: filters.categoryId,
    locationCity: filters.city,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    cursor,
    limit: 20,
  }) as SearchResult[];

  const last = items[items.length - 1];
  return {
    items,
    cursor: items.length === 20 ? (last?.id ?? null) : null,
    hasMore: items.length === 20,
  };
}
