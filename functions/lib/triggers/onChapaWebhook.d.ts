import * as functions from "firebase-functions";
/**
 * HTTPS function that receives Chapa payment webhooks.
 * Chapa POSTs a JSON body and signs it with HMAC-SHA256.
 * Header: x-chapa-signature: <hex digest>
 *
 * Deploy URL: https://{region}-{projectId}.cloudfunctions.net/onChapaWebhook
 */
export declare const onChapaWebhook: functions.HttpsFunction;
