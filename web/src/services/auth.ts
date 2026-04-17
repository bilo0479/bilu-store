/**
 * Admin auth service — uses Clerk instead of Firebase Auth.
 * Login/logout handled by @clerk/nextjs components in /auth/login.
 * This module provides the types + helpers used by admin pages.
 */
export interface AppUser {
  id: string;
  name: string;
  email: string | null;
  role: 'admin' | 'seller' | 'buyer';
  banned: boolean;
  verificationTier?: number;
}

// Clerk auth state is read via useAuth() / useUser() React hooks.
// These imperative exports exist only for backwards-compatibility with
// admin pages that call them in useEffect (replaced by Clerk hooks in layout).

export function onAuthStateChanged(_callback: (user: null) => void): () => void {
  // No-op — admin layout now uses Clerk hooks directly.
  return () => {};
}

export async function getUserProfile(_uid: string): Promise<null> {
  return null;
}

export async function logout(): Promise<void> {
  // Clerk sign-out — call useClerk().signOut() from React component instead.
}
