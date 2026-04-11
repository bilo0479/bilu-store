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
exports.onPremiumExpiry = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fcm_1 = require("../utils/fcm");
exports.onPremiumExpiry = functions.pubsub
    .schedule("0 0 * * *") // Daily at midnight UTC
    .timeZone("UTC")
    .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const in24Hours = admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
    // 1. Handle expired premium ads
    const expiredSnapshot = await db
        .collection("premium_ads")
        .where("status", "==", "ACTIVE")
        .where("endDate", "<", now)
        .get();
    const expiredBatch = db.batch();
    const expiredSellerIds = [];
    for (const doc of expiredSnapshot.docs) {
        const data = doc.data();
        const adId = data.adId;
        // Update premium_ads doc status to EXPIRED
        expiredBatch.update(doc.ref, { status: "EXPIRED" });
        // Update the ad doc: remove premium flags
        if (adId) {
            const adRef = db.collection("ads").doc(adId);
            expiredBatch.update(adRef, {
                isPremium: false,
                premiumTier: null,
            });
        }
        if (data.sellerId) {
            expiredSellerIds.push(data.sellerId);
        }
    }
    if (expiredSnapshot.size > 0) {
        await expiredBatch.commit();
        console.log(`Expired ${expiredSnapshot.size} premium ad(s) and updated their ad docs.`);
    }
    // 2. Handle premium ads expiring within 24 hours (send warning)
    const expiringSnapshot = await db
        .collection("premium_ads")
        .where("status", "==", "ACTIVE")
        .where("endDate", ">=", now)
        .where("endDate", "<", in24Hours)
        .get();
    for (const doc of expiringSnapshot.docs) {
        const data = doc.data();
        const sellerId = data.sellerId;
        const adId = data.adId;
        if (!sellerId)
            continue;
        const sellerDoc = await db.collection("users").doc(sellerId).get();
        const sellerData = sellerDoc.data();
        if (!sellerData?.pushToken)
            continue;
        let adTitle = "your ad";
        if (adId) {
            const adDoc = await db.collection("ads").doc(adId).get();
            adTitle = adDoc.data()?.title || "your ad";
        }
        await (0, fcm_1.sendPushNotification)(sellerData.pushToken, "Premium Expiring Soon", `Premium placement for "${adTitle}" expires within 24 hours. Renew to keep your boost!`, {
            type: "PREMIUM_EXPIRING",
            adId: adId || "",
            premiumAdId: doc.id,
            recipientId: sellerId,
        });
    }
    console.log(`Sent expiry warnings for ${expiringSnapshot.size} premium ad(s).`);
});
//# sourceMappingURL=onPremiumExpiry.js.map