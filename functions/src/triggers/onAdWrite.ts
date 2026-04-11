import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getAlgoliaClient, ALGOLIA_INDEX_NAME } from "../utils/algolia";
import { sendPushNotification } from "../utils/fcm";

export const onAdWrite = functions.firestore
  .document("ads/{adId}")
  .onWrite(async (change, context) => {
    const algoliaClient = getAlgoliaClient();
    const { adId } = context.params;
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;

    // Handle deletion
    if (!afterData) {
      if (algoliaClient) {
        try {
          await algoliaClient.deleteObject({
            indexName: ALGOLIA_INDEX_NAME,
            objectID: adId,
          });
          console.log(`Deleted ad ${adId} from Algolia index.`);
        } catch (error) {
          console.error(`Error deleting ad ${adId} from Algolia:`, error);
        }
      }
      return;
    }

    const currentStatus = afterData.status as string;
    const previousStatus = beforeData?.status as string | undefined;

    // Sync with Algolia
    if (!algoliaClient) {
      console.warn(`Skipping Algolia sync for ad ${adId}; client is not configured.`);
    } else if (currentStatus === "ACTIVE") {
      const algoliaRecord = {
        objectID: adId,
        title: afterData.title || "",
        description: afterData.description || "",
        category: afterData.category || "",
        location: afterData.location || "",
        price: afterData.price || 0,
        condition: afterData.condition || "",
        _geoloc: afterData.coordinates
          ? {
              lat: afterData.coordinates.latitude,
              lng: afterData.coordinates.longitude,
            }
          : undefined,
        updatedAt: afterData.updatedAt?.toMillis() || Date.now(),
      };

      try {
        await algoliaClient.saveObject({
          indexName: ALGOLIA_INDEX_NAME,
          body: algoliaRecord,
        });
        console.log(`Upserted ad ${adId} in Algolia index.`);
      } catch (error) {
        console.error(`Error upserting ad ${adId} in Algolia:`, error);
      }
    } else {
      // Status is not ACTIVE — remove from Algolia
      try {
        await algoliaClient.deleteObject({
          indexName: ALGOLIA_INDEX_NAME,
          objectID: adId,
        });
        console.log(`Removed non-active ad ${adId} from Algolia index.`);
      } catch (error) {
        console.error(`Error removing ad ${adId} from Algolia:`, error);
      }
    }

    // Send FCM notifications on status changes
    const sellerId = afterData.sellerId as string | undefined;
    if (!sellerId) return;

    // Ad approved: status changed from PENDING_REVIEW to ACTIVE
    if (currentStatus === "ACTIVE" && previousStatus === "PENDING_REVIEW") {
      const sellerDoc = await admin
        .firestore()
        .collection("users")
        .doc(sellerId)
        .get();
      const sellerData = sellerDoc.data();

      if (sellerData?.pushToken) {
        await sendPushNotification(
          sellerData.pushToken,
          "Ad Approved",
          `Your ad "${afterData.title}" has been approved and is now live!`,
          {
            type: "AD_APPROVED",
            adId,
            recipientId: sellerId,
          }
        );
      }
    }

    // Ad rejected
    if (currentStatus === "REJECTED" && previousStatus !== "REJECTED") {
      const sellerDoc = await admin
        .firestore()
        .collection("users")
        .doc(sellerId)
        .get();
      const sellerData = sellerDoc.data();

      if (sellerData?.pushToken) {
        const rejectionReason =
          (afterData.rejectionReason as string) || "No reason provided.";

        await sendPushNotification(
          sellerData.pushToken,
          "Ad Rejected",
          `Your ad "${afterData.title}" was rejected: ${rejectionReason}`,
          {
            type: "AD_REJECTED",
            adId,
            reason: rejectionReason,
            recipientId: sellerId,
          }
        );
      }
    }
  });
