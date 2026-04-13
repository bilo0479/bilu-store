import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  verifyTelebirrPayment,
  type TelebirrCallbackPayload,
} from "../services/TelebirrService";
import { activatePremiumBoost } from "./onPaymentInitialize";

/**
 * HTTPS function that receives Telebirr payment callbacks (notify_url).
 * Telebirr POSTs JSON/form-encoded data after the user approves payment.
 *
 * Deploy URL: https://us-central1-{projectId}.cloudfunctions.net/onTelebirrCallback
 *
 * We verify payment by querying the order status directly from Telebirr
 * (more reliable than signature verification, which requires Telebirr's
 * public key to be distributed to merchants).
 */
export const onTelebirrCallback = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const params = req.body as TelebirrCallbackPayload;

  // OpenAPI callback uses merch_order_id (our txRef)
  const txRef = params.merch_order_id;
  if (!txRef) {
    functions.logger.warn("onTelebirrCallback: missing merch_order_id");
    res.status(400).send("Missing merch_order_id");
    return;
  }

  functions.logger.info(`onTelebirrCallback: received for txRef=${txRef}`, {
    trade_status: params.trade_status,
    trade_no: params.trade_no,
  });

  // Fast-reject obvious non-success statuses without querying Telebirr
  if (params.trade_status && params.trade_status !== "SUCCESS") {
    functions.logger.info(`onTelebirrCallback: non-success status=${params.trade_status} for txRef=${txRef}`);
    res.status(200).send("SUCCESS"); // ACK so Telebirr stops retrying
    return;
  }

  // Verify payment by querying the order directly
  const isPaid = await verifyTelebirrPayment(txRef);
  if (!isPaid) {
    functions.logger.warn(`onTelebirrCallback: queryOrder returned non-SUCCESS for txRef=${txRef}`);
    res.status(200).send("FAIL");
    return;
  }

  const db = admin.firestore();

  const sessionsSnap = await db
    .collection("payment_sessions")
    .where("txRef", "==", txRef)
    .limit(1)
    .get();

  if (sessionsSnap.empty) {
    functions.logger.error(`onTelebirrCallback: no payment_session for txRef=${txRef}`);
    res.status(200).send("SUCCESS"); // ACK to stop retries — session may have been cleaned up
    return;
  }

  const session = sessionsSnap.docs[0].data();

  if (session.status === "PAID") {
    functions.logger.info(`onTelebirrCallback: txRef=${txRef} already processed`);
    res.status(200).send("SUCCESS");
    return;
  }

  try {
    await activatePremiumBoost(
      session.adId as string,
      session.tierId as string,
      session.sellerId as string,
      txRef
    );
    functions.logger.info(`onTelebirrCallback: boost activated for adId=${session.adId}`);
  } catch (err) {
    functions.logger.error(`onTelebirrCallback: activation failed for txRef=${txRef}`, err);
    res.status(200).send("FAIL");
    return;
  }

  res.status(200).send("SUCCESS");
});
