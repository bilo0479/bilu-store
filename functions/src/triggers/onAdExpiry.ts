import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "../utils/fcm";

/**
 * Daily scheduled job that expires ads whose 30-day TTL has passed.
 * Ads with expiresAt < now and status ACTIVE are set to EXPIRED.
 * Sellers receive a push notification with a republish prompt.
 */
export const onAdExpiry = functions.pubsub
  .schedule("30 0 * * *") // Daily at 00:30 UTC (offset from onPremiumExpiry at 00:00)
  .timeZone("UTC")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expiredSnapshot = await db
      .collection("ads")
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<", now.toMillis())
      .get();

    if (expiredSnapshot.empty) {
      console.log("No ads to expire.");
      return;
    }

    console.log(`Expiring ${expiredSnapshot.size} ad(s)...`);

    // Process in batches of 500 (Firestore batch limit)
    const BATCH_LIMIT = 500;
    const docs = expiredSnapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const chunk = docs.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();

      for (const doc of chunk) {
        // Expire the ad
        batch.update(doc.ref, {
          status: "EXPIRED",
          updatedAt: Date.now(),
        });

        // Write status history entry
        const historyRef = db
          .collection("ads")
          .doc(doc.id)
          .collection("status_history")
          .doc();
        batch.set(historyRef, {
          fromStatus: "ACTIVE",
          toStatus: "EXPIRED",
          changedAt: admin.firestore.FieldValue.serverTimestamp(),
          changedBy: "system",
          reason: "Ad listing expired after 30 days",
        });
      }

      await batch.commit();
    }

    // Notify sellers after batch commits
    const notifyPromises = docs.map(async (doc) => {
      const data = doc.data();
      const sellerId = data.sellerId as string | undefined;
      const adTitle = (data.title as string) || "your ad";

      if (!sellerId) return;

      const sellerDoc = await db.collection("users").doc(sellerId).get();
      const sellerData = sellerDoc.data();

      if (!sellerData?.pushToken) return;

      await sendPushNotification(
        sellerData.pushToken as string,
        "Listing Expired",
        `"${adTitle}" has expired after 30 days. Republish to keep it visible.`,
        {
          type: "AD_EXPIRED",
          adId: doc.id,
          recipientId: sellerId,
        }
      );
    });

    await Promise.allSettled(notifyPromises);

    console.log(`Expired ${docs.length} ad(s) and notified sellers.`);
  });
