import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "../utils/fcm";

export const onMessageCreate = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const { chatId } = context.params;
    const messageData = snapshot.data();

    if (!messageData) {
      console.warn("Message data is empty, skipping.");
      return;
    }

    const senderId = messageData.senderId as string;
    const messageText = (messageData.text as string) || "";
    const messagePreview =
      messageText.length > 50
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

    const participants = chatData.participants as string[];
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
    const senderName = (senderData?.name as string) || (senderData?.displayName as string) || "Someone";

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
    await sendPushNotification(
      recipientData.pushToken,
      senderName,
      messagePreview,
      {
        type: "NEW_MESSAGE",
        chatId,
        senderId,
        senderName,
        recipientId,
      }
    );

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
      const adId = chatData.adId as string | undefined;
      const sellerId = chatData.sellerId as string | undefined;

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

          await sendPushNotification(
            sellerData.pushToken,
            "New Interest",
            `${senderName} is interested in "${adTitle}"`,
            {
              type: "AD_INTEREST",
              adId,
              chatId,
              senderId,
              senderName,
              recipientId: sellerId,
            }
          );
        }
      }
    }
  });
