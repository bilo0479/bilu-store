/**
 * usePlan — reads the current user's plan from Clerk publicMetadata.
 * Metadata is synced by the pro.ts Convex action after each payment/expiry.
 */
import { useUser } from "@clerk/clerk-expo";

export type Plan = "free" | "pro";

export function usePlan(): Plan {
  const { user } = useUser();
  const plan = user?.publicMetadata?.plan as Plan | undefined;
  return plan ?? "free";
}

export function useIsPro(): boolean {
  return usePlan() === "pro";
}
