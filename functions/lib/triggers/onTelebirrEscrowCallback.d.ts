import * as functions from "firebase-functions";
/**
 * Telebirr callback for escrow payments.
 * merch_order_id format: "escrow-{txId}"
 */
export declare const onTelebirrEscrowCallback: functions.HttpsFunction;
