import { useState, useEffect, useCallback } from 'react';
import { fetchAdById } from '../services/AdService';
import type { Ad } from '../types';

export function useAd(adId: string | undefined) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setAd(await fetchAdById(id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load ad');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adId) return;
    let cancelled = false;

    fetchAdById(adId)
      .then((result) => { if (!cancelled) { setAd(result); setIsLoading(false); } })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setIsLoading(false); } });

    return () => { cancelled = true; };
  }, [adId]);

  return {
    ad,
    isLoading,
    error,
    refetch: () => { if (adId) load(adId); },
  };
}
