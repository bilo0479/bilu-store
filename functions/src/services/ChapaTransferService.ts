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

const CHAPA_BASE = "https://api.chapa.co/v1";

function chapaHeaders(): Record<string, string> {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) throw new Error("CHAPA_SECRET_KEY is not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export interface TransferParams {
  accountName: string;
  accountNumber: string;
  bankCode: string;       // Chapa bank/wallet code
  amount: number;
  currency: "ETB";
  reference: string;      // unique, idempotent reference (our escrow txId)
  callbackUrl?: string;
}

export interface TransferResult {
  transferId: string;
  reference: string;
  status: string;
}

export async function transferToSeller(params: TransferParams): Promise<TransferResult> {
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

  const json = (await res.json()) as {
    status: string;
    message?: string;
    data?: { transfer_id?: string; reference?: string; status?: string };
  };

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
export function toChapaBank(type: string, customBankCode?: string): string {
  const map: Record<string, string> = {
    telebirr: "TELEBIRR",
    cbe: "CBEBirr",
    bank: customBankCode ?? "Awash",
  };
  return map[type] ?? customBankCode ?? type;
}
