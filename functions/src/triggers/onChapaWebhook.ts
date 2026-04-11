import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyWebhookSignature, verifyTransaction } from "../services/ChapaService";
import { activatePremiumBoost } from "./onPaymentInitialize";

/**
 * HTTPS function that receives Chapa payment webhooks.
 * Chapa POSTs a JSON body and signs it with HMAC-SHA256.
 * Header: x-chapa-signature: <hex digest>
 *
 * Deploy URL: https://{region}-{projectId}.cloudfunctions.net/onChapaWebhook
 */
export const onChapaWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signature = req.headers["x-chapa-signature"] as string | undefined;
  if (!signature) {
    functions.logger.warn("onChapaWebhook: missing x-chapa-signature header");
    res.status(400).send("Missing signature");
    return;
  }

  // req.rawBody is available in Cloud Functions when using onRequest
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody?.toString("utf8") ?? JSON.stringify(req.body);

  let signatureValid: boolean;
  try {
    signatureValid = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    functions.logger.error("onChapaWebhook: signature verification error", err);
    res.status(500).send("Internal error");
    return;
  }

  if (!signatureValid) {
    functions.logger.warn("onChapaWebhook: invalid signature");
    res.status(401).send("Invalid signature");
    return;
  }

  const body = req.body as { tx_ref?: string; status?: string; event?: string };
  const txRef = body.tx_ref;
  const status = body.status;

  if (!txRef) {
    res.status(400).send("Missing tx_ref");
    return;
  }

  // Respond to Chapa immediately — processing is idempotent
  res.status(200).send("OK");

  if (status !== "success") {
    functions.logger.info(`onChapaWebhook: tx_ref=${txRef} status=${status} — no action`);
    return;
  }

  // Double-check with Chapa's verify endpoint
  let verification;
  try {
    verification = await verifyTransaction(txRef);
  } catch (err) {
    functions.logger.error(`onChapaWebhook: verify failed for tx_ref=${txRef}`, err);
    return;
  }

  if (verification.status !== "success") {
    functions.logger.warn(`onChapaWebhook: verify returned status=${verification.status} for tx_ref=${txRef}`);
    return;
  }

  // Fetch payment session
  const db = admin.firestore();
  const sessionsSnap = await db
    .collection("payment_sessions")
    .where("txRef", "==", txRef)
    .limit(1)
    .get();

  if (sessionsSnap.empty) {
    functions.logger.error(`onChapaWebhook: no payment_session found for tx_ref=${txRef}`);
    return;
  }

  const session = sessionsSnap.docs[0].data();

  if (session.status === "PAID") {
    functions.logger.info(`onChapaWebhook: tx_ref=${txRef} already processed — skipping`);
    return;
  }

  try {
    await activatePremiumBoost(
      session.adId as string,
      session.tierId as string,
      session.sellerId as string,
      txRef
    );
    functions.logger.info(`onChapaWebhook: activated boost for adId=${session.adId} tierId=${session.tierId}`);
  } catch (err) {
    functions.logger.error(`onChapaWebhook: activatePremiumBoost failed for tx_ref=${txRef}`, err);
  }
});
