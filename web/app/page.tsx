'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, getUserProfile } from '@/services/auth';
import { ShoppingBag, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile?.role === 'ADMIN') {
            router.replace('/admin');
          } else {
            router.replace('/auth/login');
          }
        } catch {
          router.replace('/auth/login');
        }
      } else {
        router.replace('/auth/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-screen">
      <ShoppingBag className="mb-4 h-12 w-12 text-accent" />
      <h1 className="text-xl font-bold text-text-dark">Bilu Store</h1>
      <div className="mt-4 flex items-center gap-2 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}
