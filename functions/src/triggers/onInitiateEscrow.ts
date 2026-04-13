import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { initializeHostedPayment } from "../services/ChapaService";
import { initializeTelebirrPayment } from "../services/TelebirrService";

const COMMISSION_RATE = 0.095; // 9.5%
const OTP_TTL_MS = 48 * 60 * 60 * 1000; // OTP valid 48 hours

interface InitiateEscrowData {
  adId: string;
  paymentMethod: "CHAPA" | "TELEBIRR";
}

interface InitiateEscrowResult {
  txId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

export const onInitiateEscrow = functions.https.onCall(
  async (data: InitiateEscrowData, context): Promise<InitiateEscrowResult> => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }

    const { adId, paymentMethod } = data;
    if (!adId || !paymentMethod) {
      throw new functions.https.HttpsError("invalid-argument", "adId and paymentMethod are required");
    }

    const db = admin.firestore();
    const buyerId = context.auth.uid;

    // Load ad
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Ad not found");
    }
    const ad = adDoc.data()!;

    if (ad.status !== "ACTIVE") {
      throw new functions.https.HttpsError("failed-precondition", "This ad is no longer available");
    }
    if (ad.sellerId === buyerId) {
      throw new functions.https.HttpsError("failed-precondition", "You cannot buy your own listing");
    }
    if (!ad.price || ad.price <= 0) {
      throw new functions.https.HttpsError("failed-precondition", "This ad has no price set");
    }

    // Load seller — must have payout account configured
    const sellerDoc = await db.collection("users").doc(ad.sellerId).get();
    if (!sellerDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Seller not found");
    }
    const seller = sellerDoc.data()!;
    if (!seller.payoutAccount?.accountNumber) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Seller has not set up a payout account yet. Ask them to configure it in their profile."
      );
    }

    // Load buyer
    const buyerDoc = await db.collection("users").doc(buyerId).get();
    const buyer = buyerDoc.data() ?? {};

    const amount: number = ad.price;
    const commissionAmount = Math.round(amount * COMMISSION_RATE * 100) / 100;
    const payoutAmount = Math.round((amount - commissionAmount) * 100) / 100;

    const projectId = process.env.GCLOUD_PROJECT ?? "bilu-store-e1a06";
    const region = "us-central1";

    // Create escrow doc first (gets Firestore-generated ID)
    const escrowRef = db.collection("escrow_transactions").doc();
    const txId = escrowRef.id;

    const txRef = `escrow-${txId}`;
    const callbackUrl = `https://${region}-${projectId}.cloudfunctions.net/onChapaEscrowCallback`;
    const telebirrCallbackUrl = `https://${region}-${projectId}.cloudfunctions.net/onTelebirrEscrowCallback`;
    const returnUrl = `bilustore://escrow/${txId}`;

    let checkoutUrl: string;

    try {
      if (paymentMethod === "CHAPA") {
        const chapaResult = await initializeHostedPayment({
          amount,
          currency: "ETB",
          email: (buyer.email as string) ?? `${buyerId}@bilustore.et`,
          firstName: ((buyer.name as string) ?? "Buyer").split(" ")[0],
          lastName: ((buyer.name as string) ?? "Buyer").split(" ").slice(1).join(" ") || "User",
          txRef,
          callbackUrl,
          returnUrl,
        });
        checkoutUrl = chapaResult.checkoutUrl;
      } else {
        const telebirrResult = await initializeTelebirrPayment({
          outTradeNo: txRef,
          subject: `Bilu Store purchase: ${ad.title as string}`,
          totalAmount: amount.toFixed(2),
          notifyUrl: telebirrCallbackUrl,
          returnUrl,
          timeoutExpress: "120m",
        });
        checkoutUrl = telebirrResult.toPayUrl;
      }
    } catch (err) {
      throw new functions.https.HttpsError("internal", (err as Error).message);
    }

    // Persist escrow record (status: pending_payment)
    await escrowRef.set({
      txId,
      adId,
      adTitle: ad.title ?? "",
      adThumbnail: (ad.thumbnails as string[])?.[0] ?? (ad.images as string[])?.[0] ?? "",
      buyerId,
      buyerName: (buyer.name as string) ?? "Buyer",
      buyerTelegramChatId: (buyer.telegramChatId as string) ?? null,
      sellerId: ad.sellerId,
      sellerName: (seller.name as string) ?? "Seller",
      amount,
      commissionAmount,
      payoutAmount,
      currency: ad.currency ?? "ETB",
      paymentMethod,
      paymentTxRef: txRef,
      status: "pending_payment",
      deliveryOtpHash: null,
      deliveryOtpExpiresAt: Date.now() + OTP_TTL_MS,
      verifiedAt: null,
      payoutReleaseAt: null,
      completedAt: null,
      refundedAt: null,
      sellerPayoutAccount: seller.payoutAccount,
      createdAt: Date.now(),
    });

    return { txId, checkoutUrl, amount, currency: (ad.currency as string) ?? "ETB" };
  }
);
