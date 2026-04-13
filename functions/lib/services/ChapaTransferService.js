"use strict";
/**
 * Chapa Transfer API — disburse funds from platform account to sellers.
 *
 * Requires Chapa business account with Transfer API enabled.
 * Contact support@chapa.co to activate payout/transfer access.
 *
 * Chapa bank codes (common Ethiopian banks):
 *   telebirr  → "TELEBIRR"  (Ethio Telecom mobile money)
 *   cbe       → "CBEBirr"   (Commercial Bank of Ethiopia)
 *   awash     → "Awash"
 *   dashen    → "Dashen"
 *   abyssinia → "Abyssinia"
 *
 * Required env var: CHAPA_SECRET_KEY
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferToSeller = transferToSeller;
exports.toChapaBank = toChapaBank;
const CHAPA_BASE = "https://api.chapa.co/v1";
function chapaHeaders() {
    const key = process.env.CHAPA_SECRET_KEY;
    if (!key)
        throw new Error("CHAPA_SECRET_KEY is not configured");
    return {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
    };
}
async function transferToSeller(params) {
    const body = {
        account_name: params.accountName,
        account_number: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        reference: params.reference,
        bank_code: params.bankCode,
        ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
    };
    const res = await fetch(`${CHAPA_BASE}/transfers`, {
        method: "POST",
        headers: chapaHeaders(),
        body: JSON.stringify(body),
    });
    const json = (await res.json());
    if (!res.ok || json.status !== "success") {
        throw new Error(`Chapa transfer failed: ${json.message ?? res.statusText}`);
    }
    return {
        transferId: json.data?.transfer_id ?? params.reference,
        reference: json.data?.reference ?? params.reference,
        status: json.data?.status ?? "pending",
    };
}
/** Maps our PayoutAccountType to Chapa bank code */
function toChapaBank(type, customBankCode) {
    const map = {
        telebirr: "TELEBIRR",
        cbe: "CBEBirr",
        bank: customBankCode ?? "Awash",
    };
    return map[type] ?? customBankCode ?? type;
}
//# sourceMappingURL=ChapaTransferService.js.map