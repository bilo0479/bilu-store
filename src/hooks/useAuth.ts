/**
 * useAuth hook — P2 Clerk migration
 *
 * Auth state is kept in Zustand (authStore) and is synced from Clerk by the
 * ClerkAuthSync component in app/_layout.tsx. This hook simply reads from the
 * store — no Firebase or Clerk imports needed here.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { saveRedirectIntent } from '../services/AuthService';

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
}

export async function redirectToLogin(
  redirectTo: string,
  navigationMode: 'push' | 'replace' = 'push'
): Promise<void> {
  await saveRedirectIntent(redirectTo);

  if (navigationMode === 'replace') {
    router.replace('/auth/login' as never);
    return;
  }

  router.push('/auth/login' as never);
}

// Redirects to login if not authenticated and preserves the intended destination.
export function useRequireAuth(
  redirectTo: string,
  navigationMode: 'push' | 'replace' = 'replace'
) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void redirectToLogin(redirectTo, navigationMode);
    }
  }, [isAuthenticated, isLoading, navigationMode, redirectTo]);

  return {
    user,
    isAuthenticated,
    isLoading,
    canAccess: !isLoading && isAuthenticated && !!user,
  };
}
