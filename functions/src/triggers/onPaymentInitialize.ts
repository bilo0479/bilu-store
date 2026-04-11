import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { initializeHostedPayment, initiateUssdPush } from "../services/ChapaService";
import { initializeTelebirrPayment } from "../services/TelebirrService";

type PaymentMethod = "CHAPA_HOSTED" | "CHAPA_USSD" | "TELEBIRR";

interface InitializePaymentData {
  adId: string;
  tierId: string;
  method: PaymentMethod;
}

interface InitializePaymentResult {
  txRef: string;
  checkoutUrl?: string;   // for CHAPA_HOSTED and TELEBIRR (WebView)
  ussdPushSent?: boolean; // for CHAPA_USSD
}

const TIER_PRICES: Record<string, number> = {
  FEATURED: 200,
  TOP_SEARCH: 150,
  HOMEPAGE: 300,
  HIGHLIGHT: 100,
};

const TIER_DURATIONS: Record<string, number> = {
  FEATURED: 7,
  TOP_SEARCH: 7,
  HOMEPAGE: 3,
  HIGHLIGHT: 7,
};

export const onPaymentInitialize = functions.https.onCall(
  async (data: InitializePaymentData, context: functions.https.CallableContext): Promise<InitializePaymentResult> => {
    const auth = context.auth;

    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }

    const { adId, tierId, method } = data;

    if (!adId || !tierId || !method) {
      throw new functions.https.HttpsError("invalid-argument", "adId, tierId, and method are required");
    }

    if (!["CHAPA_HOSTED", "CHAPA_USSD", "TELEBIRR"].includes(method)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid payment method");
    }

    if (!TIER_PRICES[tierId]) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid tier ID");
    }

    const db = admin.firestore();

    // Verify caller owns the ad
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Ad not found");
    }

    const adData = adDoc.data()!;
    if (adData.sellerId !== auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "You do not own this ad");
    }

    // Check no existing active boost for this tier
    const existingBoost = await db
      .collection("premium_ads")
      .where("adId", "==", adId)
      .where("status", "==", "ACTIVE")
      .limit(1)
      .get();

    if (!existingBoost.empty) {
      throw new functions.https.HttpsError("already-exists", "This ad already has an active boost");
    }

    // Fetch seller profile for payment details
    const sellerDoc = await db.collection("users").doc(auth.uid).get();
    const sellerData = sellerDoc.data() ?? {};
    const sellerName: string = (sellerData.name as string) ?? "Seller";
    const sellerEmail: string = (sellerData.email as string) ?? `${auth.uid}@bilustore.et`;
    const sellerPhone: string = (sellerData.phone as string) ?? "";

    const nameParts = sellerName.split(" ");
    const firstName = nameParts[0] ?? "Seller";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const amount = TIER_PRICES[tierId];
    const txRef = `bilu-${adId}-${tierId}-${Date.now()}`;

    const projectId = process.env.GCLOUD_PROJECT ?? "bilu-store";
    const region = "us-central1";
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/onChapaWebhook`;
    const telebirrCallbackUrl = `https://${region}-${projectId}.cloudfunctions.net/onTelebirrCallback`;
    const returnUrl = `bilustore://payment/result?tx_ref=${txRef}&status=success`;

    // Create payment session in Firestore BEFORE calling payment API
    const sessionRef = db.collection("payment_sessions").doc();
    await sessionRef.set({
      txRef,
      adId,
      tierId,
      sellerId: auth.uid,
      method,
      amount,
      currency: "ETB",
      status: "PENDING",
      createdAt: Date.now(),
      paidAt: null,
    });

    try {
      if (method === "CHAPA_HOSTED") {
        const result = await initializeHostedPayment({
          amount,
          currency: "ETB",
          email: sellerEmail,
          firstName,
          lastName,
          txRef,
          callbackUrl: webhookUrl,
          returnUrl,
        });
        return { txRef, checkoutUrl: result.checkoutUrl };
      }

      if (method === "CHAPA_USSD") {
        if (!sellerPhone) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Phone number required for USSD payment. Update your profile first."
          );
        }
        await initiateUssdPush({
          amount,
          currency: "ETB",
          phone: sellerPhone,
          txRef,
          callbackUrl: webhookUrl,
        });
        return { txRef, ussdPushSent: true };
      }

      // TELEBIRR
      const result = await initializeTelebirrPayment({
        outTradeNo: txRef,
        subject: `Bilu Store ${tierId} boost for: ${adData.title as string}`,
        totalAmount: amount.toFixed(2),
        notifyUrl: telebirrCallbackUrl,
        returnUrl,
        timeoutExpress: "30",
      });
      return { txRef, checkoutUrl: result.toPayUrl };
    } catch (err) {
      // Clean up pending session on API failure
      await sessionRef.delete();
      throw err instanceof functions.https.HttpsError
        ? err
        : new functions.https.HttpsError("internal", (err as Error).message);
    }
  }
);

/**
 * Activates a premium boost after successful payment.
 * Called internally by webhook handlers.
 */
export async function activatePremiumBoost(
  adId: string,
  tierId: string,
  sellerId: string,
  txRef: string
): Promise<void> {
  const db = admin.firestore();
  const now = Date.now();
  const durationDays = TIER_DURATIONS[tierId] ?? 7;
  const endDate = now + durationDays * 24 * 60 * 60 * 1000;

  const premiumId = `${adId}_${tierId}_${now}`;

  const batch = db.batch();

  // Create premium_ads record
  batch.set(db.collection("premium_ads").doc(premiumId), {
    id: premiumId,
    adId,
    sellerId,
    tierId,
    status: "ACTIVE",
    startDate: now,
    endDate,
    createdAt: now,
  });

  // Update ad document
  batch.update(db.collection("ads").doc(adId), {
    isPremium: true,
    premiumTier: tierId,
  });

  // Mark payment session as PAID
  const sessionsSnap = await db
    .collection("payment_sessions")
    .where("txRef", "==", txRef)
    .limit(1)
    .get();

  if (!sessionsSnap.empty) {
    batch.update(sessionsSnap.docs[0].ref, { status: "PAID", paidAt: now });
  }

  await batch.commit();

  // Send FCM notification to seller
  const sellerDoc = await db.collection("users").doc(sellerId).get();
  const pushToken = sellerDoc.data()?.pushToken as string | undefined;
  if (pushToken) {
    const adDoc = await db.collection("ads").doc(adId).get();
    const adTitle = (adDoc.data()?.title as string) ?? "your ad";
    await admin.messaging().send({
      token: pushToken,
      notification: {
        title: "Boost Activated!",
        body: `Your ${tierId} boost for "${adTitle}" is now live.`,
      },
      data: { type: "PREMIUM_ACTIVATED", adId, tierId },
    });
  }
}
