'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Check,
  X,
  Loader2,
  Flag,
  Clock,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  User,
  FileText,
} from 'lucide-react';
import {
  getPendingReports,
  resolveReport,
  dismissReport,
  getReasonLabel,
  type Report,
} from '@/services/reports';
import type { DocumentSnapshot } from 'firebase/firestore';

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPendingReports(20);
      setReports(result.reports);
      setLastDoc(result.lastVisible);
      setHasMore(result.reports.length === 20);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getPendingReports(20, lastDoc);
      setReports((prev) => [...prev, ...result.reports]);
      setLastDoc(result.lastVisible);
      setHasMore(result.reports.length === 20);
    } catch (err) {
      console.error('Failed to load more reports:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleResolve = async (reportId: string) => {
    setActionLoading((prev) => ({ ...prev, [reportId]: true }));
    setActionError(null);
    try {
      await resolveReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Failed to resolve report:', err);
      setActionError('Failed to resolve report. Please try again.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const handleDismiss = async (reportId: string) => {
    setActionLoading((prev) => ({ ...prev, [reportId]: true }));
    setActionError(null);
    try {
      await dismissReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Failed to dismiss report:', err);
      setActionError('Failed to dismiss report. Please try again.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Reports</h1>
          <p className="mt-1 text-sm text-text-muted">
            Review and resolve reported content
          </p>
        </div>
        <button onClick={loadReports} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-status-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-status-error hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-status-error/20 bg-red-50 p-6 text-center">
          <p className="text-sm text-status-error">{error}</p>
          <button onClick={loadReports} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <Flag className="mx-auto mb-3 h-12 w-12 text-status-success" />
          <h3 className="text-lg font-semibold text-text-dark">No pending reports</h3>
          <p className="mt-1 text-sm text-text-muted">
            All reports have been addressed.
          </p>
        </div>
      ) : (
        <>
          {/* Reports Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-screen">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Reporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Reported
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-divider transition-colors hover:bg-bg-screen"
                  >
                    {/* Target */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            report.targetType === 'AD'
                              ? 'bg-accent-light text-accent'
                              : 'bg-blue-50 text-status-info'
                          }`}
                        >
                          {report.targetType === 'AD' ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-dark">
                            {report.targetType}
                          </p>
                          <p className="font-mono text-xs text-text-muted">
                            {report.targetId.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-status-error">
                        {getReasonLabel(report.reason)}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-sm text-text-muted">
                        {report.details || '—'}
                      </p>
                    </td>

                    {/* Reporter */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-text-muted">
                        {report.reporterId.slice(0, 12)}...
                      </p>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(report.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={actionLoading[report.id]}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-status-success transition-colors hover:bg-green-100 disabled:opacity-50"
                        >
                          {actionLoading[report.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Resolve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDismiss(report.id)}
                          disabled={actionLoading[report.id]}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-gray-200 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
