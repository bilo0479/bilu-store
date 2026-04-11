'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import {
  loginWithEmail,
  loginWithGoogle,
  loginWithFacebook,
  getUserProfile,
  type AppUser,
} from '@/services/auth';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in cancelled.',
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email. Sign in with the original method.',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (code && FIREBASE_ERROR_MESSAGES[code]) return FIREBASE_ERROR_MESSAGES[code];
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

function redirectAfterLogin(profile: AppUser, router: ReturnType<typeof useRouter>, redirectTo: string | null) {
  if (profile.banned) return null; // caller shows error
  if (profile.role === 'ADMIN') {
    router.replace('/admin');
  } else {
    router.replace(redirectTo ?? '/');
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password)     { setError('Password is required.'); return; }

    setLoading(true);
    try {
      const firebaseUser = await loginWithEmail(email.trim(), password);
      const profile = await getUserProfile(firebaseUser.uid);
      if (!profile) { setError('User profile not found. Contact support.'); return; }
      if (profile.banned) { setError('Your account has been suspended. Contact support.'); return; }
      redirectAfterLogin(profile, router, redirectTo);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogle();
      if (profile.banned) { setError('Your account has been suspended. Contact support.'); return; }
      redirectAfterLogin(profile, router, redirectTo);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (!msg.includes('cancelled')) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    setError(null);
    setFbLoading(true);
    try {
      const profile = await loginWithFacebook();
      if (profile.banned) { setError('Your account has been suspended. Contact support.'); return; }
      redirectAfterLogin(profile, router, redirectTo);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (!msg.includes('cancelled')) setError(msg);
    } finally {
      setFbLoading(false);
    }
  };

  const anyLoading = loading || googleLoading || fbLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-screen px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-dark">Bilu Store</h1>
          <p className="mt-1 text-sm text-text-muted">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-status-error">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social buttons */}
          <div className="mb-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={anyLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-dark shadow-sm hover:bg-bg-screen disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleFacebook}
              disabled={anyLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {fbLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or sign in with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email / password */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-dark">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoComplete="email"
                  disabled={anyLoading}
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-dark">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10"
                  autoComplete="current-password"
                  disabled={anyLoading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={anyLoading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Bilu Store &mdash; Local Marketplace
        </p>
      </div>
    </div>
  );
}
