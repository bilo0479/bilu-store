import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { transferToSeller, toChapaBank } from "../services/ChapaTransferService";
import { sendTelegramMessage } from "../services/TelegramService";

/**
 * Scheduled every 15 minutes.
 * Finds all 'verified' escrows whose payoutReleaseAt has passed,
 * transfers funds to seller, marks as 'completed'.
 */
export const onEscrowPayout = functions.pubsub
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

    const results = await Promise.allSettled(
      due.docs.map(async (snap) => {
        const escrow = snap.data();
        const txId = snap.id;

        try {
          const payout = escrow.sellerPayoutAccount as {
            type: string;
            accountNumber: string;
            accountName: string;
            bankCode?: string;
          };

          await transferToSeller({
            accountName: payout.accountName,
            accountNumber: payout.accountNumber,
            bankCode: toChapaBank(payout.type, payout.bankCode),
            amount: escrow.payoutAmount as number,
            currency: "ETB",
            reference: `payout-${txId}`,
          });

          // Mark completed
          await snap.ref.update({
            status: "completed",
            completedAt: Date.now(),
          });

          // Notify seller
          const sellerDoc = await db.collection("users").doc(escrow.sellerId as string).get();
          const sellerData = sellerDoc.data();

          const pushToken = sellerData?.pushToken as string | undefined;
          if (pushToken) {
            await admin.messaging().send({
              token: pushToken,
              notification: {
                title: "Payment Received!",
                body: `${(escrow.payoutAmount as number).toLocaleString()} ETB from "${escrow.adTitle}" has been sent to your account.`,
              },
              data: { type: "ESCROW_COMPLETED", txId },
            });
          }

          // Telegram to seller
          const sellerChatId = sellerData?.telegramChatId as string | undefined;
          if (sellerChatId) {
            await sendTelegramMessage(
              sellerChatId,
              `💰 <b>Payment Received!</b>\n\n` +
              `<b>${(escrow.payoutAmount as number).toLocaleString()} ETB</b> from "${escrow.adTitle}" ` +
              `has been sent to your account.\n\n` +
              `(Platform commission: ${(escrow.commissionAmount as number).toLocaleString()} ETB)`
            );
          }

          functions.logger.info(`onEscrowPayout: completed txId=${txId}`);
        } catch (err) {
          functions.logger.error(`onEscrowPayout: FAILED txId=${txId}`, err);
          // Mark as disputed so admin can handle manually
          await snap.ref.update({ status: "disputed" });
          throw err;
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      functions.logger.warn(`onEscrowPayout: ${failed}/${due.size} payouts failed`);
    }
  });
