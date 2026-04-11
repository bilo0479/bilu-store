import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Smartphone } from 'lucide-react';
import type { Ad } from '@/services/ads';

interface AdCardProps {
  ad: Ad;
  showStatus?: boolean;
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  return `${price.toLocaleString()} ${currency}`;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function AdCard({ ad, showStatus }: AdCardProps) {
  const thumbnailUrl = ad.thumbnails?.[0] || ad.images?.[0] || '';
  void showStatus; // admin pages don't render AdCard, kept for type compat

  return (
    <Link
      href="/download"
      className="group block overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-screen">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={ad.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted text-xs">
            No image
          </div>
        )}

        {/* Premium badge */}
        {ad.isPremium && (
          <div className="absolute left-2 top-2 rounded-full bg-premium-gold px-2 py-0.5 text-xs font-bold text-white shadow">
            Featured
          </div>
        )}

        {/* "View in app" overlay on hover/tap */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-text-dark shadow">
            <Smartphone className="h-3.5 w-3.5 text-accent" />
            View in app
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-text-dark">
          {ad.title}
        </h3>
        <p className="mt-0.5 text-base font-bold text-accent">
          {formatPrice(ad.price, ad.currency)}
          {ad.negotiable && (
            <span className="ml-1 text-xs font-normal text-text-muted">Negotiable</span>
          )}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {ad.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(ad.createdAt)}
          </span>
        </div>
        {/* Subtle "View in app" label always visible */}
        <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
          <Smartphone className="h-3 w-3" />
          <span>Open in app to view</span>
        </div>
      </div>
    </Link>
  );
}
