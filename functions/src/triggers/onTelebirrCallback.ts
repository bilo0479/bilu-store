import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyTelebirrCallback, type TelebirrCallbackPayload } from "../services/TelebirrService";
import { activatePremiumBoost } from "./onPaymentInitialize";

/**
 * HTTPS function that receives Telebirr payment callbacks.
 * Telebirr POSTs form-encoded or JSON data to this URL after user approves payment.
 *
 * Deploy URL: https://{region}-{projectId}.cloudfunctions.net/onTelebirrCallback
 */
export const onTelebirrCallback = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const params = req.body as TelebirrCallbackPayload & { sign?: string };

  if (!params.outTradeNo) {
    res.status(400).send("Missing outTradeNo");
    return;
  }

  const isValid = verifyTelebirrCallback(params);
  if (!isValid) {
    functions.logger.warn("onTelebirrCallback: invalid signature for outTradeNo=" + params.outTradeNo);
    // Telebirr expects "SUCCESS" or "FAIL" in the response body
    res.status(200).send("FAIL");
    return;
  }

  if (params.tradeStatus !== "SUCCESS") {
    functions.logger.info(`onTelebirrCallback: outTradeNo=${params.outTradeNo} status=${params.tradeStatus}`);
    res.status(200).send("SUCCESS");
    return;
  }

  const txRef = params.outTradeNo;
  const db = admin.firestore();

  const sessionsSnap = await db
    .collection("payment_sessions")
    .where("txRef", "==", txRef)
    .limit(1)
    .get();

  if (sessionsSnap.empty) {
    functions.logger.error(`onTelebirrCallback: no payment_session found for txRef=${txRef}`);
    res.status(200).send("SUCCESS"); // Acknowledge so Telebirr doesn't retry indefinitely
    return;
  }

  const session = sessionsSnap.docs[0].data();

  if (session.status === "PAID") {
    functions.logger.info(`onTelebirrCallback: txRef=${txRef} already processed — skipping`);
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
    functions.logger.info(`onTelebirrCallback: activated boost for adId=${session.adId}`);
  } catch (err) {
    functions.logger.error(`onTelebirrCallback: activation failed for txRef=${txRef}`, err);
    res.status(200).send("FAIL");
    return;
  }

  res.status(200).send("SUCCESS");
});
