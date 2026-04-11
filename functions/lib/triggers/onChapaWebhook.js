"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onChapaWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const ChapaService_1 = require("../services/ChapaService");
const onPaymentInitialize_1 = require("./onPaymentInitialize");
/**
 * HTTPS function that receives Chapa payment webhooks.
 * Chapa POSTs a JSON body and signs it with HMAC-SHA256.
 * Header: x-chapa-signature: <hex digest>
 *
 * Deploy URL: https://{region}-{projectId}.cloudfunctions.net/onChapaWebhook
 */
exports.onChapaWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const signature = req.headers["x-chapa-signature"];
    if (!signature) {
        functions.logger.warn("onChapaWebhook: missing x-chapa-signature header");
        res.status(400).send("Missing signature");
        return;
    }
    // req.rawBody is available in Cloud Functions when using onRequest
    const rawBody = req.rawBody?.toString("utf8") ?? JSON.stringify(req.body);
    let signatureValid;
    try {
        signatureValid = (0, ChapaService_1.verifyWebhookSignature)(rawBody, signature);
    }
    catch (err) {
        functions.logger.error("onChapaWebhook: signature verification error", err);
        res.status(500).send("Internal error");
        return;
    }
    if (!signatureValid) {
        functions.logger.warn("onChapaWebhook: invalid signature");
        res.status(401).send("Invalid signature");
        return;
    }
    const body = req.body;
    const txRef = body.tx_ref;
    const status = body.status;
    if (!txRef) {
        res.status(400).send("Missing tx_ref");
        return;
    }
    // Respond to Chapa immediately — processing is idempotent
    res.status(200).send("OK");
    if (status !== "success") {
        functions.logger.info(`onChapaWebhook: tx_ref=${txRef} status=${status} — no action`);
        return;
    }
    // Double-check with Chapa's verify endpoint
    let verification;
    try {
        verification = await (0, ChapaService_1.verifyTransaction)(txRef);
    }
    catch (err) {
        functions.logger.error(`onChapaWebhook: verify failed for tx_ref=${txRef}`, err);
        return;
    }
    if (verification.status !== "success") {
        functions.logger.warn(`onChapaWebhook: verify returned status=${verification.status} for tx_ref=${txRef}`);
        return;
    }
    // Fetch payment session
    const db = admin.firestore();
    const sessionsSnap = await db
        .collection("payment_sessions")
        .where("txRef", "==", txRef)
        .limit(1)
        .get();
    if (sessionsSnap.empty) {
        functions.logger.error(`onChapaWebhook: no payment_session found for tx_ref=${txRef}`);
        return;
    }
    const session = sessionsSnap.docs[0].data();
    if (session.status === "PAID") {
        functions.logger.info(`onChapaWebhook: tx_ref=${txRef} already processed — skipping`);
        return;
    }
    try {
        await (0, onPaymentInitialize_1.activatePremiumBoost)(session.adId, session.tierId, session.sellerId, txRef);
        functions.logger.info(`onChapaWebhook: activated boost for adId=${session.adId} tierId=${session.tierId}`);
    }
    catch (err) {
        functions.logger.error(`onChapaWebhook: activatePremiumBoost failed for tx_ref=${txRef}`, err);
    }
});
//# sourceMappingURL=onChapaWebhook.js.map