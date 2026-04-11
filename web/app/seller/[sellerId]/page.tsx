'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2,
  ChevronDown,
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  ShoppingBag,
  User,
} from 'lucide-react';
import AdCard from '@/components/AdCard';
import { getAdsBySeller, type Ad } from '@/services/ads';
import { getUserById } from '@/services/users';
import type { AppUser } from '@/services/auth';
import type { DocumentSnapshot } from 'firebase/firestore';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.sellerId as string;

  const [seller, setSeller] = useState<AppUser | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!sellerId) return;

    const loadSeller = async () => {
      try {
        const profile = await getUserById(sellerId);
        setSeller(profile);
      } catch (err) {
        console.error('Failed to load seller:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSeller();
  }, [sellerId]);

  const loadAds = useCallback(async () => {
    if (!sellerId) return;
    setAdsLoading(true);
    try {
      const result = await getAdsBySeller(sellerId, 20);
      setAds(result.ads);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch (err) {
      console.error('Failed to load seller ads:', err);
    } finally {
      setAdsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getAdsBySeller(sellerId, 20, lastDoc);
      setAds((prev) => [...prev, ...result.ads]);
      setLastDoc(result.lastVisible);
      setHasMore(result.ads.length === 20);
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-screen">
        <h2 className="text-xl font-bold text-text-dark">Seller not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          This profile is no longer available.
        </p>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Seller Profile Card */}
        <div className="mb-8 rounded-xl border border-border bg-white p-6">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-accent-light">
              {seller.avatar ? (
                <Image
                  src={seller.avatar}
                  alt={seller.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-dark">
                {seller.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-star-gold" />
                  <span className="font-medium text-text-dark">
                    {seller.averageRating.toFixed(1)}
                  </span>
                  ({seller.totalReviews} reviews)
                </span>
                {seller.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {seller.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(seller.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4" />
                  {seller.totalAds} listings
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller's Ads */}
        <h2 className="mb-4 text-lg font-semibold text-text-dark">
          Listings by {seller.name}
        </h2>

        {adsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : ads.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center">
            <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-text-muted" />
            <h3 className="text-lg font-semibold text-text-dark">
              No active listings
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              This seller has no active listings at this time.
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
