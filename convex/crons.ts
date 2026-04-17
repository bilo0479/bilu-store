import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// P3: Activity pruning (30-day retention)
crons.daily(
  "activity.prune",
  { hourUTC: 4, minuteUTC: 0 },
  internal.activity.pruneOldActivity,
  {},
);

// P4 adds: listings.expire, ads.expireBoosts, pro.expirePlans, intel.rebuildTrustScores
// P6 adds: escrowCodes.prune

export default crons;
