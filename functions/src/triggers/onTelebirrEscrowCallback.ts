import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { verifyTelebirrPayment } from "../services/TelebirrService";
import { sendTelegramMessage, buildOtpMessage } from "../services/TelegramService";

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Telebirr callback for escrow payments.
 * merch_order_id format: "escrow-{txId}"
 */
export const onTelebirrEscrowCallback = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const body = req.body as Record<string, string>;
  const merchOrderId: string = body.merch_order_id ?? "";

  if (!merchOrderId.startsWith("escrow-")) {
    res.status(200).send("SUCCESS");
    return;
  }

  const txId = merchOrderId.replace("escrow-", "");

  // Fast-reject obvious failures
  if (body.trade_status && body.trade_status !== "SUCCESS") {
    functions.logger.info(`onTelebirrEscrowCallback: non-success for txId=${txId}`);
    res.status(200).send("SUCCESS");
    return;
  }

  // Verify via queryOrder (authoritative)
  const isPaid = await verifyTelebirrPayment(merchOrderId);
  if (!isPaid) {
    functions.logger.warn(`onTelebirrEscrowCallback: payment not confirmed for txId=${txId}`);
    res.status(200).send("FAIL");
    return;
  }

  const db = admin.firestore();
  const escrowRef = db.collection("escrow_transactions").doc(txId);
  const escrowSnap = await escrowRef.get();

  if (!escrowSnap.exists || escrowSnap.data()!.status !== "pending_payment") {
    res.status(200).send("SUCCESS");
    return;
  }

  const escrow = escrowSnap.data()!;
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await db.collection("escrow_otps").doc(txId).set({
    txId,
    buyerId: escrow.buyerId,
    otp,
    createdAt: Date.now(),
    expiresAt: escrow.deliveryOtpExpiresAt,
  });

  await escrowRef.update({ status: "held", deliveryOtpHash: otpHash });

  const chatId = escrow.buyerTelegramChatId as string | null;
  if (chatId) {
    await sendTelegramMessage(chatId, buildOtpMessage(otp, escrow.adTitle as string, escrow.amount as number));
  }

  const buyerDoc = await db.collection("users").doc(escrow.buyerId as string).get();
  const pushToken = buyerDoc.data()?.pushToken as string | undefined;
  if (pushToken) {
    await admin.messaging().send({
      token: pushToken,
      notification: {
        title: "Payment Confirmed!",
        body: `Payment for "${escrow.adTitle}" is secured. Check app for your delivery code.`,
      },
      data: { type: "ESCROW_HELD", txId },
    });
  }

  res.status(200).send("SUCCESS");
});
