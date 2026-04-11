import * as functions from "firebase-functions";
/**
 * HTTPS function that receives Telebirr payment callbacks.
 * Telebirr POSTs form-encoded or JSON data to this URL after user approves payment.
 *
 * Deploy URL: https://{region}-{projectId}.cloudfunctions.net/onTelebirrCallback
 */
export declare const onTelebirrCallback: functions.HttpsFunction;
