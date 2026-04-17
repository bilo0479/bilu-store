import { MutationCtx, ActionCtx } from "convex/server";

// Audit log is append-only — no update/delete path exists in code.
// ESLint rule (P11) will forbid UPDATE/DELETE on audit_logs SQL.

/**
 * Append an audit log entry to Turso audit_logs via Convex Action.
 * In P3 (pre-Turso), this is a lightweight stub that logs to Convex userActivity.
 * P4 rewires this to write directly to Turso.
 */
export async function audit(
  ctx: MutationCtx | ActionCtx,
  action: string,
  meta: Record<string, unknown> = {},
  actorId?: string,
): Promise<void> {
  const identity = actorId
    ? null
    : await ctx.auth.getUserIdentity();
  const actor = actorId ?? identity?.subject ?? "system";

  // P3 stub: write to Convex userActivity so admin feed works immediately
  if ("db" in ctx) {
    await (ctx as MutationCtx).db.insert("userActivity", {
      userId: actor,
      verb: action,
      objectType: meta.targetType as string ?? "system",
      objectId: String(meta.targetId ?? ""),
      createdAt: Date.now(),
    });
  }
  // P4 will add: await turso.insertAuditLog({ actorId: actor, action, ...meta });
}
