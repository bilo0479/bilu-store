import * as functions from "firebase-functions";
/**
 * Daily scheduled job that expires ads whose 30-day TTL has passed.
 * Ads with expiresAt < now and status ACTIVE are set to EXPIRED.
 * Sellers receive a push notification with a republish prompt.
 */
export declare const onAdExpiry: functions.CloudFunction<unknown>;
