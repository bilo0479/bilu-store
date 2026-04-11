import * as crypto from "crypto";

/**
 * Telebirr Fabric Payment Gateway integration.
 *
 * Encryption flow:
 * 1. RSA-encrypt appKey using Telebirr's public key  → ussd_push_key (base64)
 * 2. AES-128-ECB-encrypt JSON payload using appKey    → ussd_push_param (base64)
 * 3. POST both fields to the Fabric endpoint
 * 4. Response contains toPayUrl — open in WebView
 *
 * Callback: Telebirr POSTs to notifyUrl after user approves.
 *
 * NOTE: Telebirr has no public sandbox. A merchant account from Ethio Telecom
 * is required. Configure the following in functions/.env:
 *   TELEBIRR_APP_ID
 *   TELEBIRR_APP_KEY
 *   TELEBIRR_SHORT_CODE
 *   TELEBIRR_PUBLIC_KEY   (full RSA public key PEM string)
 *   TELEBIRR_GATEWAY_URL  (e.g. https://196.188.120.3:38443/ammapi/payment/service-openup)
 */

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`${key} is not configured`);
  return val;
}

function rsaEncrypt(data: string, publicKeyPem: string): string {
  const encrypted = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(data, "utf8")
  );
  return encrypted.toString("base64");
}

function aesEcbEncrypt(data: string, key: string): string {
  // AES-128-ECB requires a 16-byte key (pad or trim)
  const keyBuf = Buffer.alloc(16);
  Buffer.from(key, "utf8").copy(keyBuf);
  const cipher = crypto.createCipheriv("aes-128-ecb", keyBuf, null);
  return Buffer.concat([cipher.update(data, "utf8"), cipher.final()]).toString("base64");
}

export interface TelebirrInitParams {
  outTradeNo: string;   // unique order number (tx_ref equivalent)
  subject: string;      // product description shown to user
  totalAmount: string;  // e.g. "100.00"
  notifyUrl: string;    // backend callback URL
  returnUrl: string;    // deep link for post-payment redirect
  timeoutExpress: string; // e.g. "30" (minutes)
}

export interface TelebirrInitResult {
  toPayUrl: string;
  txRef: string;
}

export async function initializeTelebirrPayment(
  params: TelebirrInitParams
): Promise<TelebirrInitResult> {
  const appId = getEnv("TELEBIRR_APP_ID");
  const appKey = getEnv("TELEBIRR_APP_KEY");
  const shortCode = getEnv("TELEBIRR_SHORT_CODE");
  const publicKeyPem = getEnv("TELEBIRR_PUBLIC_KEY");
  const gatewayUrl = getEnv("TELEBIRR_GATEWAY_URL");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(8).toString("hex");

  const payload = {
    appId,
    merch_code: shortCode,
    nonce,
    notifyUrl: params.notifyUrl,
    outTradeNo: params.outTradeNo,
    returnUrl: params.returnUrl,
    subject: params.subject,
    timeoutExpress: params.timeoutExpress,
    timestamp,
    totalAmount: params.totalAmount,
  };

  const ussKey = rsaEncrypt(appKey, publicKeyPem);
  const ussdParam = aesEcbEncrypt(JSON.stringify(payload), appKey);

  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ussKey, ussdParam, appid: appId, merch_code: shortCode }),
    // NOTE: The Telebirr gateway may use a self-signed cert in staging.
    // For production, ensure the cert is valid or pin the cert via a custom agent.
  });

  const json = (await res.json()) as {
    code?: string;
    msg?: string;
    biz_content?: { toPayUrl?: string };
  };

  if (json.code !== "0" || !json.biz_content?.toPayUrl) {
    throw new Error(`Telebirr init failed: ${json.msg ?? "unknown error"}`);
  }

  return { toPayUrl: json.biz_content.toPayUrl, txRef: params.outTradeNo };
}

export interface TelebirrCallbackPayload {
  outTradeNo: string;
  tradeNo: string;
  totalAmount: string;
  tradeStatus: string; // "SUCCESS" on success
  [key: string]: string;
}

/**
 * Verify Telebirr callback signature.
 * Telebirr signs by concatenating sorted key=value pairs (excluding 'sign') with appKey,
 * then MD5-hashing the result in uppercase.
 */
export function verifyTelebirrCallback(
  params: TelebirrCallbackPayload & { sign?: string }
): boolean {
  const appKey = process.env.TELEBIRR_APP_KEY;
  if (!appKey) return false;

  const { sign, ...rest } = params;
  if (!sign) return false;

  const sorted = Object.keys(rest)
    .sort()
    .filter((k) => rest[k] !== undefined && rest[k] !== "")
    .map((k) => `${k}=${rest[k]}`)
    .join("&");

  const toHash = `${sorted}&key=${appKey}`;
  const expected = crypto.createHash("md5").update(toHash).digest("hex").toUpperCase();
  return expected === sign;
}
