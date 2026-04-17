/**
 * k6 load test — escrow verify (bcrypt pressure)
 * Target: 20 rps for 30 seconds
 * Run: k6 run --env CONVEX_URL=https://YOUR.convex.cloud --env CLERK_TOKEN=xxx --env DEAL_ID=1 scripts/loadtest/escrow-verify.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

export const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "5s", target: 20 },
    { duration: "30s", target: 20 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    // bcrypt cost 10 ≈ 60 ms per hash; allow generous p(95) budget
    http_req_duration: ["p(95)<5000"],
    errors: ["rate<0.05"],
  },
};

const CONVEX_URL = __ENV.CONVEX_URL;
const TOKEN = __ENV.CLERK_TOKEN;
const DEAL_ID = parseInt(__ENV.DEAL_ID ?? "1");

export default function () {
  const res = http.post(
    `${CONVEX_URL}/api/action`,
    JSON.stringify({ path: "escrow:verify", args: { dealId: DEAL_ID, code: "000000" } }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    },
  );

  // Expect 200 or ConvexError wrong_code — both acceptable under load
  const ok = check(res, {
    "not 5xx": (r) => r.status < 500,
  });
  errorRate.add(!ok);
  sleep(0.05);
}
