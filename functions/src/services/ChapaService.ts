import * as crypto from "crypto";

const CHAPA_BASE = "https://api.chapa.co/v1";

function chapaHeaders(): Record<string, string> {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) throw new Error("CHAPA_SECRET_KEY is not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export interface ChapaInitializeParams {
  amount: number;
  currency: "ETB";
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
}

export interface ChapaInitializeResult {
  checkoutUrl: string;
  txRef: string;
}

export async function initializeHostedPayment(
  params: ChapaInitializeParams
): Promise<ChapaInitializeResult> {
  const body = {
    amount: params.amount,
    currency: params.currency,
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    tx_ref: params.txRef,
    callback_url: params.callbackUrl,
    return_url: params.returnUrl,
  };

  const res = await fetch(`${CHAPA_BASE}/transaction/initialize`, {
    method: "POST",
    headers: chapaHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { status: string; data?: { checkout_url: string }; message?: string };

  if (!res.ok || json.status !== "success" || !json.data?.checkout_url) {
    throw new Error(`Chapa initialize failed: ${json.message ?? res.statusText}`);
  }

  return { checkoutUrl: json.data.checkout_url, txRef: params.txRef };
}

export interface ChapaUssdParams {
  amount: number;
  currency: "ETB";
  phone: string;
  txRef: string;
  callbackUrl: string;
}

export async function initiateUssdPush(params: ChapaUssdParams): Promise<{ txRef: string }> {
  const body = {
    amount: params.amount,
    currency: params.currency,
    mobile: params.phone,
    tx_ref: params.txRef,
    callback_url: params.callbackUrl,
  };

  const res = await fetch(`${CHAPA_BASE}/charges?type=telebirr`, {
    method: "POST",
    headers: chapaHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { status: string; message?: string };

  if (!res.ok || json.status !== "success") {
    throw new Error(`Chapa USSD push failed: ${json.message ?? res.statusText}`);
  }

  return { txRef: params.txRef };
}

export interface ChapaVerifyResult {
  status: "success" | "failed" | "pending";
  amount: number;
  currency: string;
  txRef: string;
}

export async function verifyTransaction(txRef: string): Promise<ChapaVerifyResult> {
  const res = await fetch(`${CHAPA_BASE}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: chapaHeaders(),
  });

  const json = (await res.json()) as {
    status: string;
    data?: { status: string; amount: number; currency: string; tx_ref: string };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(`Chapa verify failed: ${json.message ?? res.statusText}`);
  }

  const data = json.data;
  if (!data) throw new Error("Chapa verify returned no data");

  return {
    status: data.status as ChapaVerifyResult["status"],
    amount: data.amount,
    currency: data.currency,
    txRef: data.tx_ref,
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) throw new Error("CHAPA_WEBHOOK_SECRET is not configured");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
