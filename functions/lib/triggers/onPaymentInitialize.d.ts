import * as functions from "firebase-functions";
export declare const onPaymentInitialize: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Activates a premium boost after successful payment.
 * Called internally by webhook handlers.
 */
export declare function activatePremiumBoost(adId: string, tierId: string, sellerId: string, txRef: string): Promise<void>;
