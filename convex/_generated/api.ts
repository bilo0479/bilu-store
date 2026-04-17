/**
 * AUTO-GENERATED stub — replace by running `npx convex dev` after setting CONVEX_DEPLOYMENT.
 *
 * This file exists so TypeScript can compile without a live Convex deployment.
 * The real generated version is produced by the Convex CLI and should NOT be
 * checked in once the project is deployed (add convex/_generated/ to .gitignore
 * after first `npx convex dev` run).
 *
 * Setup:
 *   1. Create a Convex project at https://dashboard.convex.dev
 *   2. Set CONVEX_DEPLOYMENT in .env
 *   3. Run: npx convex dev  (generates real types + pushes functions)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api: any = new Proxy({}, {
  get(_, prop) {
    return new Proxy({}, {
      get(_, fn) {
        return `${String(prop)}:${String(fn)}`;
      },
    });
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const internal: any = new Proxy({}, {
  get(_, prop) {
    return new Proxy({}, {
      get(_, fn) {
        return `internal.${String(prop)}:${String(fn)}`;
      },
    });
  },
});

export type Id<_T extends string> = string;
export type Doc<_T extends string> = Record<string, unknown>;
export type DataModel = Record<string, unknown>;
