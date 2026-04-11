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
exports.onMessageCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fcm_1 = require("../utils/fcm");
exports.onMessageCreate = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snapshot, context) => {
    const { chatId } = context.params;
    const messageData = snapshot.data();
    if (!messageData) {
        console.warn("Message data is empty, skipping.");
        return;
    }
    const senderId = messageData.senderId;
    const messageText = messageData.text || "";
    const messagePreview = messageText.length > 50
        ? messageText.substring(0, 50) + "..."
        : messageText;
    // Get the chat document to find participants
    const chatDoc = await admin
        .firestore()
        .collection("chats")
        .doc(chatId)
        .get();
    const chatData = chatDoc.data();
    if (!chatData) {
        console.warn(`Chat ${chatId} not found.`);
        return;
    }
    const participants = chatData.participants;
    if (!participants || participants.length < 2) {
        console.warn(`Chat ${chatId} has insufficient participants.`);
        return;
    }
    // The recipient is the participant who is NOT the sender
    const recipientId = participants.find((id) => id !== senderId);
    if (!recipientId) {
        console.warn("Could not determine recipient.");
        return;
    }
    // Get sender's user doc for display name
    const senderDoc = await admin
        .firestore()
        .collection("users")
        .doc(senderId)
        .get();
    const senderData = senderDoc.data();
    const senderName = senderData?.name || senderData?.displayName || "Someone";
    // Get recipient's user doc for push token
    const recipientDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get();
    const recipientData = recipientDoc.data();
    if (!recipientData?.pushToken) {
        console.log(`Recipient ${recipientId} has no push token.`);
        return;
    }
    // Send new message notification
    await (0, fcm_1.sendPushNotification)(recipientData.pushToken, senderName, messagePreview, {
        type: "NEW_MESSAGE",
        chatId,
        senderId,
        senderName,
        recipientId,
    });
    // Check if this is the first message in the chat (interest notification)
    const messagesSnapshot = await admin
        .firestore()
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .limit(2)
        .get();
    if (messagesSnapshot.size === 1) {
        // This is the first message — send AD_INTEREST to the seller
        const adId = chatData.adId;
        const sellerId = chatData.sellerId;
        if (adId && sellerId && sellerId !== senderId) {
            const sellerDoc = await admin
                .firestore()
                .collection("users")
                .doc(sellerId)
                .get();
            const sellerData = sellerDoc.data();
            if (sellerData?.pushToken) {
                const adDoc = await admin
                    .firestore()
                    .collection("ads")
                    .doc(adId)
                    .get();
                const adTitle = adDoc.data()?.title || "your ad";
                await (0, fcm_1.sendPushNotification)(sellerData.pushToken, "New Interest", `${senderName} is interested in "${adTitle}"`, {
                    type: "AD_INTEREST",
                    adId,
                    chatId,
                    senderId,
                    senderName,
                    recipientId: sellerId,
                });
            }
        }
    }
});
//# sourceMappingURL=onMessageCreate.js.map