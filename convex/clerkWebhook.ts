import { httpAction, internalMutation } from "convex/server";
import { v } from "convex/values";
import { Webhook } from "svix";

// ── Types ─────────────────────────────────────────────────────────────────

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    public_metadata: Record<string, unknown>;
  };
}

interface ClerkUserUpdatedEvent {
  type: "user.updated";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    public_metadata: Record<string, unknown>;
  };
}

interface ClerkSessionEndedEvent {
  type: "session.ended";
  data: { user_id: string };
}

type ClerkEvent = ClerkUserCreatedEvent | ClerkUserUpdatedEvent | ClerkSessionEndedEvent;

// ── HTTP handler ──────────────────────────────────────────────────────────

export const handleClerkWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await request.text();

  let event: ClerkEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  if (event.type === "user.created") {
    await ctx.runMutation(internal.clerkWebhook.onUserCreated, {
      clerkId: event.data.id,
      email: event.data.email_addresses[0]?.email_address ?? null,
      name: [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") || "User",
      avatarUrl: event.data.image_url,
      role: (event.data.public_metadata.role as string) ?? "buyer",
      plan: (event.data.public_metadata.plan as string) ?? "free",
    });
  } else if (event.type === "user.updated") {
    await ctx.runMutation(internal.clerkWebhook.onUserUpdated, {
      clerkId: event.data.id,
      email: event.data.email_addresses[0]?.email_address ?? null,
      name: [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") || "User",
      avatarUrl: event.data.image_url,
      role: (event.data.public_metadata.role as string) ?? "buyer",
      plan: (event.data.public_metadata.plan as string) ?? "free",
    });
  }
  // session.ended: no action needed at Convex level — Clerk handles session revocation

  return new Response(null, { status: 200 });
});

// ── Internal mutations ────────────────────────────────────────────────────

export const onUserCreated = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (existing) return; // idempotent

    await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl ?? undefined,
      role: (args.role as "buyer" | "seller" | "admin") ?? "buyer",
      plan: (args.plan as "free" | "pro") ?? "free",
      verificationTier: 1,
      banned: false,
      createdAt: Date.now(),
    });
    // P4 will also: await turso.insertUser({ id: args.clerkId, ... })
  },
});

export const onUserUpdated = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl ?? undefined,
        role: (args.role as "buyer" | "seller" | "admin"),
        plan: (args.plan as "free" | "pro"),
      });
    } else {
      await ctx.runMutation(internal.clerkWebhook.onUserCreated, args);
    }
  },
});

// Needed for self-referencing internal calls above
import { internal } from "./_generated/api";
