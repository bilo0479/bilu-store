import * as admin from "firebase-admin";

admin.initializeApp();

export { onAdWrite } from "./triggers/onAdWrite";
export { onMessageCreate } from "./triggers/onMessageCreate";
export { onReviewCreate } from "./triggers/onReviewCreate";
export { onPremiumExpiry } from "./triggers/onPremiumExpiry";
export { onAdExpiry } from "./triggers/onAdExpiry";
export { onPaymentInitialize } from "./triggers/onPaymentInitialize";
export { onChapaWebhook } from "./triggers/onChapaWebhook";
export { onTelebirrCallback } from "./triggers/onTelebirrCallback";
