/**
 * Admin reports service — Turso-backed via Convex admin actions.
 * Reports are now inserted via mobile Convex action and stored in Turso.
 * For admin review, we query Turso through Convex.
 */
import { convex } from '@/lib/convex';
import { api } from '../../../../convex/_generated/api';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: number;
  reporterId: string;
  targetType: 'listing' | 'user';
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: number;
}

export function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    SPAM: 'Spam or misleading',
    PROHIBITED_ITEM: 'Prohibited item',
    SCAM: 'Suspected scam',
    WRONG_CATEGORY: 'Wrong category',
    DUPLICATE: 'Duplicate listing',
    OFFENSIVE: 'Offensive content',
    OTHER: 'Other',
  };
  return labels[reason] ?? reason;
}

export async function getActiveReportsCount(): Promise<number> {
  const stats = await convex.action(api.admin.getDashboardStats, {});
  return (stats as { disputeCount: number }).disputeCount;
}

// Reports listing delegated to admin.listAuditLogs filtering by 'report' action
export async function getPendingReports(limit = 20, offset = 0): Promise<Report[]> {
  const logs = await convex.action(api.admin.listAuditLogs, {
    action: 'report.create',
    limit,
    offset,
  });
  return (logs as Array<Record<string, unknown>>).map((l) => ({
    id: l.id as number,
    reporterId: l.actorId as string,
    targetType: 'listing' as const,
    targetId: l.targetId as string ?? '',
    reason: (JSON.parse(l.metadata as string ?? '{}').reason as string) ?? 'OTHER',
    details: null,
    createdAt: l.timestamp as number,
  }));
}
