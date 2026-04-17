import { action, internalQuery, internalMutation } from "convex/server";
import { v } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { internal } from "./_generated/api";

// ── Convex FTS query (runs inside Convex DB — no external calls) ──────────────

export const convexSearch = internalQuery({
  args: {
    queryText: v.string(),
    category: v.optional(v.string()),
    locationCity: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { queryText, category, locationCity, limit }) => {
    const results = await ctx.db
      .query("listings")
      .withSearchIndex("search_title", (s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = s.search("title", queryText).eq("status", "ACTIVE");
        if (category) q = q.eq("category", category);
        if (locationCity) q = q.eq("locationCity", locationCity);
        return q;
      })
      .take(limit ?? 20);
    return results;
  },
});

// ── Algolia sync helper (called from listings.syncListingToConvex) ────────────

export const syncListingToAlgolia = internalMutation({
  args: {
    listingId: v.number(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    locationCity: v.string(),
    status: v.string(),
    isPremium: v.boolean(),
    sellerId: v.string(),
    createdAt: v.number(),
  },
  handler: async (_ctx, listing) => {
    // Mutations cannot make external HTTP calls.
    // Algolia sync is done via the HTTP action below — this is a no-op stub
    // so call sites compile. The real sync happens in search.algoliaSync action.
    void listing;
  },
});

// ── Public search action (chooses engine based on env) ───────────────────────

export const search = action({
  args: {
    queryText: v.string(),
    category: v.optional(v.string()),
    locationCity: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAuth(ctx);
    const engine = process.env.SEARCH_ENGINE ?? "convex";

    if (engine === "algolia") {
      return algoliaSearch(ctx, args);
    }

    // Default: Convex FTS (no external calls, free)
    return ctx.runQuery(internal.search.convexSearch, {
      queryText: args.queryText,
      category: args.category,
      locationCity: args.locationCity,
      limit: args.limit ?? 20,
    });
  },
});

// ── Algolia search (used only when SEARCH_ENGINE=algolia) ────────────────────

async function algoliaSearch(
  _ctx: unknown,
  args: {
    queryText: string;
    category?: string;
    locationCity?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    cursor?: number;
  },
) {
  const appId = process.env.ALGOLIA_APP_ID;
  const key = process.env.ALGOLIA_SEARCH_API_KEY;
  const index = process.env.ALGOLIA_INDEX_NAME ?? "listings";

  if (!appId || !key) throw new Error("Algolia not configured");

  const facetFilters: string[] = ["status:ACTIVE"];
  if (args.category) facetFilters.push(`category:${args.category}`);

  const numericFilters: string[] = [];
  if (args.minPrice !== undefined) numericFilters.push(`price>=${args.minPrice}`);
  if (args.maxPrice !== undefined) numericFilters.push(`price<=${args.maxPrice}`);

  const res = await fetch(
    `https://${appId}-dsn.algolia.net/1/indexes/${index}/query`,
    {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": appId,
        "X-Algolia-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: args.queryText,
        hitsPerPage: args.limit ?? 20,
        facetFilters: [facetFilters],
        numericFilters: numericFilters.length > 0 ? numericFilters : undefined,
      }),
    },
  );

  if (!res.ok) throw new Error(`Algolia error ${res.status}`);
  const data = await res.json();
  return data.hits ?? [];
}

// ── Algolia index-sync action (called from listings action after upsert) ──────

export const algoliaSync = action({
  args: {
    listingId: v.number(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    locationCity: v.string(),
    status: v.string(),
    isPremium: v.boolean(),
    sellerId: v.string(),
    createdAt: v.number(),
  },
  handler: async (_ctx, listing) => {
    const appId = process.env.ALGOLIA_APP_ID;
    const writeKey = process.env.ALGOLIA_WRITE_API_KEY;
    const index = process.env.ALGOLIA_INDEX_NAME ?? "listings";

    if (!appId || !writeKey) return; // no-op when Algolia not configured

    // Only index ACTIVE listings to stay inside 10k Algolia free-tier record limit
    if (listing.status !== "ACTIVE") {
      await fetch(
        `https://${appId}.algolia.net/1/indexes/${index}/${listing.listingId}`,
        {
          method: "DELETE",
          headers: {
            "X-Algolia-Application-Id": appId,
            "X-Algolia-API-Key": writeKey,
          },
        },
      );
      return;
    }

    await fetch(
      `https://${appId}.algolia.net/1/indexes/${index}/${listing.listingId}`,
      {
        method: "PUT",
        headers: {
          "X-Algolia-Application-Id": appId,
          "X-Algolia-API-Key": writeKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectID: String(listing.listingId), ...listing }),
      },
    );
  },
});

