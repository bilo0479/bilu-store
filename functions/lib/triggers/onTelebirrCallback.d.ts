import * as functions from "firebase-functions";
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
export declare const onTelebirrCallback: functions.HttpsFunction;
