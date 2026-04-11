import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "../utils/fcm";

export const onReviewCreate = functions.firestore
  .document("reviews/{reviewId}")
  .onCreate(async (snapshot, context) => {
    const reviewData = snapshot.data();

    if (!reviewData) {
      console.warn("Review data is empty, skipping.");
      return;
    }

    const sellerId = reviewData.sellerId as string;
    const reviewerId = reviewData.reviewerId as string;
    const rating = reviewData.rating as number;

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

    const averageRating =
      totalReviews > 0
        ? Math.round((totalRating / totalReviews) * 100) / 100
        : 0;

    // Update seller's user document with recalculated stats
    await db.collection("users").doc(sellerId).update({
      averageRating,
      totalReviews,
    });

    console.log(
      `Updated seller ${sellerId}: averageRating=${averageRating}, totalReviews=${totalReviews}`
    );

    // Send notification to seller
    const sellerDoc = await db.collection("users").doc(sellerId).get();
    const sellerData = sellerDoc.data();

    if (sellerData?.pushToken) {
      // Get reviewer name
      const reviewerDoc = await db.collection("users").doc(reviewerId).get();
      const reviewerName =
        (reviewerDoc.data()?.name as string) ||
        (reviewerDoc.data()?.displayName as string) ||
        "A buyer";

      await sendPushNotification(
        sellerData.pushToken,
        "New Review",
        `${reviewerName} left you a ${rating}-star review.`,
        {
          type: "NEW_REVIEW",
          sellerId,
          reviewerId,
          rating: String(rating),
          recipientId: sellerId,
        }
      );
    }
  });
