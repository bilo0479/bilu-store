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
exports.onChapaEscrowCallback = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const ChapaService_1 = require("../services/ChapaService");
const TelegramService_1 = require("../services/TelegramService");
function generateOtp() {
    // Cryptographically secure 6-digit OTP
    return String(crypto.randomInt(100000, 999999));
}
function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}
/**
 * Chapa webhook for escrow payments.
 * Triggered when buyer's payment is confirmed by Chapa.
 * tx_ref format: "escrow-{txId}"
 */
exports.onChapaEscrowCallback = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    // Verify Chapa webhook signature
    const signature = req.headers["x-chapa-signature"];
    const rawBody = JSON.stringify(req.body);
    if (signature) {
        try {
            const valid = (0, ChapaService_1.verifyWebhookSignature)(rawBody, signature);
            if (!valid) {
                functions.logger.warn("onChapaEscrowCallback: invalid signature");
                res.status(400).send("Invalid signature");
                return;
            }
        }
        catch {
            // CHAPA_WEBHOOK_SECRET not set — log and continue (dev mode)
            functions.logger.warn("onChapaEscrowCallback: signature check skipped (secret not set)");
        }
    }
    const txRef = req.body.tx_ref ?? req.body.txRef ?? "";
    const status = req.body.status ?? "";
    if (!txRef.startsWith("escrow-")) {
        // Not an escrow payment — ignore silently
        res.status(200).send("OK");
        return;
    }
    if (status !== "success") {
        functions.logger.info(`onChapaEscrowCallback: non-success status=${status} txRef=${txRef}`);
        res.status(200).send("OK");
        return;
    }
    const txId = txRef.replace("escrow-", "");
    const db = admin.firestore();
    const escrowRef = db.collection("escrow_transactions").doc(txId);
    const escrowSnap = await escrowRef.get();
    if (!escrowSnap.exists) {
        functions.logger.error(`onChapaEscrowCallback: escrow not found txId=${txId}`);
        res.status(200).send("OK");
        return;
    }
    const escrow = escrowSnap.data();
    if (escrow.status !== "pending_payment") {
        functions.logger.info(`onChapaEscrowCallback: already processed txId=${txId} status=${escrow.status}`);
        res.status(200).send("OK");
        return;
    }
    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    // Store OTP (readable only by buyer) in separate collection
    await db.collection("escrow_otps").doc(txId).set({
        txId,
        buyerId: escrow.buyerId,
        otp, // plain — readable only by buyer via Firestore rules
        createdAt: Date.now(),
        expiresAt: escrow.deliveryOtpExpiresAt,
    });
    // Update escrow to 'held'
    await escrowRef.update({
        status: "held",
        deliveryOtpHash: otpHash,
    });
    // Send OTP to buyer via Telegram (if configured)
    const chatId = escrow.buyerTelegramChatId;
    if (chatId) {
        await (0, TelegramService_1.sendTelegramMessage)(chatId, (0, TelegramService_1.buildOtpMessage)(otp, escrow.adTitle, escrow.amount));
    }
    // Push notification to buyer
    const buyerDoc = await db.collection("users").doc(escrow.buyerId).get();
    const pushToken = buyerDoc.data()?.pushToken;
    if (pushToken) {
        await admin.messaging().send({
            token: pushToken,
            notification: {
                title: "Payment Confirmed!",
                body: `Your payment for "${escrow.adTitle}" is held safely. Check the app for your delivery code.`,
            },
            data: { type: "ESCROW_HELD", txId },
        });
    }
    functions.logger.info(`onChapaEscrowCallback: escrow held, OTP generated for txId=${txId}`);
    res.status(200).send("OK");
});
//# sourceMappingURL=onChapaEscrowCallback.js.map