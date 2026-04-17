'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const role = user?.publicMetadata?.role as string | undefined;
  const banned = user?.publicMetadata?.banned as boolean | undefined;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || banned || role !== 'admin') {
      router.replace('/auth/login');
    }
  }, [isLoaded, isSignedIn, role, banned, router]);

  const authorized = isLoaded && isSignedIn && role === 'admin' && !banned;

  if (!isLoaded || !authorized) {
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
