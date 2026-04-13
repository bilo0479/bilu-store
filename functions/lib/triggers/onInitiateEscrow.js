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
exports.onInitiateEscrow = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const ChapaService_1 = require("../services/ChapaService");
const TelebirrService_1 = require("../services/TelebirrService");
const COMMISSION_RATE = 0.095; // 9.5%
const OTP_TTL_MS = 48 * 60 * 60 * 1000; // OTP valid 48 hours
exports.onInitiateEscrow = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }
    const { adId, paymentMethod } = data;
    if (!adId || !paymentMethod) {
        throw new functions.https.HttpsError("invalid-argument", "adId and paymentMethod are required");
    }
    const db = admin.firestore();
    const buyerId = context.auth.uid;
    // Load ad
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Ad not found");
    }
    const ad = adDoc.data();
    if (ad.status !== "ACTIVE") {
        throw new functions.https.HttpsError("failed-precondition", "This ad is no longer available");
    }
    if (ad.sellerId === buyerId) {
        throw new functions.https.HttpsError("failed-precondition", "You cannot buy your own listing");
    }
    if (!ad.price || ad.price <= 0) {
        throw new functions.https.HttpsError("failed-precondition", "This ad has no price set");
    }
    // Load seller — must have payout account configured
    const sellerDoc = await db.collection("users").doc(ad.sellerId).get();
    if (!sellerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Seller not found");
    }
    const seller = sellerDoc.data();
    if (!seller.payoutAccount?.accountNumber) {
        throw new functions.https.HttpsError("failed-precondition", "Seller has not set up a payout account yet. Ask them to configure it in their profile.");
    }
    // Load buyer
    const buyerDoc = await db.collection("users").doc(buyerId).get();
    const buyer = buyerDoc.data() ?? {};
    const amount = ad.price;
    const commissionAmount = Math.round(amount * COMMISSION_RATE * 100) / 100;
    const payoutAmount = Math.round((amount - commissionAmount) * 100) / 100;
    const projectId = process.env.GCLOUD_PROJECT ?? "bilu-store-e1a06";
    const region = "us-central1";
    // Create escrow doc first (gets Firestore-generated ID)
    const escrowRef = db.collection("escrow_transactions").doc();
    const txId = escrowRef.id;
    const txRef = `escrow-${txId}`;
    const callbackUrl = `https://${region}-${projectId}.cloudfunctions.net/onChapaEscrowCallback`;
    const telebirrCallbackUrl = `https://${region}-${projectId}.cloudfunctions.net/onTelebirrEscrowCallback`;
    const returnUrl = `bilustore://escrow/${txId}`;
    let checkoutUrl;
    try {
        if (paymentMethod === "CHAPA") {
            const chapaResult = await (0, ChapaService_1.initializeHostedPayment)({
                amount,
                currency: "ETB",
                email: buyer.email ?? `${buyerId}@bilustore.et`,
                firstName: (buyer.name ?? "Buyer").split(" ")[0],
                lastName: (buyer.name ?? "Buyer").split(" ").slice(1).join(" ") || "User",
                txRef,
                callbackUrl,
                returnUrl,
            });
            checkoutUrl = chapaResult.checkoutUrl;
        }
        else {
            const telebirrResult = await (0, TelebirrService_1.initializeTelebirrPayment)({
                outTradeNo: txRef,
                subject: `Bilu Store purchase: ${ad.title}`,
                totalAmount: amount.toFixed(2),
                notifyUrl: telebirrCallbackUrl,
                returnUrl,
                timeoutExpress: "120m",
            });
            checkoutUrl = telebirrResult.toPayUrl;
        }
    }
    catch (err) {
        throw new functions.https.HttpsError("internal", err.message);
    }
    // Persist escrow record (status: pending_payment)
    await escrowRef.set({
        txId,
        adId,
        adTitle: ad.title ?? "",
        adThumbnail: ad.thumbnails?.[0] ?? ad.images?.[0] ?? "",
        buyerId,
        buyerName: buyer.name ?? "Buyer",
        buyerTelegramChatId: buyer.telegramChatId ?? null,
        sellerId: ad.sellerId,
        sellerName: seller.name ?? "Seller",
        amount,
        commissionAmount,
        payoutAmount,
        currency: ad.currency ?? "ETB",
        paymentMethod,
        paymentTxRef: txRef,
        status: "pending_payment",
        deliveryOtpHash: null,
        deliveryOtpExpiresAt: Date.now() + OTP_TTL_MS,
        verifiedAt: null,
        payoutReleaseAt: null,
        completedAt: null,
        refundedAt: null,
        sellerPayoutAccount: seller.payoutAccount,
        createdAt: Date.now(),
    });
    return { txId, checkoutUrl, amount, currency: ad.currency ?? "ETB" };
});
//# sourceMappingURL=onInitiateEscrow.js.map