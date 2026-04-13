import * as admin from "firebase-admin";

admin.initializeApp();

export { onAdWrite } from "./triggers/onAdWrite";
export { onMessageCreate } from "./triggers/onMessageCreate";
export { onReviewCreate } from "./triggers/onReviewCreate";
export { onPremiumExpiry } from "./triggers/onPremiumExpiry";
export { onAdExpiry } from "./triggers/onAdExpiry";

// Premium boost payments
export { onPaymentInitialize } from "./triggers/onPaymentInitialize";
export { onChapaWebhook } from "./triggers/onChapaWebhook";
export { onTelebirrCallback } from "./triggers/onTelebirrCallback";

// Escrow / buy-now payments
export { onInitiateEscrow } from "./triggers/onInitiateEscrow";
export { onChapaEscrowCallback } from "./triggers/onChapaEscrowCallback";
export { onTelebirrEscrowCallback } from "./triggers/onTelebirrEscrowCallback";
export { onVerifyDelivery } from "./triggers/onVerifyDelivery";
export { onEscrowPayout } from "./triggers/onEscrowPayout";
export { onRequestRefund } from "./triggers/onRequestRefund";
