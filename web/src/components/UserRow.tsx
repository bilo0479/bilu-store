'use client';

import { useState } from 'react';
import { Ban, ShieldCheck, Star, Mail, Phone, Loader2 } from 'lucide-react';
import type { AppUser } from '@/services/auth';
import { banUser, unbanUser } from '@/services/users';

interface UserRowProps {
  user: AppUser;
  onStatusChange: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UserRow({ user, onStatusChange }: UserRowProps) {
  const [loading, setLoading] = useState(false);

  const handleBanToggle = async () => {
    setLoading(true);
    try {
      if (user.banned) {
        await unbanUser(user.id);
      } else {
        await banUser(user.id);
      }
      onStatusChange();
    } catch (error) {
      console.error('Failed to update user ban status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-b border-divider transition-colors hover:bg-bg-screen">
      {/* User info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent">
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">{user.name || 'Unnamed'}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {user.email && (
                <span className="flex items-center gap-0.5">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-0.5">
                  <Phone className="h-3 w-3" />
                  {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            user.role === 'ADMIN'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-status-info'
          }`}
        >
          {user.role === 'ADMIN' && <ShieldCheck className="h-3 w-3" />}
          {user.role}
        </span>
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 text-star-gold" />
          <span className="font-medium text-text-dark">
            {user.averageRating.toFixed(1)}
          </span>
          <span className="text-text-muted">({user.totalReviews})</span>
        </div>
      </td>

      {/* Ads count */}
      <td className="px-4 py-3 text-sm text-text-dark">{user.totalAds}</td>

      {/* Joined */}
      <td className="px-4 py-3 text-sm text-text-muted">
        {formatDate(user.createdAt)}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            user.banned
              ? 'bg-red-100 text-status-error'
              : 'bg-green-100 text-status-success'
          }`}
        >
          {user.banned ? 'Banned' : 'Active'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {user.role !== 'ADMIN' && (
          <button
            onClick={handleBanToggle}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              user.banned
                ? 'bg-green-50 text-status-success hover:bg-green-100'
                : 'bg-red-50 text-status-error hover:bg-red-100'
            }`}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user.banned ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Unban
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                Ban
              </>
            )}
          </button>
        )}
      </td>
    </tr>
  );
}
