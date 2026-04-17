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

// Prune expired escrow codes every 5 minutes
crons.interval(
  "escrowCodes.prune",
  { minutes: 5 },
  internal.escrow.pruneExpiredCodes,
  {},
);

// Nightly seller trust score rebuild (3 AM UTC)
crons.daily(
  "intel.rebuildTrustScores",
  { hourUTC: 3, minuteUTC: 0 },
  internal.intel.rebuildTrustScores,
  {},
);

// Prune expired listing suppressions (daily)
crons.daily(
  "intel.pruneSuppressions",
  { hourUTC: 3, minuteUTC: 30 },
  internal.intel.pruneExpiredSuppressions,
  {},
);

// Daily Pro plan expiry check (1 AM UTC)
crons.daily(
  "pro.expirePlans",
  { hourUTC: 1, minuteUTC: 0 },
  internal.pro.expireIfDue,
  {},
);

export default crons;
