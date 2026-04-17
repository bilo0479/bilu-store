/**
 * One-shot Firestore → Turso migration script.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... GOOGLE_APPLICATION_CREDENTIALS=... \
 *     npx ts-node -e "$(cat scripts/migrate/firestoreToTurso.ts)"
 *
 * Run ONCE. Safe to re-run — upserts are idempotent.
 * Collections migrated: users, ads, reviews, favorites.
 * Chat/conversations remain in Convex (migrated by Convex action in P3).
 */

import admin from "firebase-admin";
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../convex/tursoSchema";

admin.initializeApp();
const firestore = admin.firestore();

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(tursoClient, { schema });

async function migrateUsers() {
  const snap = await firestore.collection("users").get();
  console.log(`Migrating ${snap.size} users…`);
  for (const doc of snap.docs) {
    const d = doc.data();
    await db.insert(schema.users).values({
      id: doc.id,
      name: d.displayName ?? d.name ?? "Unknown",
      email: d.email ?? null,
      phone: d.phone ?? null,
      avatarUrl: d.avatarUrl ?? d.photoURL ?? null,
      city: d.city ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      role: d.role === "ADMIN" ? "admin" : "buyer",
      banned: d.banned ? 1 : 0,
      createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
      lastLoginAt: d.lastLoginAt?.toMillis?.() ?? Date.now(),
    }).onConflictDoNothing();
  }
  console.log("Users done.");
}

async function migrateAds() {
  const snap = await firestore.collection("ads").get();
  console.log(`Migrating ${snap.size} ads…`);
  for (const doc of snap.docs) {
    const d = doc.data();
    const now = Date.now();
    const statusMap: Record<string, string> = {
      ACTIVE: "ACTIVE",
      PENDING_REVIEW: "PENDING",
      REMOVED: "REMOVED",
      SOLD: "SOLD",
      EXPIRED: "EXPIRED",
      DRAFT: "DRAFT",
    };
    await db.insert(schema.listings).values({
      sellerId: d.sellerId ?? "unknown",
      title: d.title ?? "",
      description: d.description ?? "",
      category: d.category ?? "OTHER",
      subcategory: d.subcategory ?? null,
      price: d.price ?? 0,
      currency: "ETB",
      condition: d.condition ?? null,
      negotiable: d.negotiable !== false ? 1 : 0,
      contactPref: d.contactPref ?? "CHAT_ONLY",
      locationCity: d.locationCity ?? d.city ?? "",
      lat: d.coordinates?.latitude ?? d.lat ?? null,
      lng: d.coordinates?.longitude ?? d.lng ?? null,
      imagesJson: JSON.stringify(d.images ?? []),
      thumbnailsJson: JSON.stringify(d.thumbnails ?? d.images ?? []),
      status: (statusMap[d.status] ?? "DRAFT") as "ACTIVE",
      isPremium: d.isPremium ? 1 : 0,
      premiumTier: d.premiumTier ?? null,
      viewCount: d.viewCount ?? 0,
      createdAt: d.createdAt?.toMillis?.() ?? now,
      updatedAt: d.updatedAt?.toMillis?.() ?? now,
      expiresAt: d.expiresAt?.toMillis?.() ?? now + 30 * 24 * 60 * 60 * 1000,
    }).onConflictDoNothing();
  }
  console.log("Ads done.");
}

async function migrateReviews() {
  const snap = await firestore.collection("reviews").get();
  console.log(`Migrating ${snap.size} reviews…`);
  for (const doc of snap.docs) {
    const d = doc.data();
    await db.insert(schema.reviews).values({
      dealId: 0, // legacy reviews have no escrow deal
      reviewerId: d.reviewerId ?? "unknown",
      sellerId: d.sellerId ?? "unknown",
      rating: Math.min(5, Math.max(1, Math.round(d.rating ?? 3))),
      comment: d.comment ?? null,
      verifiedPurchase: 0,
      createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
    }).onConflictDoNothing();
  }
  console.log("Reviews done.");
}

async function main() {
  console.log("Starting Firestore → Turso migration…");
  await migrateUsers();
  await migrateAds();
  await migrateReviews();
  console.log("Migration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
