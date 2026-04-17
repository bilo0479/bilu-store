import { httpRouter } from "convex/server";
import { handleClerkWebhook } from "./clerkWebhook";
import { sendSmsOtp } from "./sms";
import { onPaymentConfirmed } from "./escrow";

const http = httpRouter();

// Clerk webhook — receives user.created / user.updated / session.ended events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

// AfricasTalking SMS OTP — called by Clerk custom SMS provider
http.route({
  path: "/send-sms-otp",
  method: "POST",
  handler: sendSmsOtp,
});

// Chapa + Telebirr payment confirmation webhook
http.route({
  path: "/escrow-webhook",
  method: "POST",
  handler: onPaymentConfirmed,
});

export default http;
