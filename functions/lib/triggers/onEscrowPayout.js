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
exports.onEscrowPayout = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const ChapaTransferService_1 = require("../services/ChapaTransferService");
const TelegramService_1 = require("../services/TelegramService");
/**
 * Scheduled every 15 minutes.
 * Finds all 'verified' escrows whose payoutReleaseAt has passed,
 * transfers funds to seller, marks as 'completed'.
 */
exports.onEscrowPayout = functions.pubsub
    .schedule("every 15 minutes")
    .onRun(async () => {
    const db = admin.firestore();
    const now = Date.now();
    const due = await db
        .collection("escrow_transactions")
        .where("status", "==", "verified")
        .where("payoutReleaseAt", "<=", now)
        .get();
    if (due.empty) {
        functions.logger.info("onEscrowPayout: no payouts due");
        return;
    }
    functions.logger.info(`onEscrowPayout: processing ${due.size} payouts`);
    const results = await Promise.allSettled(due.docs.map(async (snap) => {
        const escrow = snap.data();
        const txId = snap.id;
        try {
            const payout = escrow.sellerPayoutAccount;
            await (0, ChapaTransferService_1.transferToSeller)({
                accountName: payout.accountName,
                accountNumber: payout.accountNumber,
                bankCode: (0, ChapaTransferService_1.toChapaBank)(payout.type, payout.bankCode),
                amount: escrow.payoutAmount,
                currency: "ETB",
                reference: `payout-${txId}`,
            });
            // Mark completed
            await snap.ref.update({
                status: "completed",
                completedAt: Date.now(),
            });
            // Notify seller
            const sellerDoc = await db.collection("users").doc(escrow.sellerId).get();
            const sellerData = sellerDoc.data();
            const pushToken = sellerData?.pushToken;
            if (pushToken) {
                await admin.messaging().send({
                    token: pushToken,
                    notification: {
                        title: "Payment Received!",
                        body: `${escrow.payoutAmount.toLocaleString()} ETB from "${escrow.adTitle}" has been sent to your account.`,
                    },
                    data: { type: "ESCROW_COMPLETED", txId },
                });
            }
            // Telegram to seller
            const sellerChatId = sellerData?.telegramChatId;
            if (sellerChatId) {
                await (0, TelegramService_1.sendTelegramMessage)(sellerChatId, `💰 <b>Payment Received!</b>\n\n` +
                    `<b>${escrow.payoutAmount.toLocaleString()} ETB</b> from "${escrow.adTitle}" ` +
                    `has been sent to your account.\n\n` +
                    `(Platform commission: ${escrow.commissionAmount.toLocaleString()} ETB)`);
            }
            functions.logger.info(`onEscrowPayout: completed txId=${txId}`);
        }
        catch (err) {
            functions.logger.error(`onEscrowPayout: FAILED txId=${txId}`, err);
            // Mark as disputed so admin can handle manually
            await snap.ref.update({ status: "disputed" });
            throw err;
        }
    }));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
        functions.logger.warn(`onEscrowPayout: ${failed}/${due.size} payouts failed`);
    }
});
//# sourceMappingURL=onEscrowPayout.js.map