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
exports.onReviewCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fcm_1 = require("../utils/fcm");
exports.onReviewCreate = functions.firestore
    .document("reviews/{reviewId}")
    .onCreate(async (snapshot, context) => {
    const reviewData = snapshot.data();
    if (!reviewData) {
        console.warn("Review data is empty, skipping.");
        return;
    }
    const sellerId = reviewData.sellerId;
    const reviewerId = reviewData.reviewerId;
    const rating = reviewData.rating;
    if (!sellerId) {
        console.warn("Review missing sellerId, skipping.");
        return;
    }
    const db = admin.firestore();
    // Recalculate seller's average rating from all reviews
    const allReviewsSnapshot = await db
        .collection("reviews")
        .where("sellerId", "==", sellerId)
        .get();
    let totalRating = 0;
    let totalReviews = 0;
    allReviewsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (typeof data.rating === "number") {
            totalRating += data.rating;
            totalReviews += 1;
        }
    });
    const averageRating = totalReviews > 0
        ? Math.round((totalRating / totalReviews) * 100) / 100
        : 0;
    // Update seller's user document with recalculated stats
    await db.collection("users").doc(sellerId).update({
        averageRating,
        totalReviews,
    });
    console.log(`Updated seller ${sellerId}: averageRating=${averageRating}, totalReviews=${totalReviews}`);
    // Send notification to seller
    const sellerDoc = await db.collection("users").doc(sellerId).get();
    const sellerData = sellerDoc.data();
    if (sellerData?.pushToken) {
        // Get reviewer name
        const reviewerDoc = await db.collection("users").doc(reviewerId).get();
        const reviewerName = reviewerDoc.data()?.name ||
            reviewerDoc.data()?.displayName ||
            "A buyer";
        await (0, fcm_1.sendPushNotification)(sellerData.pushToken, "New Review", `${reviewerName} left you a ${rating}-star review.`, {
            type: "NEW_REVIEW",
            sellerId,
            reviewerId,
            rating: String(rating),
            recipientId: sellerId,
        });
    }
});
//# sourceMappingURL=onReviewCreate.js.map