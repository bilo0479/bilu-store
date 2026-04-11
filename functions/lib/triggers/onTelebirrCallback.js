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
exports.onTelebirrCallback = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const TelebirrService_1 = require("../services/TelebirrService");
const onPaymentInitialize_1 = require("./onPaymentInitialize");
/**
 * HTTPS function that receives Telebirr payment callbacks.
 * Telebirr POSTs form-encoded or JSON data to this URL after user approves payment.
 *
 * Deploy URL: https://{region}-{projectId}.cloudfunctions.net/onTelebirrCallback
 */
exports.onTelebirrCallback = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const params = req.body;
    if (!params.outTradeNo) {
        res.status(400).send("Missing outTradeNo");
        return;
    }
    const isValid = (0, TelebirrService_1.verifyTelebirrCallback)(params);
    if (!isValid) {
        functions.logger.warn("onTelebirrCallback: invalid signature for outTradeNo=" + params.outTradeNo);
        // Telebirr expects "SUCCESS" or "FAIL" in the response body
        res.status(200).send("FAIL");
        return;
    }
    if (params.tradeStatus !== "SUCCESS") {
        functions.logger.info(`onTelebirrCallback: outTradeNo=${params.outTradeNo} status=${params.tradeStatus}`);
        res.status(200).send("SUCCESS");
        return;
    }
    const txRef = params.outTradeNo;
    const db = admin.firestore();
    const sessionsSnap = await db
        .collection("payment_sessions")
        .where("txRef", "==", txRef)
        .limit(1)
        .get();
    if (sessionsSnap.empty) {
        functions.logger.error(`onTelebirrCallback: no payment_session found for txRef=${txRef}`);
        res.status(200).send("SUCCESS"); // Acknowledge so Telebirr doesn't retry indefinitely
        return;
    }
    const session = sessionsSnap.docs[0].data();
    if (session.status === "PAID") {
        functions.logger.info(`onTelebirrCallback: txRef=${txRef} already processed — skipping`);
        res.status(200).send("SUCCESS");
        return;
    }
    try {
        await (0, onPaymentInitialize_1.activatePremiumBoost)(session.adId, session.tierId, session.sellerId, txRef);
        functions.logger.info(`onTelebirrCallback: activated boost for adId=${session.adId}`);
    }
    catch (err) {
        functions.logger.error(`onTelebirrCallback: activation failed for txRef=${txRef}`, err);
        res.status(200).send("FAIL");
        return;
    }
    res.status(200).send("SUCCESS");
});
//# sourceMappingURL=onTelebirrCallback.js.map