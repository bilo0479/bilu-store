import { useState, useCallback, useRef } from 'react';
import { searchAds } from '../services/AdService';
import type { Ad, SearchFilters } from '../types';

const DEBOUNCE_MS = 300;

export function useSearch() {
  const [results, setResults] = useState<Ad[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string, filters?: Partial<SearchFilters>) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!query.trim() && !filters?.categoryId) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const ads = await searchAds(query, filters as SearchFilters);
        setResults(ads);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { results, isSearching, search, clearResults };
}
