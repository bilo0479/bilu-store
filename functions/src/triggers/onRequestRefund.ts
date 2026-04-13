import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendTelegramMessage } from "../services/TelegramService";

interface RefundData {
  txId: string;
  reason?: string;
}

/**
 * Called by BUYER (or admin) to request a refund.
 * Only allowed when status is 'held' (OTP not yet given to seller).
 * Once the seller has verified the OTP (status='verified'), refunds
 * must go through admin dispute resolution.
 */
export const onRequestRefund = functions.https.onCall(
  async (data: RefundData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }

    const { txId, reason } = data;
    if (!txId) {
      throw new functions.https.HttpsError("invalid-argument", "txId is required");
    }

    const db = admin.firestore();
    const uid = context.auth.uid;

    const escrowRef = db.collection("escrow_transactions").doc(txId);
    const escrowSnap = await escrowRef.get();

    if (!escrowSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Transaction not found");
    }

    const escrow = escrowSnap.data()!;

    // Only buyer or admin can request refund
    const isAdmin = context.auth.token?.role === "ADMIN";
    if (escrow.buyerId !== uid && !isAdmin) {
      throw new functions.https.HttpsError("permission-denied", "Only the buyer can request a refund");
    }

    if (escrow.status === "completed") {
      throw new functions.https.HttpsError("failed-precondition", "Payment has already been released — contact support");
    }
    if (escrow.status === "refunded") {
      throw new functions.https.HttpsError("already-exists", "Already refunded");
    }
    if (escrow.status === "verified") {
      // Seller already confirmed delivery — escalate to dispute
      await escrowRef.update({
        status: "disputed",
        disputeReason: reason ?? "Buyer requested refund after delivery verification",
        disputedAt: Date.now(),
        disputedBy: uid,
      });
      return { disputed: true, message: "Escalated to admin dispute — we'll review within 24 hours." };
    }

    if (!["held", "pending_payment"].includes(escrow.status as string)) {
      throw new functions.https.HttpsError("failed-precondition", `Cannot refund in status: ${escrow.status}`);
    }

    // Mark refunded (actual Chapa refund triggered separately by admin or auto)
    await escrowRef.update({
      status: "refunded",
      refundedAt: Date.now(),
      refundReason: reason ?? "Buyer requested",
    });

    // Delete unused OTP
    await db.collection("escrow_otps").doc(txId).delete().catch(() => {});

    // Notify buyer
    const buyerDoc = await db.collection("users").doc(escrow.buyerId as string).get();
    const pushToken = buyerDoc.data()?.pushToken as string | undefined;
    if (pushToken) {
      await admin.messaging().send({
        token: pushToken,
        notification: {
          title: "Refund Initiated",
          body: `Your payment for "${escrow.adTitle}" will be refunded within 3–5 business days.`,
        },
        data: { type: "ESCROW_REFUNDED", txId },
      });
    }

    // Telegram notification
    const chatId = escrow.buyerTelegramChatId as string | null;
    if (chatId) {
      await sendTelegramMessage(
        chatId,
        `🔄 <b>Refund Initiated</b>\n\nYour payment for <b>"${escrow.adTitle}"</b> ` +
        `(${(escrow.amount as number).toLocaleString()} ETB) will be refunded within 3–5 business days.`
      );
    }

    // Notify seller
    const sellerDoc = await db.collection("users").doc(escrow.sellerId as string).get();
    const sellerToken = sellerDoc.data()?.pushToken as string | undefined;
    if (sellerToken) {
      await admin.messaging().send({
        token: sellerToken,
        notification: {
          title: "Transaction Cancelled",
          body: `The buyer cancelled the purchase of "${escrow.adTitle}".`,
        },
        data: { type: "ESCROW_REFUNDED", txId },
      });
    }

    functions.logger.info(`onRequestRefund: refunded txId=${txId} by uid=${uid}`);
    return { refunded: true };
  }
);
