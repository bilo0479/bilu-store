'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingBag } from 'lucide-react';
import { onAuthStateChanged, getUserProfile, type AppUser } from '@/services/auth';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/auth/login');
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);

        if (!profile) {
          router.replace('/auth/login');
          return;
        }

        if (profile.banned) {
          router.replace('/auth/login');
          return;
        }

        if (profile.role !== 'ADMIN') {
          router.replace('/auth/login');
          return;
        }

        setAuthorized(true);
      } catch {
        router.replace('/auth/login');
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-screen">
        <ShoppingBag className="mb-4 h-10 w-10 text-accent" />
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-screen">
      <AdminSidebar />
      <main className="ml-64 min-h-screen p-6">{children}</main>
    </div>
  );
}
