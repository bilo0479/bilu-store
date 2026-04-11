'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AdCard from '@/components/AdCard';
import { getAdsByCategory, type Ad, type CategoryId } from '@/services/ads';
import type { DocumentSnapshot } from 'firebase/firestore';

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  ELECTRONICS:    { label: 'Electronics',      emoji: '📱' },
  VEHICLES:       { label: 'Vehicles',          emoji: '🚗' },
  REAL_ESTATE:    { label: 'Real Estate',       emoji: '🏠' },
  FASHION:        { label: 'Fashion',            emoji: '👗' },
  HOME_FURNITURE: { label: 'Home & Furniture',  emoji: '🛋️' },
  JOBS:           { label: 'Jobs',               emoji: '💼' },
  SERVICES:       { label: 'Services',           emoji: '🔧' },
  EDUCATION:      { label: 'Education',          emoji: '📚' },
  SPORTS:         { label: 'Sports & Outdoors',  emoji: '⚽' },
  OTHER:          { label: 'Other',              emoji: '📦' },
};

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as CategoryId;
  const meta = CATEGORY_LABELS[categoryId] ?? { label: categoryId, emoji: '📦' };

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdsByCategory(categoryId, 20);
      setAds(result.ads);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch {
      setError('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { loadAds(); }, [loadAds]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getAdsByCategory(categoryId, 20, lastDoc);
      setAds((prev) => [...prev, ...result.ads]);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-screen">
      <Navbar />

      {/* Sub-header */}
      <div className="sticky top-14 z-40 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1 text-sm text-text-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-base font-bold text-text-dark">
            {meta.emoji} {meta.label}
          </span>
        </div>
      </div>

      <div className="px-4 py-5 pb-28">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-status-error/20 bg-red-50 p-6 text-center">
            <p className="text-sm text-status-error">{error}</p>
            <button onClick={loadAds} className="btn-primary mt-4">Retry</button>
          </div>
        ) : ads.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-text-muted">
            No listings in this category yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
            {hasMore && (
              <div className="mt-6 text-center">
                <button onClick={loadMore} disabled={loadingMore} className="btn-secondary">
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky download banner */}
      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-white px-4 py-3 shadow-md">
        <Link href="/download" className="btn-primary w-full py-3 text-sm">
          📱 Download App — Contact sellers &amp; more
        </Link>
      </div>
    </div>
  );
}
