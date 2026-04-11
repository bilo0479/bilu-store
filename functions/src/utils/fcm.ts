import * as admin from "firebase-admin";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_NOTIFICATIONS_PER_WINDOW = 5;

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (entry.count >= MAX_NOTIFICATIONS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<string | null> {
  const userId = data.recipientId || pushToken;

  if (isRateLimited(userId)) {
    console.warn(
      `Rate limited: skipping notification for user ${userId}. ` +
        `Max ${MAX_NOTIFICATIONS_PER_WINDOW} per hour exceeded.`
    );
    return null;
  }

  try {
    const messageId = await admin.messaging().send({
      token: pushToken,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    console.log(`Notification sent successfully: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}
