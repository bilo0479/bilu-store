import { ActionCtx } from "convex/server";
import { ConvexError } from "convex/values";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5;

/**
 * Verifies a reCAPTCHA v3 token server-side.
 * Score < 0.5 → throws ConvexError("captcha_failed").
 * Pass captchaToken = undefined to skip (e.g. internal/admin calls).
 */
export async function assertCaptcha(
  _ctx: ActionCtx,
  captchaToken: string | undefined,
): Promise<void> {
  if (!captchaToken) return;

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // Not configured in this environment — skip silently (dev/test)
    return;
  }

  const body = new URLSearchParams({ secret, response: captchaToken });
  const res = await fetch(RECAPTCHA_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new ConvexError("captcha_verification_error");

  const data = (await res.json()) as { success: boolean; score?: number; "error-codes"?: string[] };

  if (!data.success || (data.score !== undefined && data.score < MIN_SCORE)) {
    throw new ConvexError("captcha_failed");
  }
}
