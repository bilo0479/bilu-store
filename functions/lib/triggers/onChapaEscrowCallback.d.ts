import * as functions from "firebase-functions";
/**
 * Chapa webhook for escrow payments.
 * Triggered when buyer's payment is confirmed by Chapa.
 * tx_ref format: "escrow-{txId}"
 */
export declare const onChapaEscrowCallback: functions.HttpsFunction;
