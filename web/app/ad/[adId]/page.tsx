'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Eye,
  Heart,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  User,
} from 'lucide-react';
import { getAdById, type Ad } from '@/services/ads';

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  return `${price.toLocaleString()} ${currency}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Brand New',
  LIKE_NEW: 'Like New',
  USED_GOOD: 'Used - Good',
  USED_FAIR: 'Used - Fair',
};

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adId = params.adId as string;

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!adId) return;

    const loadAd = async () => {
      setLoading(true);
      try {
        const result = await getAdById(adId);
        setAd(result);
      } catch (err) {
        console.error('Failed to load ad:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [adId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-screen">
        <h2 className="text-xl font-bold text-text-dark">Ad not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          This ad is no longer available.
        </p>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const images = ad.images.length > 0 ? ad.images : [];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="min-h-screen bg-bg-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-sm text-text-muted">/</span>
          <span className="text-sm text-text-muted">
            {ad.category.replace('_', ' ')}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Images + Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="relative overflow-hidden rounded-xl border border-border bg-white">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${ad.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                  {ad.isPremium && (
                    <div className="absolute left-3 top-3 rounded-full bg-premium-gold px-3 py-1 text-xs font-bold text-white shadow">
                      Featured
                    </div>
                  )}
                </div>

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((i) =>
                          i === 0 ? images.length - 1 : i - 1
                        )
                      }
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5 text-text-dark" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((i) =>
                          i === images.length - 1 ? 0 : i + 1
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5 text-text-dark" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Thumbnail strip */}
            {hasMultipleImages && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      idx === currentImageIndex
                        ? 'border-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-text-dark">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
                {ad.description}
              </p>
            </div>
          </div>

          {/* Right: Details sidebar */}
          <div className="space-y-4">
            {/* Price & Title */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h1 className="text-xl font-bold text-text-dark">{ad.title}</h1>
              <p className="mt-2 text-2xl font-bold text-accent">
                {formatPrice(ad.price, ad.currency)}
              </p>
              {ad.negotiable && (
                <span className="mt-1 inline-block text-xs text-text-muted">
                  Price negotiable
                </span>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {ad.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(ad.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {ad.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {ad.favoriteCount} saved
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold text-text-dark">
                Details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Category</dt>
                  <dd className="font-medium text-text-dark">
                    <Link
                      href={`/category/${ad.category}`}
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      {ad.category.replace('_', ' ')}
                    </Link>
                  </dd>
                </div>
                {ad.condition && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Condition</dt>
                    <dd className="font-medium text-text-dark">
                      {CONDITION_LABELS[ad.condition] ?? ad.condition}
                    </dd>
                  </div>
                )}
                {ad.subcategory && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Subcategory</dt>
                    <dd className="font-medium text-text-dark">
                      {ad.subcategory}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-muted">Contact</dt>
                  <dd className="font-medium text-text-dark">
                    {ad.contactPreference === 'CHAT_ONLY'
                      ? 'Chat only'
                      : 'Chat & Phone'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Seller */}
            <Link
              href={`/seller/${ad.sellerId}`}
              className="block rounded-xl border border-border bg-white p-6 transition-colors hover:bg-bg-screen"
            >
              <h3 className="mb-3 text-sm font-semibold text-text-dark">
                Seller
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
                  {ad.sellerAvatar ? (
                    <Image
                      src={ad.sellerAvatar}
                      alt={ad.sellerName}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-dark">
                    {ad.sellerName}
                  </p>
                  <p className="text-xs text-accent">View profile</p>
                </div>
              </div>
            </Link>

            {/* Contact button */}
            <button className="btn-primary w-full">
              <MessageCircle className="h-4 w-4" />
              Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
