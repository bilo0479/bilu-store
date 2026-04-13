import * as functions from "firebase-functions";
/**
 * Called by BUYER (or admin) to request a refund.
 * Only allowed when status is 'held' (OTP not yet given to seller).
 * Once the seller has verified the OTP (status='verified'), refunds
 * must go through admin dispute resolution.
 */
export declare const onRequestRefund: functions.HttpsFunction & functions.Runnable<any>;
