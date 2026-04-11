'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ChevronDown, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import AdCard from '@/components/AdCard';
import { getAdsByCategory, type Ad, type CategoryId } from '@/services/ads';
import type { DocumentSnapshot } from 'firebase/firestore';

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: 'Electronics',
  VEHICLES: 'Vehicles',
  REAL_ESTATE: 'Real Estate',
  FASHION: 'Fashion',
  HOME_FURNITURE: 'Home & Furniture',
  JOBS: 'Jobs',
  SERVICES: 'Services',
  EDUCATION: 'Education',
  SPORTS: 'Sports & Outdoors',
  OTHER: 'Other',
};

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as CategoryId;

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
    } catch (err) {
      console.error('Failed to load category ads:', err);
      setError('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getAdsByCategory(categoryId, 20, lastDoc);
      setAds((prev) => [...prev, ...result.ads]);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const categoryLabel = CATEGORY_LABELS[categoryId] ?? categoryId;

  return (
    <div className="min-h-screen bg-bg-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="text-sm text-text-muted">/</span>
          <span className="flex items-center gap-1 text-sm font-medium text-text-dark">
            <Tag className="h-3.5 w-3.5 text-accent" />
            {categoryLabel}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-text-dark">
          {categoryLabel}
        </h1>

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
            <Tag className="mx-auto mb-3 h-12 w-12 text-text-muted" />
            <h3 className="text-lg font-semibold text-text-dark">
              No listings yet
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              No active listings in this category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
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
    </div>
  );
}
