import * as functions from "firebase-functions";
/**
 * Called by the SELLER when the buyer hands over the delivery OTP.
 * Validates OTP, transitions escrow to 'verified', starts 8-hour payout clock.
 */
export declare const onVerifyDelivery: functions.HttpsFunction & functions.Runnable<any>;
