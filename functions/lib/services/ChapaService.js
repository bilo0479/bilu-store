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
exports.initializeHostedPayment = initializeHostedPayment;
exports.initiateUssdPush = initiateUssdPush;
exports.verifyTransaction = verifyTransaction;
exports.verifyWebhookSignature = verifyWebhookSignature;
const crypto = __importStar(require("crypto"));
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
async function initializeHostedPayment(params) {
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
    const json = (await res.json());
    if (!res.ok || json.status !== "success" || !json.data?.checkout_url) {
        throw new Error(`Chapa initialize failed: ${json.message ?? res.statusText}`);
    }
    return { checkoutUrl: json.data.checkout_url, txRef: params.txRef };
}
async function initiateUssdPush(params) {
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
    const json = (await res.json());
    if (!res.ok || json.status !== "success") {
        throw new Error(`Chapa USSD push failed: ${json.message ?? res.statusText}`);
    }
    return { txRef: params.txRef };
}
async function verifyTransaction(txRef) {
    const res = await fetch(`${CHAPA_BASE}/transaction/verify/${encodeURIComponent(txRef)}`, {
        headers: chapaHeaders(),
    });
    const json = (await res.json());
    if (!res.ok) {
        throw new Error(`Chapa verify failed: ${json.message ?? res.statusText}`);
    }
    const data = json.data;
    if (!data)
        throw new Error("Chapa verify returned no data");
    return {
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        txRef: data.tx_ref,
    };
}
function verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.CHAPA_WEBHOOK_SECRET;
    if (!secret)
        throw new Error("CHAPA_WEBHOOK_SECRET is not configured");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
//# sourceMappingURL=ChapaService.js.map