import { httpRouter } from "convex/server";
import { handleClerkWebhook } from "./clerkWebhook";
import { sendSmsOtp } from "./sms";

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

export default http;
