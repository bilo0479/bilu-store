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
exports.sendPushNotification = sendPushNotification;
const admin = __importStar(require("firebase-admin"));
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_NOTIFICATIONS_PER_WINDOW = 5;
const rateLimitMap = new Map();
function isRateLimited(userId) {
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
async function sendPushNotification(pushToken, title, body, data) {
    const userId = data.recipientId || pushToken;
    if (isRateLimited(userId)) {
        console.warn(`Rate limited: skipping notification for user ${userId}. ` +
            `Max ${MAX_NOTIFICATIONS_PER_WINDOW} per hour exceeded.`);
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
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
}
//# sourceMappingURL=fcm.js.map