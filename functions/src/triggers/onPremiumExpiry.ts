import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "../utils/fcm";

export const onPremiumExpiry = functions.pubsub
  .schedule("0 0 * * *") // Daily at midnight UTC
  .timeZone("UTC")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const in24Hours = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 24 * 60 * 60 * 1000
    );

    // 1. Handle expired premium ads
    const expiredSnapshot = await db
      .collection("premium_ads")
      .where("status", "==", "ACTIVE")
      .where("endDate", "<", now)
      .get();

    const expiredBatch = db.batch();
    const expiredSellerIds: string[] = [];

    for (const doc of expiredSnapshot.docs) {
      const data = doc.data();
      const adId = data.adId as string;

      // Update premium_ads doc status to EXPIRED
      expiredBatch.update(doc.ref, { status: "EXPIRED" });

      // Update the ad doc: remove premium flags
      if (adId) {
        const adRef = db.collection("ads").doc(adId);
        expiredBatch.update(adRef, {
          isPremium: false,
          premiumTier: null,
        });
      }

      if (data.sellerId) {
        expiredSellerIds.push(data.sellerId as string);
      }
    }

    if (expiredSnapshot.size > 0) {
      await expiredBatch.commit();
      console.log(
        `Expired ${expiredSnapshot.size} premium ad(s) and updated their ad docs.`
      );
    }

    // 2. Handle premium ads expiring within 24 hours (send warning)
    const expiringSnapshot = await db
      .collection("premium_ads")
      .where("status", "==", "ACTIVE")
      .where("endDate", ">=", now)
      .where("endDate", "<", in24Hours)
      .get();

    for (const doc of expiringSnapshot.docs) {
      const data = doc.data();
      const sellerId = data.sellerId as string | undefined;
      const adId = data.adId as string | undefined;

      if (!sellerId) continue;

      const sellerDoc = await db.collection("users").doc(sellerId).get();
      const sellerData = sellerDoc.data();

      if (!sellerData?.pushToken) continue;

      let adTitle = "your ad";
      if (adId) {
        const adDoc = await db.collection("ads").doc(adId).get();
        adTitle = (adDoc.data()?.title as string) || "your ad";
      }

      await sendPushNotification(
        sellerData.pushToken,
        "Premium Expiring Soon",
        `Premium placement for "${adTitle}" expires within 24 hours. Renew to keep your boost!`,
        {
          type: "PREMIUM_EXPIRING",
          adId: adId || "",
          premiumAdId: doc.id,
          recipientId: sellerId,
        }
      );
    }

    console.log(
      `Sent expiry warnings for ${expiringSnapshot.size} premium ad(s).`
    );
  });
