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
exports.onAdWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const algolia_1 = require("../utils/algolia");
const fcm_1 = require("../utils/fcm");
exports.onAdWrite = functions.firestore
    .document("ads/{adId}")
    .onWrite(async (change, context) => {
    const algoliaClient = (0, algolia_1.getAlgoliaClient)();
    const { adId } = context.params;
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;
    // Handle deletion
    if (!afterData) {
        if (algoliaClient) {
            try {
                await algoliaClient.deleteObject({
                    indexName: algolia_1.ALGOLIA_INDEX_NAME,
                    objectID: adId,
                });
                console.log(`Deleted ad ${adId} from Algolia index.`);
            }
            catch (error) {
                console.error(`Error deleting ad ${adId} from Algolia:`, error);
            }
        }
        return;
    }
    const currentStatus = afterData.status;
    const previousStatus = beforeData?.status;
    // Sync with Algolia
    if (!algoliaClient) {
        console.warn(`Skipping Algolia sync for ad ${adId}; client is not configured.`);
    }
    else if (currentStatus === "ACTIVE") {
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
                indexName: algolia_1.ALGOLIA_INDEX_NAME,
                body: algoliaRecord,
            });
            console.log(`Upserted ad ${adId} in Algolia index.`);
        }
        catch (error) {
            console.error(`Error upserting ad ${adId} in Algolia:`, error);
        }
    }
    else {
        // Status is not ACTIVE — remove from Algolia
        try {
            await algoliaClient.deleteObject({
                indexName: algolia_1.ALGOLIA_INDEX_NAME,
                objectID: adId,
            });
            console.log(`Removed non-active ad ${adId} from Algolia index.`);
        }
        catch (error) {
            console.error(`Error removing ad ${adId} from Algolia:`, error);
        }
    }
    // Send FCM notifications on status changes
    const sellerId = afterData.sellerId;
    if (!sellerId)
        return;
    // Ad approved: status changed from PENDING_REVIEW to ACTIVE
    if (currentStatus === "ACTIVE" && previousStatus === "PENDING_REVIEW") {
        const sellerDoc = await admin
            .firestore()
            .collection("users")
            .doc(sellerId)
            .get();
        const sellerData = sellerDoc.data();
        if (sellerData?.pushToken) {
            await (0, fcm_1.sendPushNotification)(sellerData.pushToken, "Ad Approved", `Your ad "${afterData.title}" has been approved and is now live!`, {
                type: "AD_APPROVED",
                adId,
                recipientId: sellerId,
            });
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
            const rejectionReason = afterData.rejectionReason || "No reason provided.";
            await (0, fcm_1.sendPushNotification)(sellerData.pushToken, "Ad Rejected", `Your ad "${afterData.title}" was rejected: ${rejectionReason}`, {
                type: "AD_REJECTED",
                adId,
                reason: rejectionReason,
                recipientId: sellerId,
            });
        }
    }
});
//# sourceMappingURL=onAdWrite.js.map