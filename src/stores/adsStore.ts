import { create } from 'zustand';
import { fetchHomeFeed, fetchAdsByCategory, getFeaturedAds } from '../services/AdService';
import { searchByKeyword, browseWithFilters } from '../services/SearchService';
import type { Ad, CategoryId, SearchFilters } from '../types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

interface AdsState {
  homeFeed: Ad[];
  featuredAds: Ad[];
  categoryAds: Ad[];
  searchResults: Ad[];
  isLoading: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;

  loadHomeFeed: () => Promise<void>;
  loadMoreHomeFeed: () => Promise<void>;
  loadFeatured: () => Promise<void>;
  loadCategory: (id: CategoryId) => Promise<void>;
  search: (query: string, filters: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  reset: () => void;
}

export const useAdsStore = create<AdsState>((set, get) => ({
  homeFeed: [],
  featuredAds: [],
  categoryAds: [],
  searchResults: [],
  isLoading: false,
  lastDoc: null,
  hasMore: true,

  loadHomeFeed: async () => {
    set({ isLoading: true });
    try {
      const result = await fetchHomeFeed();
      set({
        homeFeed: result.items,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadMoreHomeFeed: async () => {
    const { lastDoc, hasMore, isLoading, homeFeed } = get();
    if (!hasMore || isLoading) return;
    set({ isLoading: true });
    try {
      const result = await fetchHomeFeed(lastDoc);
      set({
        homeFeed: [...homeFeed, ...result.items],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadFeatured: async () => {
    try {
      const ads = await getFeaturedAds(10);
      set({ featuredAds: ads });
    } catch {
      // silent - featured ads are non-critical
    }
  },

  loadCategory: async (id: CategoryId) => {
    set({ isLoading: true, categoryAds: [] });
    try {
      const result = await fetchAdsByCategory(id);
      set({ categoryAds: result.items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  search: async (queryText: string, filters: SearchFilters) => {
    set({ isLoading: true });
    try {
      let result;
      if (queryText.trim()) {
        result = await searchByKeyword(queryText, filters);
      } else {
        result = await browseWithFilters(filters);
      }
      set({ searchResults: result.items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  reset: () =>
    set({
      homeFeed: [],
      featuredAds: [],
      categoryAds: [],
      searchResults: [],
      isLoading: false,
      lastDoc: null,
      hasMore: true,
    }),
}));
