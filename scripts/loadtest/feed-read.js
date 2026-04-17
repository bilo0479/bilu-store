/**
 * k6 load test — feed read
 * Target: 200 rps sustained for 2 minutes
 * Run: k6 run --env CONVEX_URL=https://YOUR.convex.cloud --env CLERK_TOKEN=xxx scripts/loadtest/feed-read.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

export const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "15s", target: 50 },   // ramp up
    { duration: "90s", target: 200 },  // sustain 200 rps
    { duration: "15s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    errors: ["rate<0.01"],
  },
};

const CONVEX_URL = __ENV.CONVEX_URL;
const TOKEN = __ENV.CLERK_TOKEN;

export default function () {
  const payload = JSON.stringify([
    { args: { category: null, limit: 20 } },
  ]);

  const res = http.post(
    `${CONVEX_URL}/api/action`,
    JSON.stringify({ path: "listings:getFeed", args: { limit: 20 } }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    },
  );

  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "has value": (r) => r.json("value") !== undefined,
  });
  errorRate.add(!ok);
  sleep(0.005);
}
