/**
 * Telegram Bot API helper for sending OTP notifications to buyers.
 *
 * Setup:
 * 1. Create a bot via @BotFather → get TELEGRAM_BOT_TOKEN
 * 2. User starts the bot (/start) → bot receives their chat_id
 * 3. Store chat_id in users/{uid}.telegramChatId
 *
 * Required env var: TELEGRAM_BOT_TOKEN
 */

const TELEGRAM_API = "https://api.telegram.org";

function getToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<boolean> {
  const token = getToken();
  if (!token) {
    console.warn("[TelegramService] TELEGRAM_BOT_TOKEN not set — skipping notification");
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      console.warn("[TelegramService] Send failed:", json.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[TelegramService] Error:", err);
    return false;
  }
}

export function buildOtpMessage(otp: string, adTitle: string, amount: number): string {
  return (
    `🔐 <b>Bilu Store — Delivery OTP</b>\n\n` +
    `Your item <b>"${adTitle}"</b> is on its way!\n\n` +
    `<b>Delivery Code: <code>${otp}</code></b>\n\n` +
    `Share this code with the seller <b>only when you physically receive the item</b>.\n\n` +
    `Amount held in escrow: <b>${amount.toLocaleString()} ETB</b>\n` +
    `Seller receives payment 8 hours after you confirm delivery.\n\n` +
    `⚠️ Do NOT share this code before receiving your item.`
  );
}
