'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronDown, RefreshCw, Users } from 'lucide-react';
import { getUsers } from '@/services/users';
import type { AppUser } from '@/services/auth';
import type { DocumentSnapshot } from 'firebase/firestore';
import UserRow from '@/components/UserRow';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers(20);
      setUsers(result.users);
      setLastDoc(result.lastVisible);
      setHasMore(result.users.length === 20);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getUsers(20, lastDoc);
      setUsers((prev) => [...prev, ...result.users]);
      setLastDoc(result.lastVisible);
      setHasMore(result.users.length === 20);
    } catch (err) {
      console.error('Failed to load more users:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Users</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage registered users and permissions
          </p>
        </div>
        <button onClick={loadUsers} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-status-error/20 bg-red-50 p-6 text-center">
          <p className="text-sm text-status-error">{error}</p>
          <button onClick={loadUsers} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-dark">No users found</h3>
          <p className="mt-1 text-sm text-text-muted">
            Users will appear here once they register.
          </p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-screen">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Ads
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onStatusChange={loadUsers}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
