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
exports.onTelebirrEscrowCallback = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const TelebirrService_1 = require("../services/TelebirrService");
const TelegramService_1 = require("../services/TelegramService");
function generateOtp() {
    return String(crypto.randomInt(100000, 999999));
}
function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}
/**
 * Telebirr callback for escrow payments.
 * merch_order_id format: "escrow-{txId}"
 */
exports.onTelebirrEscrowCallback = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const body = req.body;
    const merchOrderId = body.merch_order_id ?? "";
    if (!merchOrderId.startsWith("escrow-")) {
        res.status(200).send("SUCCESS");
        return;
    }
    const txId = merchOrderId.replace("escrow-", "");
    // Fast-reject obvious failures
    if (body.trade_status && body.trade_status !== "SUCCESS") {
        functions.logger.info(`onTelebirrEscrowCallback: non-success for txId=${txId}`);
        res.status(200).send("SUCCESS");
        return;
    }
    // Verify via queryOrder (authoritative)
    const isPaid = await (0, TelebirrService_1.verifyTelebirrPayment)(merchOrderId);
    if (!isPaid) {
        functions.logger.warn(`onTelebirrEscrowCallback: payment not confirmed for txId=${txId}`);
        res.status(200).send("FAIL");
        return;
    }
    const db = admin.firestore();
    const escrowRef = db.collection("escrow_transactions").doc(txId);
    const escrowSnap = await escrowRef.get();
    if (!escrowSnap.exists || escrowSnap.data().status !== "pending_payment") {
        res.status(200).send("SUCCESS");
        return;
    }
    const escrow = escrowSnap.data();
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    await db.collection("escrow_otps").doc(txId).set({
        txId,
        buyerId: escrow.buyerId,
        otp,
        createdAt: Date.now(),
        expiresAt: escrow.deliveryOtpExpiresAt,
    });
    await escrowRef.update({ status: "held", deliveryOtpHash: otpHash });
    const chatId = escrow.buyerTelegramChatId;
    if (chatId) {
        await (0, TelegramService_1.sendTelegramMessage)(chatId, (0, TelegramService_1.buildOtpMessage)(otp, escrow.adTitle, escrow.amount));
    }
    const buyerDoc = await db.collection("users").doc(escrow.buyerId).get();
    const pushToken = buyerDoc.data()?.pushToken;
    if (pushToken) {
        await admin.messaging().send({
            token: pushToken,
            notification: {
                title: "Payment Confirmed!",
                body: `Payment for "${escrow.adTitle}" is secured. Check app for your delivery code.`,
            },
            data: { type: "ESCROW_HELD", txId },
        });
    }
    res.status(200).send("SUCCESS");
});
//# sourceMappingURL=onTelebirrEscrowCallback.js.map