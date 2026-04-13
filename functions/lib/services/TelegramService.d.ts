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
export declare function sendTelegramMessage(chatId: string, text: string): Promise<boolean>;
export declare function buildOtpMessage(otp: string, adTitle: string, amount: number): string;
