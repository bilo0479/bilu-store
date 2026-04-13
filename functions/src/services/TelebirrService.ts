import * as crypto from "crypto";
import * as https from "https";

/**
 * HTTPS agent that skips certificate verification for the Telebirr gateway.
 * The gateway at 196.188.120.3:38443 uses a self-signed certificate.
 * Scoped only to Telebirr requests — never used globally.
 */
const telebirrAgent = new https.Agent({ rejectUnauthorized: false });

/** POST JSON to the Telebirr gateway using a TLS-tolerant https.Agent */
function telebirrPost(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 443,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...headers },
        agent: telebirrAgent,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Telebirr HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          } else {
            try { resolve(JSON.parse(data)); } catch { reject(new Error("Telebirr: invalid JSON response")); }
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Telebirr OpenAPI Payment Integration (apiaccess gateway).
 *
 * Flow:
 * 1. getAppToken()               → Bearer token (send with every request)
 * 2. initializeTelebirrPayment() → preOrder → prepay_id + H5 checkout URL
 * 3. Mobile opens checkoutUrl in WebView → user authenticates and pays
 * 4. Telebirr POSTs to notifyUrl → onTelebirrCallback queries order to confirm
 *
 * Required env vars in functions/.env:
 *   TELEBIRR_APP_ID          — appid from developer portal
 *   TELEBIRR_APP_SECRET      — appSecret from developer portal
 *   TELEBIRR_MERCHANT_CODE   — merchant short code (merch_code)
 *   TELEBIRR_MERCHANT_ID     — merchant app ID (appid inside biz_content)
 *   TELEBIRR_PRIVATE_KEY     — PKCS8 private key base64, no PEM headers
 *   TELEBIRR_GATEWAY_URL     — https://196.188.120.3:38443/apiaccess/payment/gateway
 */

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

/** Wrap raw base64 PKCS8 private key in PEM headers for Node crypto */
function toPkcs8Pem(raw: string): string {
  const clean = raw.replace(/[\r\n\s]/g, "");
  const lines = clean.match(/.{1,64}/g)!.join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

/**
 * Build the sign string and sign with SHA256WithRSA.
 * All top-level params (excluding "sign") are sorted by key, joined as
 * key=value pairs. Object values (biz_content) are JSON-serialised.
 */
function signRequest(params: Record<string, unknown>, privateKeyPem: string): string {
  const signStr = Object.keys(params)
    .filter((k) => k !== "sign" && params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) =>
      `${k}=${typeof params[k] === "object" ? JSON.stringify(params[k]) : String(params[k])}`
    )
    .join("&");

  const signer = crypto.createSign("SHA256");
  signer.update(signStr, "utf8");
  return signer.sign(privateKeyPem, "base64");
}

function nonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function ts(): string {
  return Math.floor(Date.now() / 1000).toString();
}

// ── Step 1: Bearer token ─────────────────────────────────────────────────────

async function getAppToken(): Promise<string> {
  const gateway = getEnv("TELEBIRR_GATEWAY_URL");
  const appId = getEnv("TELEBIRR_APP_ID");
  const appSecret = getEnv("TELEBIRR_APP_SECRET");

  const json = await telebirrPost(
    `${gateway}/payment/v1/token`,
    { "X-APP-Key": appId },
    { appSecret }
  ) as { token?: string };

  if (!json.token) throw new Error("Telebirr: no token in response");
  return json.token;
}

// ── Step 2: Create pre-order ─────────────────────────────────────────────────

export interface TelebirrInitParams {
  outTradeNo: string;      // unique order ID (our txRef)
  subject: string;         // item description shown to user
  totalAmount: string;     // e.g. "100.00"
  notifyUrl: string;       // Cloud Function callback URL
  returnUrl: string;       // deep-link after payment (bilustore://...)
  timeoutExpress?: string; // e.g. "120m"
}

export interface TelebirrInitResult {
  toPayUrl: string;  // H5 checkout URL — open in WebView
  txRef: string;
}

export async function initializeTelebirrPayment(
  params: TelebirrInitParams
): Promise<TelebirrInitResult> {
  const gateway = getEnv("TELEBIRR_GATEWAY_URL");
  const appId = getEnv("TELEBIRR_APP_ID");
  const merchantCode = getEnv("TELEBIRR_MERCHANT_CODE");
  const merchantId = getEnv("TELEBIRR_MERCHANT_ID");
  const privateKeyPem = toPkcs8Pem(getEnv("TELEBIRR_PRIVATE_KEY"));

  const token = await getAppToken();

  const bizContent = {
    trans_currency: "ETB",
    total_amount: params.totalAmount,
    merch_order_id: params.outTradeNo,
    appid: merchantId,
    merch_code: merchantCode,
    timeout_express: params.timeoutExpress ?? "120m",
    trade_type: "InApp",
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    title: params.subject,
    business_type: "BuyGoods",
    payee_identifier: merchantCode,
    payee_identifier_type: "04",
    payee_type: "5000",
  };

  const body: Record<string, unknown> = {
    nonce_str: nonce(),
    biz_content: bizContent,
    method: "payment.preorder",
    version: "1.0",
    sign_type: "SHA256WithRSA",
    timestamp: ts(),
  };
  body.sign = signRequest(body, privateKeyPem);

  const json = await telebirrPost(
    `${gateway}/payment/v1/merchant/preOrder`,
    { Authorization: token, "x-app-key": appId },
    body
  ) as {
    code?: string;
    msg?: string;
    biz_content?: { prepay_id?: string; toPayUrl?: string };
  };

  if (!json.biz_content?.prepay_id) {
    throw new Error(`Telebirr preOrder error: ${json.msg ?? JSON.stringify(json)}`);
  }

  const prepayId = json.biz_content.prepay_id;

  // Some gateway versions return toPayUrl directly; otherwise construct it.
  const toPayUrl =
    json.biz_content.toPayUrl ??
    `${gateway}/payment/v1/h5pay?prepay_id=${prepayId}&appid=${merchantId}&merch_code=${merchantCode}`;

  return { toPayUrl, txRef: params.outTradeNo };
}

// ── Query order status ────────────────────────────────────────────────────────

export interface TelebirrOrderStatus {
  tradeStatus: string;   // "SUCCESS" | "FAIL" | "PAYING" etc.
  tradeNo?: string;      // Telebirr's internal trade number
}

export async function queryTelebirrOrder(
  merchOrderId: string
): Promise<TelebirrOrderStatus> {
  const gateway = getEnv("TELEBIRR_GATEWAY_URL");
  const appId = getEnv("TELEBIRR_APP_ID");
  const merchantCode = getEnv("TELEBIRR_MERCHANT_CODE");
  const merchantId = getEnv("TELEBIRR_MERCHANT_ID");
  const privateKeyPem = toPkcs8Pem(getEnv("TELEBIRR_PRIVATE_KEY"));

  const token = await getAppToken();

  const body: Record<string, unknown> = {
    timestamp: ts(),
    nonce_str: nonce(),
    method: "payment.queryorder",
    sign_type: "SHA256WithRSA",
    version: "1.0",
    biz_content: {
      appid: merchantId,
      merch_code: merchantCode,
      merch_order_id: merchOrderId,
    },
  };
  body.sign = signRequest(body, privateKeyPem);

  const json = await telebirrPost(
    `${gateway}/payment/v1/merchant/queryOrder`,
    { Authorization: token, "x-app-key": appId },
    body
  ) as {
    biz_content?: { trade_status?: string; trade_no?: string };
  };

  return {
    tradeStatus: json.biz_content?.trade_status ?? "UNKNOWN",
    tradeNo: json.biz_content?.trade_no,
  };
}

// ── Callback payload type ─────────────────────────────────────────────────────

/**
 * Fields Telebirr POSTs to our notifyUrl after payment.
 * Field names follow the OpenAPI spec (snake_case).
 */
export interface TelebirrCallbackPayload {
  merch_order_id: string;    // our txRef
  trade_no?: string;         // Telebirr trade number
  trade_status?: string;     // "SUCCESS" | "FAIL"
  total_amount?: string;
  sign?: string;
  [key: string]: string | undefined;
}

/**
 * Verify payment by querying Telebirr directly rather than trusting callback
 * signature alone. Returns true only when the order status is SUCCESS.
 */
export async function verifyTelebirrPayment(merchOrderId: string): Promise<boolean> {
  try {
    const { tradeStatus } = await queryTelebirrOrder(merchOrderId);
    return tradeStatus === "SUCCESS";
  } catch {
    return false;
  }
}
