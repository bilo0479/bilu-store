import * as functions from "firebase-functions";
/**
 * Scheduled every 15 minutes.
 * Finds all 'verified' escrows whose payoutReleaseAt has passed,
 * transfers funds to seller, marks as 'completed'.
 */
export declare const onEscrowPayout: functions.CloudFunction<unknown>;
