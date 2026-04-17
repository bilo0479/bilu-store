/**
 * Convex client singleton for the Next.js web admin.
 * Imported by service helpers; use ConvexProvider in the root layout for React hooks.
 */
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud",
);
