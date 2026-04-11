'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, LogOut, LayoutDashboard, ChevronDown, User, Smartphone } from 'lucide-react';
import { onAuthStateChanged, getUserProfile, logout, type AppUser } from '@/services/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setUser(await getUserProfile(firebaseUser.uid));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-accent" />
          <span className="font-bold text-text-dark">Bilu Store</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* "Get the App" — always visible */}
          <Link
            href="/download"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Get the App</span>
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-sm text-text-dark hover:bg-bg-screen"
              >
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-text-muted" />
                )}
                <span className="hidden max-w-[100px] truncate sm:block">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-white py-1 shadow-lg">
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-bg-screen"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-status-error hover:bg-bg-screen"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-dark hover:bg-bg-screen"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg border border-accent px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/5"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
