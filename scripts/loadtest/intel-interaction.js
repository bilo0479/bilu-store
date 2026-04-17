/**
 * k6 load test — intel recordInteraction (100 rps batched)
 * Run: k6 run --env CONVEX_URL=https://YOUR.convex.cloud --env CLERK_TOKEN=xxx scripts/loadtest/intel-interaction.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

export const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "10s", target: 100 },
    { duration: "60s", target: 100 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500"],
    errors: ["rate<0.02"],
  },
};

const CONVEX_URL = __ENV.CONVEX_URL;
const TOKEN = __ENV.CLERK_TOKEN;
const VERBS = ["view", "click", "save"];

export default function () {
  const listingId = Math.floor(Math.random() * 1000) + 1;
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];

  const res = http.post(
    `${CONVEX_URL}/api/action`,
    JSON.stringify({ path: "intel:recordInteraction", args: { listingId, verb } }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    },
  );

  const ok = check(res, { "not 5xx": (r) => r.status < 500 });
  errorRate.add(!ok);
  sleep(0.01);
}
