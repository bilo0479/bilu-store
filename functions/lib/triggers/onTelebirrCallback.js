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
 * HTTPS function that receives Telebirr payment callbacks (notify_url).
 * Telebirr POSTs JSON/form-encoded data after the user approves payment.
 *
 * Deploy URL: https://us-central1-{projectId}.cloudfunctions.net/onTelebirrCallback
 *
 * We verify payment by querying the order status directly from Telebirr
 * (more reliable than signature verification, which requires Telebirr's
 * public key to be distributed to merchants).
 */
exports.onTelebirrCallback = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const params = req.body;
    // OpenAPI callback uses merch_order_id (our txRef)
    const txRef = params.merch_order_id;
    if (!txRef) {
        functions.logger.warn("onTelebirrCallback: missing merch_order_id");
        res.status(400).send("Missing merch_order_id");
        return;
    }
    functions.logger.info(`onTelebirrCallback: received for txRef=${txRef}`, {
        trade_status: params.trade_status,
        trade_no: params.trade_no,
    });
    // Fast-reject obvious non-success statuses without querying Telebirr
    if (params.trade_status && params.trade_status !== "SUCCESS") {
        functions.logger.info(`onTelebirrCallback: non-success status=${params.trade_status} for txRef=${txRef}`);
        res.status(200).send("SUCCESS"); // ACK so Telebirr stops retrying
        return;
    }
    // Verify payment by querying the order directly
    const isPaid = await (0, TelebirrService_1.verifyTelebirrPayment)(txRef);
    if (!isPaid) {
        functions.logger.warn(`onTelebirrCallback: queryOrder returned non-SUCCESS for txRef=${txRef}`);
        res.status(200).send("FAIL");
        return;
    }
    const db = admin.firestore();
    const sessionsSnap = await db
        .collection("payment_sessions")
        .where("txRef", "==", txRef)
        .limit(1)
        .get();
    if (sessionsSnap.empty) {
        functions.logger.error(`onTelebirrCallback: no payment_session for txRef=${txRef}`);
        res.status(200).send("SUCCESS"); // ACK to stop retries — session may have been cleaned up
        return;
    }
    const session = sessionsSnap.docs[0].data();
    if (session.status === "PAID") {
        functions.logger.info(`onTelebirrCallback: txRef=${txRef} already processed`);
        res.status(200).send("SUCCESS");
        return;
    }
    try {
        await (0, onPaymentInitialize_1.activatePremiumBoost)(session.adId, session.tierId, session.sellerId, txRef);
        functions.logger.info(`onTelebirrCallback: boost activated for adId=${session.adId}`);
    }
    catch (err) {
        functions.logger.error(`onTelebirrCallback: activation failed for txRef=${txRef}`, err);
        res.status(200).send("FAIL");
        return;
    }
    res.status(200).send("SUCCESS");
});
//# sourceMappingURL=onTelebirrCallback.js.map