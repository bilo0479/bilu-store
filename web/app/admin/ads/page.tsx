'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Clock,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { getPendingAds, approveAd, rejectAd, type Ad } from '@/services/ads';
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

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  return `${price.toLocaleString()} ${currency}`;
}

export default function PendingAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Per-ad action state
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredAds = ads.filter(ad => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ad.title.toLowerCase().includes(q) ||
      ad.sellerName.toLowerCase().includes(q) ||
      ad.location.toLowerCase().includes(q) ||
      ad.category.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAds.map(a => a.id)));
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await handleApprove(id);
    }
    setSelectedIds(new Set());
  };

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPendingAds(20);
      setAds(result.ads);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch (err) {
      console.error('Failed to load pending ads:', err);
      setError('Failed to load pending ads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getPendingAds(20, lastDoc);
      setAds((prev) => [...prev, ...result.ads]);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch (err) {
      console.error('Failed to load more ads:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleApprove = async (adId: string) => {
    setActionLoading((prev) => ({ ...prev, [adId]: true }));
    setActionError(null);
    try {
      await approveAd(adId);
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (err) {
      console.error('Failed to approve ad:', err);
      setActionError(`Failed to approve ad. Please try again.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [adId]: false }));
    }
  };

  const handleReject = async (adId: string) => {
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [adId]: true }));
    setActionError(null);
    try {
      await rejectAd(adId, rejectReason.trim());
      setAds((prev) => prev.filter((a) => a.id !== adId));
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject ad:', err);
      setActionError('Failed to reject ad. Please try again.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [adId]: false }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Pending Ads</h1>
          <p className="mt-1 text-sm text-text-muted">
            Review and approve or reject submitted ads
          </p>
        </div>
        <button onClick={loadAds} className="btn-secondary" disabled={loading}>
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
          <button onClick={loadAds} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : ads.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <Check className="mx-auto mb-3 h-12 w-12 text-status-success" />
          <h3 className="text-lg font-semibold text-text-dark">All caught up!</h3>
          <p className="mt-1 text-sm text-text-muted">
            No ads pending review at this time.
          </p>
        </div>
      ) : (
        <>
          {/* Search & Bulk Actions */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ads by title, seller, location..."
                className="w-full rounded-lg border border-border bg-white py-2 pl-10 pr-4 text-sm text-text-dark placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-status-success transition-colors hover:bg-green-100"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve All
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-bg-screen px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-border"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Ads Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-screen">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filteredAds.length > 0 && selectedIds.size === filteredAds.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Ad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.map((ad) => (
                  <tr
                    key={ad.id}
                    className={`border-b border-divider transition-colors hover:bg-bg-screen ${selectedIds.has(ad.id) ? 'bg-accent-light/30' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ad.id)}
                        onChange={() => toggleSelect(ad.id)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                    </td>
                    {/* Ad info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-bg-screen">
                          {ad.thumbnails?.[0] || ad.images?.[0] ? (
                            <img
                              src={ad.thumbnails?.[0] || ad.images[0]}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-text-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text-dark">
                            {ad.title}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin className="h-3 w-3" />
                            {ad.location}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent-dark">
                        {ad.category.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-sm font-semibold text-text-dark">
                      {formatPrice(ad.price, ad.currency)}
                    </td>

                    {/* Seller */}
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {ad.sellerName}
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(ad.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {rejectingId === ad.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Rejection reason..."
                              className="input-field w-48 text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => handleReject(ad.id)}
                              disabled={actionLoading[ad.id]}
                              className="btn-danger text-xs"
                            >
                              {actionLoading[ad.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                'Reject'
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                                setActionError(null);
                              }}
                              className="btn-secondary text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id)}
                              disabled={actionLoading[ad.id]}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-status-success transition-colors hover:bg-green-100 disabled:opacity-50"
                            >
                              {actionLoading[ad.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(ad.id);
                                setRejectReason('');
                                setActionError(null);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-status-error transition-colors hover:bg-red-100"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}
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
