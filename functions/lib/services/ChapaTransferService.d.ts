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
export interface TransferParams {
    accountName: string;
    accountNumber: string;
    bankCode: string;
    amount: number;
    currency: "ETB";
    reference: string;
    callbackUrl?: string;
}
export interface TransferResult {
    transferId: string;
    reference: string;
    status: string;
}
export declare function transferToSeller(params: TransferParams): Promise<TransferResult>;
/** Maps our PayoutAccountType to Chapa bank code */
export declare function toChapaBank(type: string, customBankCode?: string): string;
