import { mutation, query, internalMutation } from "convex/server";
import { v, ConvexError } from "convex/values";
import { assertAuth } from "./helpers/assertAuth";
import { withRateLimit } from "./helpers/withRateLimit";
import { audit } from "./helpers/audit";

// ── Queries ───────────────────────────────────────────────────────────────

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await assertAuth(ctx);

    const asBuyer = await ctx.db
      .query("conversations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", userId))
      .order("desc")
      .take(50);

    const asSeller = await ctx.db
      .query("conversations")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .take(50);

    // Merge and deduplicate, sorted by lastMessageAt desc
    const all = [...asBuyer, ...asSeller]
      .filter((c, i, arr) => arr.findIndex((x) => x._id === c._id) === i)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return all;
  },
});

export const listMessages = query({
  args: { conversationId: v.id("conversations"), cursor: v.optional(v.number()) },
  handler: async (ctx, { conversationId, cursor }) => {
    const userId = await assertAuth(ctx);
    const conv = await ctx.db.get(conversationId);
    if (!conv) throw new ConvexError("not_found");
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ConvexError("forbidden");
    }

    let q = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId));

    if (cursor) {
      q = q.filter((q) => q.lt(q.field("createdAt"), cursor));
    }

    return q.order("desc").take(50);
  },
});

export const getOrCreateConversation = query({
  args: { listingId: v.number(), sellerId: v.string() },
  handler: async (ctx, { listingId, sellerId }) => {
    const buyerId = await assertAuth(ctx);
    if (buyerId === sellerId) throw new ConvexError("cannot_chat_with_self");

    return ctx.db
      .query("conversations")
      .withIndex("by_pair_listing", (q) =>
        q.eq("listingId", listingId).eq("buyerId", buyerId).eq("sellerId", sellerId),
      )
      .first();
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────

export const createConversation = mutation({
  args: { listingId: v.number(), sellerId: v.string() },
  handler: async (ctx, { listingId, sellerId }) => {
    const buyerId = await assertAuth(ctx);
    await withRateLimit(ctx, `chat.create:${buyerId}`, 10);
    if (buyerId === sellerId) throw new ConvexError("cannot_chat_with_self");

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_pair_listing", (q) =>
        q.eq("listingId", listingId).eq("buyerId", buyerId).eq("sellerId", sellerId),
      )
      .first();
    if (existing) return existing._id;

    return ctx.db.insert("conversations", {
      listingId,
      buyerId,
      sellerId,
      lastMessageAt: Date.now(),
      unreadByBuyer: 0,
      unreadBySeller: 0,
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { conversationId, text, imageUrl }) => {
    const userId = await assertAuth(ctx);
    await withRateLimit(ctx, `chat.send:${userId}`, 30);

    if (!text?.trim() && !imageUrl) throw new ConvexError("empty_message");

    const conv = await ctx.db.get(conversationId);
    if (!conv) throw new ConvexError("not_found");
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ConvexError("forbidden");
    }

    const msgId = await ctx.db.insert("messages", {
      conversationId,
      senderId: userId,
      text: text?.trim(),
      imageUrl,
      createdAt: Date.now(),
    });

    const isBuyer = conv.buyerId === userId;
    await ctx.db.patch(conversationId, {
      lastMessage: text?.slice(0, 100) ?? "📷 Image",
      lastMessageAt: Date.now(),
      unreadByBuyer: isBuyer ? conv.unreadByBuyer : conv.unreadByBuyer + 1,
      unreadBySeller: isBuyer ? conv.unreadBySeller + 1 : conv.unreadBySeller,
    });

    await audit(ctx, "chat.send", { targetType: "conversation", targetId: conversationId });
    return msgId;
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await assertAuth(ctx);
    const conv = await ctx.db.get(conversationId);
    if (!conv) throw new ConvexError("not_found");
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ConvexError("forbidden");
    }

    const isBuyer = conv.buyerId === userId;
    await ctx.db.patch(conversationId, {
      unreadByBuyer: isBuyer ? 0 : conv.unreadByBuyer,
      unreadBySeller: isBuyer ? conv.unreadBySeller : 0,
    });
  },
});

// ── Internal (used by push notification trigger) ──────────────────────────

export const getConversationParties = internalMutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    return ctx.db.get(conversationId);
  },
});
