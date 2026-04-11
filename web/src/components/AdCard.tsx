import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Star } from 'lucide-react';
import type { Ad } from '@/services/ads';

interface AdCardProps {
  ad: Ad;
  showStatus?: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-status-success' },
  PENDING_REVIEW: { label: 'Under Review', className: 'bg-yellow-100 text-status-warning' },
  SOLD: { label: 'Sold', className: 'bg-gray-100 text-text-muted' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-status-error' },
  EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-text-muted' },
  DRAFT: { label: 'Draft', className: 'bg-blue-100 text-status-info' },
  REMOVED: { label: 'Removed', className: 'bg-red-100 text-status-error' },
};

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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AdCard({ ad, showStatus = false }: AdCardProps) {
  const statusBadge = STATUS_BADGES[ad.status];
  const thumbnailUrl = ad.thumbnails?.[0] || ad.images?.[0] || '';

  return (
    <Link
      href={`/ad/${ad.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-screen">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={ad.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            No image
          </div>
        )}

        {/* Premium badge */}
        {ad.isPremium && (
          <div className="absolute left-2 top-2 rounded-full bg-premium-gold px-2.5 py-0.5 text-xs font-bold text-white shadow">
            Featured
          </div>
        )}

        {/* Status badge */}
        {showStatus && statusBadge && (
          <div
            className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}
          >
            {statusBadge.label}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-text-dark group-hover:text-accent">
          {ad.title}
        </h3>
        <p className="mt-1 text-lg font-bold text-accent">
          {formatPrice(ad.price, ad.currency)}
          {ad.negotiable && (
            <span className="ml-1 text-xs font-normal text-text-muted">
              Negotiable
            </span>
          )}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {ad.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(ad.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
