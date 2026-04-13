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
exports.onPaymentInitialize = void 0;
exports.activatePremiumBoost = activatePremiumBoost;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const ChapaService_1 = require("../services/ChapaService");
const TelebirrService_1 = require("../services/TelebirrService");
const TIER_PRICES = {
    FEATURED: 200,
    TOP_SEARCH: 150,
    HOMEPAGE: 300,
    HIGHLIGHT: 100,
};
const TIER_DURATIONS = {
    FEATURED: 7,
    TOP_SEARCH: 7,
    HOMEPAGE: 3,
    HIGHLIGHT: 7,
};
exports.onPaymentInitialize = functions.https.onCall(async (data, context) => {
    const auth = context.auth;
    if (!auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }
    const { adId, tierId, method } = data;
    if (!adId || !tierId || !method) {
        throw new functions.https.HttpsError("invalid-argument", "adId, tierId, and method are required");
    }
    if (!["CHAPA_HOSTED", "CHAPA_USSD", "TELEBIRR"].includes(method)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid payment method");
    }
    if (!TIER_PRICES[tierId]) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid tier ID");
    }
    const db = admin.firestore();
    // Verify caller owns the ad
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Ad not found");
    }
    const adData = adDoc.data();
    if (adData.sellerId !== auth.uid) {
        throw new functions.https.HttpsError("permission-denied", "You do not own this ad");
    }
    // Check no existing active boost for this tier
    const existingBoost = await db
        .collection("premium_ads")
        .where("adId", "==", adId)
        .where("status", "==", "ACTIVE")
        .limit(1)
        .get();
    if (!existingBoost.empty) {
        throw new functions.https.HttpsError("already-exists", "This ad already has an active boost");
    }
    // Fetch seller profile for payment details
    const sellerDoc = await db.collection("users").doc(auth.uid).get();
    const sellerData = sellerDoc.data() ?? {};
    const sellerName = sellerData.name ?? "Seller";
    const sellerEmail = sellerData.email ?? `${auth.uid}@bilustore.et`;
    const sellerPhone = sellerData.phone ?? "";
    const nameParts = sellerName.split(" ");
    const firstName = nameParts[0] ?? "Seller";
    const lastName = nameParts.slice(1).join(" ") || "User";
    const amount = TIER_PRICES[tierId];
    const txRef = `bilu-${adId}-${tierId}-${Date.now()}`;
    const projectId = process.env.GCLOUD_PROJECT ?? "bilu-store";
    const region = "us-central1";
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/onChapaWebhook`;
    const telebirrCallbackUrl = `https://${region}-${projectId}.cloudfunctions.net/onTelebirrCallback`;
    const returnUrl = `bilustore://payment/result?tx_ref=${txRef}&status=success`;
    // Create payment session in Firestore BEFORE calling payment API
    const sessionRef = db.collection("payment_sessions").doc();
    await sessionRef.set({
        txRef,
        adId,
        tierId,
        sellerId: auth.uid,
        method,
        amount,
        currency: "ETB",
        status: "PENDING",
        createdAt: Date.now(),
        paidAt: null,
    });
    try {
        if (method === "CHAPA_HOSTED") {
            const result = await (0, ChapaService_1.initializeHostedPayment)({
                amount,
                currency: "ETB",
                email: sellerEmail,
                firstName,
                lastName,
                txRef,
                callbackUrl: webhookUrl,
                returnUrl,
            });
            return { txRef, checkoutUrl: result.checkoutUrl };
        }
        if (method === "CHAPA_USSD") {
            if (!sellerPhone) {
                throw new functions.https.HttpsError("failed-precondition", "Phone number required for USSD payment. Update your profile first.");
            }
            await (0, ChapaService_1.initiateUssdPush)({
                amount,
                currency: "ETB",
                phone: sellerPhone,
                txRef,
                callbackUrl: webhookUrl,
            });
            return { txRef, ussdPushSent: true };
        }
        // TELEBIRR
        const result = await (0, TelebirrService_1.initializeTelebirrPayment)({
            outTradeNo: txRef,
            subject: `Bilu Store ${tierId} boost for: ${adData.title}`,
            totalAmount: amount.toFixed(2),
            notifyUrl: telebirrCallbackUrl,
            returnUrl,
            timeoutExpress: "30m",
        });
        return { txRef, checkoutUrl: result.toPayUrl };
    }
    catch (err) {
        // Clean up pending session on API failure
        await sessionRef.delete();
        throw err instanceof functions.https.HttpsError
            ? err
            : new functions.https.HttpsError("internal", err.message);
    }
});
/**
 * Activates a premium boost after successful payment.
 * Called internally by webhook handlers.
 */
async function activatePremiumBoost(adId, tierId, sellerId, txRef) {
    const db = admin.firestore();
    const now = Date.now();
    const durationDays = TIER_DURATIONS[tierId] ?? 7;
    const endDate = now + durationDays * 24 * 60 * 60 * 1000;
    const premiumId = `${adId}_${tierId}_${now}`;
    const batch = db.batch();
    // Create premium_ads record
    batch.set(db.collection("premium_ads").doc(premiumId), {
        id: premiumId,
        adId,
        sellerId,
        tierId,
        status: "ACTIVE",
        startDate: now,
        endDate,
        createdAt: now,
    });
    // Update ad document
    batch.update(db.collection("ads").doc(adId), {
        isPremium: true,
        premiumTier: tierId,
    });
    // Mark payment session as PAID
    const sessionsSnap = await db
        .collection("payment_sessions")
        .where("txRef", "==", txRef)
        .limit(1)
        .get();
    if (!sessionsSnap.empty) {
        batch.update(sessionsSnap.docs[0].ref, { status: "PAID", paidAt: now });
    }
    await batch.commit();
    // Send FCM notification to seller
    const sellerDoc = await db.collection("users").doc(sellerId).get();
    const pushToken = sellerDoc.data()?.pushToken;
    if (pushToken) {
        const adDoc = await db.collection("ads").doc(adId).get();
        const adTitle = adDoc.data()?.title ?? "your ad";
        await admin.messaging().send({
            token: pushToken,
            notification: {
                title: "Boost Activated!",
                body: `Your ${tierId} boost for "${adTitle}" is now live.`,
            },
            data: { type: "PREMIUM_ACTIVATED", adId, tierId },
        });
    }
}
//# sourceMappingURL=onPaymentInitialize.js.map