import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Activity pruning — 30-day retention
crons.daily(
  "activity.prune",
  { hourUTC: 4, minuteUTC: 0 },
  internal.activity.pruneOldActivity,
  {},
);

// Expire listings past their expiresAt timestamp (runs hourly)
crons.hourly(
  "listings.expire",
  { minuteUTC: 5 },
  internal.listings.expireListingsCron,
  {},
);

// P7 adds: intel.rebuildTrustScores
// P9 adds: pro.expirePlans

export default crons;
