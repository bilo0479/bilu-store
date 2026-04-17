/**
 * Admin user service — uses Convex actions instead of Firestore.
 */
import { convex } from '@/lib/convex';
import { api } from '../../../../convex/_generated/api';
import type { UserRow } from '@bilustore/shared';

export async function listUsers(limit = 50, offset = 0): Promise<UserRow[]> {
  return convex.action(api.admin.listUsers, { limit, offset });
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  try {
    return await convex.action(api.admin.getUserById, { userId });
  } catch {
    return null;
  }
}

// These delegate to the mobile-side Convex actions (same backend)
export async function banUser(userId: string): Promise<void> {
  await convex.action(api.users.adminBanUser, { userId });
}

export async function shadowBanUser(userId: string): Promise<void> {
  await convex.action(api.users.adminShadowBan, { userId });
}

export async function setVerificationTier(userId: string, tier: number): Promise<void> {
  await convex.action(api.users.adminSetVerificationTier, { userId, tier });
}

export async function setRole(userId: string, role: string): Promise<void> {
  await convex.action(api.users.adminSetRole, { userId, role });
}

export async function getTotalUsersCount(): Promise<number> {
  const stats = await convex.action(api.admin.getDashboardStats, {});
  return (stats as { totalUsers: number }).totalUsers;
}
