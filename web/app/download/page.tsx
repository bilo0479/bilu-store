import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Smartphone, Star } from 'lucide-react';

// Replace with your real Play Store URL when published
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? null;

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-screen px-5 py-10">
      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-md text-center">

        {/* App icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent shadow-lg">
          <ShoppingBag className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-2xl font-extrabold text-text-dark">Get Bilu Store</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          View item details, message sellers, post ads, and manage your account — all in the free Android app.
        </p>

        {/* Stars */}
        <div className="mt-4 flex items-center justify-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-premium-gold text-premium-gold" />
          ))}
          <span className="ml-2 text-xs text-text-muted">Free · No ads</span>
        </div>

        {/* Primary CTA */}
        <div className="mt-6 flex flex-col gap-3">
          {PLAY_STORE_URL ? (
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full py-3 text-base"
            >
              <Smartphone className="h-5 w-5" />
              Download for Android
            </a>
          ) : (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border bg-bg-screen p-4">
              <Smartphone className="h-7 w-7 text-accent" />
              <p className="text-sm font-semibold text-text-dark">Coming Soon on Google Play</p>
              <p className="text-xs text-text-muted">We&apos;ll notify you when it&apos;s live.</p>
            </div>
          )}

          {/* Deep-link: opens app if installed, Play Store if not */}
          <a
            href="intent://bilustore.app#Intent;scheme=https;package=com.bilustore.app;end"
            className="btn-secondary w-full py-3 text-base"
          >
            Open in App
          </a>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Back to browsing */}
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Keep browsing on web
        </Link>
      </div>

      {/* Footnote */}
      <p className="mt-6 text-center text-xs text-text-muted">
        Bilu Store · Local Marketplace · Ethiopia
      </p>
    </div>
  );
}
