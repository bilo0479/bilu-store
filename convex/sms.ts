import { httpAction } from "convex/server";

interface ClerkSmsPayload {
  phone_number: string;
  otp_code: string;
  message: string;
}

/**
 * Clerk custom SMS provider webhook.
 * Clerk calls this with the OTP code and phone number — we forward to AfricasTalking.
 *
 * Requires env vars:
 *   AT_API_KEY       — AfricasTalking API key
 *   AT_USERNAME      — AfricasTalking username
 *   AT_SENDER_ID     — Short-code or alphanumeric sender (optional)
 */
export const sendSmsOtp = httpAction(async (_ctx, request) => {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    console.error("[SMS] AfricasTalking credentials not configured");
    return new Response("SMS provider not configured", { status: 500 });
  }

  let body: ClerkSmsPayload;
  try {
    body = await request.json() as ClerkSmsPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { phone_number, otp_code } = body;
  if (!phone_number || !otp_code) {
    return new Response("Missing phone_number or otp_code", { status: 400 });
  }

  const message = `Your Bilu Store code is ${otp_code}. Valid for 10 minutes.`;

  const params = new URLSearchParams({
    username,
    to: phone_number,
    message,
    ...(process.env.AT_SENDER_ID ? { from: process.env.AT_SENDER_ID } : {}),
  });

  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      Accept: "application/json",
      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[SMS] AfricasTalking error", res.status, text);
    return new Response("SMS delivery failed", { status: 502 });
  }

  return new Response(null, { status: 200 });
});
