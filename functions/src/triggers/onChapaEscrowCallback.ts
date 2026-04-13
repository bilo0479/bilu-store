import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { verifyWebhookSignature } from "../services/ChapaService";
import { sendTelegramMessage, buildOtpMessage } from "../services/TelegramService";

function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Chapa webhook for escrow payments.
 * Triggered when buyer's payment is confirmed by Chapa.
 * tx_ref format: "escrow-{txId}"
 */
export const onChapaEscrowCallback = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Verify Chapa webhook signature
  const signature = req.headers["x-chapa-signature"] as string | undefined;
  const rawBody = JSON.stringify(req.body);

  if (signature) {
    try {
      const valid = verifyWebhookSignature(rawBody, signature);
      if (!valid) {
        functions.logger.warn("onChapaEscrowCallback: invalid signature");
        res.status(400).send("Invalid signature");
        return;
      }
    } catch {
      // CHAPA_WEBHOOK_SECRET not set — log and continue (dev mode)
      functions.logger.warn("onChapaEscrowCallback: signature check skipped (secret not set)");
    }
  }

  const txRef: string = req.body.tx_ref ?? req.body.txRef ?? "";
  const status: string = req.body.status ?? "";

  if (!txRef.startsWith("escrow-")) {
    // Not an escrow payment — ignore silently
    res.status(200).send("OK");
    return;
  }

  if (status !== "success") {
    functions.logger.info(`onChapaEscrowCallback: non-success status=${status} txRef=${txRef}`);
    res.status(200).send("OK");
    return;
  }

  const txId = txRef.replace("escrow-", "");
  const db = admin.firestore();

  const escrowRef = db.collection("escrow_transactions").doc(txId);
  const escrowSnap = await escrowRef.get();

  if (!escrowSnap.exists) {
    functions.logger.error(`onChapaEscrowCallback: escrow not found txId=${txId}`);
    res.status(200).send("OK");
    return;
  }

  const escrow = escrowSnap.data()!;

  if (escrow.status !== "pending_payment") {
    functions.logger.info(`onChapaEscrowCallback: already processed txId=${txId} status=${escrow.status}`);
    res.status(200).send("OK");
    return;
  }

  // Generate OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  // Store OTP (readable only by buyer) in separate collection
  await db.collection("escrow_otps").doc(txId).set({
    txId,
    buyerId: escrow.buyerId,
    otp,                          // plain — readable only by buyer via Firestore rules
    createdAt: Date.now(),
    expiresAt: escrow.deliveryOtpExpiresAt,
  });

  // Update escrow to 'held'
  await escrowRef.update({
    status: "held",
    deliveryOtpHash: otpHash,
  });

  // Send OTP to buyer via Telegram (if configured)
  const chatId = escrow.buyerTelegramChatId as string | null;
  if (chatId) {
    await sendTelegramMessage(
      chatId,
      buildOtpMessage(otp, escrow.adTitle as string, escrow.amount as number)
    );
  }

  // Push notification to buyer
  const buyerDoc = await db.collection("users").doc(escrow.buyerId as string).get();
  const pushToken = buyerDoc.data()?.pushToken as string | undefined;
  if (pushToken) {
    await admin.messaging().send({
      token: pushToken,
      notification: {
        title: "Payment Confirmed!",
        body: `Your payment for "${escrow.adTitle}" is held safely. Check the app for your delivery code.`,
      },
      data: { type: "ESCROW_HELD", txId },
    });
  }

  functions.logger.info(`onChapaEscrowCallback: escrow held, OTP generated for txId=${txId}`);
  res.status(200).send("OK");
});
