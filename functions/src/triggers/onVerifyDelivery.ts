import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { sendTelegramMessage } from "../services/TelegramService";

const PAYOUT_DELAY_MS = 8 * 60 * 60 * 1000; // 8 hours

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

interface VerifyDeliveryData {
  txId: string;
  otpCode: string;
}

interface VerifyDeliveryResult {
  payoutReleaseAt: number;
}

/**
 * Called by the SELLER when the buyer hands over the delivery OTP.
 * Validates OTP, transitions escrow to 'verified', starts 8-hour payout clock.
 */
export const onVerifyDelivery = functions.https.onCall(
  async (data: VerifyDeliveryData, context): Promise<VerifyDeliveryResult> => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }

    const { txId, otpCode } = data;
    if (!txId || !otpCode) {
      throw new functions.https.HttpsError("invalid-argument", "txId and otpCode are required");
    }

    const db = admin.firestore();
    const sellerId = context.auth.uid;

    const escrowRef = db.collection("escrow_transactions").doc(txId);
    const escrowSnap = await escrowRef.get();

    if (!escrowSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Transaction not found");
    }

    const escrow = escrowSnap.data()!;

    // Only the seller of this transaction can verify delivery
    if (escrow.sellerId !== sellerId) {
      throw new functions.https.HttpsError("permission-denied", "Only the seller can verify delivery");
    }

    if (escrow.status !== "held") {
      if (escrow.status === "verified" || escrow.status === "completed") {
        throw new functions.https.HttpsError("already-exists", "Delivery already verified");
      }
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Cannot verify delivery — current status: ${escrow.status}`
      );
    }

    // Check OTP expiry
    if (Date.now() > (escrow.deliveryOtpExpiresAt as number)) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "Delivery code has expired. Please contact support."
      );
    }

    // Validate OTP
    const inputHash = hashOtp(otpCode.trim());
    if (inputHash !== escrow.deliveryOtpHash) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid delivery code. Please try again.");
    }

    const now = Date.now();
    const payoutReleaseAt = now + PAYOUT_DELAY_MS;

    // Transition: held → verified
    await escrowRef.update({
      status: "verified",
      verifiedAt: now,
      payoutReleaseAt,
    });

    // Delete the plain OTP now that it's been used
    await db.collection("escrow_otps").doc(txId).delete().catch(() => {});

    // Notify buyer: delivery confirmed
    const buyerDoc = await db.collection("users").doc(escrow.buyerId as string).get();
    const buyerPushToken = buyerDoc.data()?.pushToken as string | undefined;
    if (buyerPushToken) {
      await admin.messaging().send({
        token: buyerPushToken,
        notification: {
          title: "Delivery Confirmed",
          body: `"${escrow.adTitle}" delivery verified. Payment releases to seller in 8 hours.`,
        },
        data: { type: "ESCROW_VERIFIED", txId },
      });
    }

    // Telegram notification to buyer
    const buyerChatId = escrow.buyerTelegramChatId as string | null;
    if (buyerChatId) {
      await sendTelegramMessage(
        buyerChatId,
        `✅ <b>Delivery Confirmed</b>\n\nYour item <b>"${escrow.adTitle}"</b> has been delivered.\n\n` +
        `Payment of <b>${(escrow.payoutAmount as number).toLocaleString()} ETB</b> will be released to the seller at ` +
        `<b>${new Date(payoutReleaseAt).toLocaleString()}</b>.`
      );
    }

    functions.logger.info(`onVerifyDelivery: txId=${txId} verified, payout at ${new Date(payoutReleaseAt).toISOString()}`);

    return { payoutReleaseAt };
  }
);
