'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AdCard from '@/components/AdCard';
import { getRecentAds, type Ad, type CategoryId } from '@/services/ads';

const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'ELECTRONICS',    label: 'Electronics',      emoji: '📱' },
  { id: 'VEHICLES',       label: 'Vehicles',          emoji: '🚗' },
  { id: 'REAL_ESTATE',    label: 'Real Estate',       emoji: '🏠' },
  { id: 'FASHION',        label: 'Fashion',            emoji: '👗' },
  { id: 'HOME_FURNITURE', label: 'Home & Furniture',  emoji: '🛋️' },
  { id: 'JOBS',           label: 'Jobs',               emoji: '💼' },
  { id: 'SERVICES',       label: 'Services',           emoji: '🔧' },
  { id: 'EDUCATION',      label: 'Education',          emoji: '📚' },
  { id: 'SPORTS',         label: 'Sports',             emoji: '⚽' },
  { id: 'OTHER',          label: 'Other',              emoji: '📦' },
];

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentAds(24)
      .then(setAds)
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border px-4 py-8 text-center">
        <h1 className="text-2xl font-extrabold leading-tight text-text-dark sm:text-3xl">
          Buy &amp; Sell Locally
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Ethiopia&apos;s local marketplace — find great deals near you.
        </p>
        {/* Search bar: decorative, tapping shows download prompt */}
        <Link href="/download" className="mt-5 flex items-center gap-2 mx-auto max-w-md rounded-xl border border-border bg-bg-screen px-4 py-3 text-sm text-text-muted shadow-sm hover:border-accent">
          <Search className="h-4 w-4 flex-shrink-0" />
          <span>Search listings…</span>
          <span className="ml-auto text-xs text-accent font-medium">Use app →</span>
        </Link>
      </section>

      {/* Categories */}
      <section className="px-4 py-6">
        <h2 className="mb-3 text-base font-bold text-text-dark">Browse by Category</h2>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-white p-2.5 text-center text-[10px] font-medium text-text-dark shadow-sm hover:border-accent active:scale-95 transition-all"
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="px-4 pb-10">
        <h2 className="mb-3 text-base font-bold text-text-dark">Recent Listings</h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-14 text-center text-sm text-text-muted">
            No listings yet — check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </section>

      {/* App download banner */}
      <div className="sticky bottom-0 border-t border-border bg-white px-4 py-3 shadow-md">
        <Link
          href="/download"
          className="btn-primary w-full py-3 text-sm"
        >
          📱 Download App — Full experience on Android
        </Link>
      </div>
    </div>
  );
}
