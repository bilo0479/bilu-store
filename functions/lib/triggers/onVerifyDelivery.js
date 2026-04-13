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
exports.onVerifyDelivery = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const TelegramService_1 = require("../services/TelegramService");
const PAYOUT_DELAY_MS = 8 * 60 * 60 * 1000; // 8 hours
function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}
/**
 * Called by the SELLER when the buyer hands over the delivery OTP.
 * Validates OTP, transitions escrow to 'verified', starts 8-hour payout clock.
 */
exports.onVerifyDelivery = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }
    const { txId, otpCode } = data;
    if (!txId || !otpCode) {
        throw new functions.https.HttpsError("invalid-argument", "txId and otpCode are required");
    }
    const db = admin.firestore();
    const sellerId = context.auth.uid;
    const escrowRef = db.collection("escrow_transactions").doc(txId);
    const escrowSnap = await escrowRef.get();
    if (!escrowSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Transaction not found");
    }
    const escrow = escrowSnap.data();
    // Only the seller of this transaction can verify delivery
    if (escrow.sellerId !== sellerId) {
        throw new functions.https.HttpsError("permission-denied", "Only the seller can verify delivery");
    }
    if (escrow.status !== "held") {
        if (escrow.status === "verified" || escrow.status === "completed") {
            throw new functions.https.HttpsError("already-exists", "Delivery already verified");
        }
        throw new functions.https.HttpsError("failed-precondition", `Cannot verify delivery — current status: ${escrow.status}`);
    }
    // Check OTP expiry
    if (Date.now() > escrow.deliveryOtpExpiresAt) {
        throw new functions.https.HttpsError("deadline-exceeded", "Delivery code has expired. Please contact support.");
    }
    // Validate OTP
    const inputHash = hashOtp(otpCode.trim());
    if (inputHash !== escrow.deliveryOtpHash) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid delivery code. Please try again.");
    }
    const now = Date.now();
    const payoutReleaseAt = now + PAYOUT_DELAY_MS;
    // Transition: held → verified
    await escrowRef.update({
        status: "verified",
        verifiedAt: now,
        payoutReleaseAt,
    });
    // Delete the plain OTP now that it's been used
    await db.collection("escrow_otps").doc(txId).delete().catch(() => { });
    // Notify buyer: delivery confirmed
    const buyerDoc = await db.collection("users").doc(escrow.buyerId).get();
    const buyerPushToken = buyerDoc.data()?.pushToken;
    if (buyerPushToken) {
        await admin.messaging().send({
            token: buyerPushToken,
            notification: {
                title: "Delivery Confirmed",
                body: `"${escrow.adTitle}" delivery verified. Payment releases to seller in 8 hours.`,
            },
            data: { type: "ESCROW_VERIFIED", txId },
        });
    }
    // Telegram notification to buyer
    const buyerChatId = escrow.buyerTelegramChatId;
    if (buyerChatId) {
        await (0, TelegramService_1.sendTelegramMessage)(buyerChatId, `✅ <b>Delivery Confirmed</b>\n\nYour item <b>"${escrow.adTitle}"</b> has been delivered.\n\n` +
            `Payment of <b>${escrow.payoutAmount.toLocaleString()} ETB</b> will be released to the seller at ` +
            `<b>${new Date(payoutReleaseAt).toLocaleString()}</b>.`);
    }
    functions.logger.info(`onVerifyDelivery: txId=${txId} verified, payout at ${new Date(payoutReleaseAt).toISOString()}`);
    return { payoutReleaseAt };
});
//# sourceMappingURL=onVerifyDelivery.js.map