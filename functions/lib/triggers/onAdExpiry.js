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
exports.onAdExpiry = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fcm_1 = require("../utils/fcm");
/**
 * Daily scheduled job that expires ads whose 30-day TTL has passed.
 * Ads with expiresAt < now and status ACTIVE are set to EXPIRED.
 * Sellers receive a push notification with a republish prompt.
 */
exports.onAdExpiry = functions.pubsub
    .schedule("30 0 * * *") // Daily at 00:30 UTC (offset from onPremiumExpiry at 00:00)
    .timeZone("UTC")
    .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const expiredSnapshot = await db
        .collection("ads")
        .where("status", "==", "ACTIVE")
        .where("expiresAt", "<", now.toMillis())
        .get();
    if (expiredSnapshot.empty) {
        console.log("No ads to expire.");
        return;
    }
    console.log(`Expiring ${expiredSnapshot.size} ad(s)...`);
    // Process in batches of 500 (Firestore batch limit)
    const BATCH_LIMIT = 500;
    const docs = expiredSnapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
        const chunk = docs.slice(i, i + BATCH_LIMIT);
        const batch = db.batch();
        for (const doc of chunk) {
            // Expire the ad
            batch.update(doc.ref, {
                status: "EXPIRED",
                updatedAt: Date.now(),
            });
            // Write status history entry
            const historyRef = db
                .collection("ads")
                .doc(doc.id)
                .collection("status_history")
                .doc();
            batch.set(historyRef, {
                fromStatus: "ACTIVE",
                toStatus: "EXPIRED",
                changedAt: admin.firestore.FieldValue.serverTimestamp(),
                changedBy: "system",
                reason: "Ad listing expired after 30 days",
            });
        }
        await batch.commit();
    }
    // Notify sellers after batch commits
    const notifyPromises = docs.map(async (doc) => {
        const data = doc.data();
        const sellerId = data.sellerId;
        const adTitle = data.title || "your ad";
        if (!sellerId)
            return;
        const sellerDoc = await db.collection("users").doc(sellerId).get();
        const sellerData = sellerDoc.data();
        if (!sellerData?.pushToken)
            return;
        await (0, fcm_1.sendPushNotification)(sellerData.pushToken, "Listing Expired", `"${adTitle}" has expired after 30 days. Republish to keep it visible.`, {
            type: "AD_EXPIRED",
            adId: doc.id,
            recipientId: sellerId,
        });
    });
    await Promise.allSettled(notifyPromises);
    console.log(`Expired ${docs.length} ad(s) and notified sellers.`);
});
//# sourceMappingURL=onAdExpiry.js.map