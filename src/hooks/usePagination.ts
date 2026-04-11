import { useState, useCallback } from 'react';
import type { PaginatedResult } from '../types';

interface UsePaginationOptions<T> {
  fetchFn: (cursor?: string) => Promise<PaginatedResult<T>>;
}

export function usePagination<T>({ fetchFn }: UsePaginationOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInitial = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchFn(undefined);
      setItems(result.items);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return;
    setIsLoading(true);
    try {
      const result = await fetchFn(cursor);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, cursor, hasMore, isLoading]);

  return { items, isLoading, isRefreshing, hasMore, loadInitial, loadMore };
}
