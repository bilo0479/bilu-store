import { create } from 'zustand';
import * as favoritesService from '../services/FavoriteService';

interface FavoritesState {
  favoriteAdIds: Set<string>;
  isLoading: boolean;
  loadFavorites: (userId: string) => Promise<void>;
  toggle: (userId: string, adId: string) => Promise<void>;
  isFavorited: (adId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteAdIds: new Set<string>(),
  isLoading: false,
  loadFavorites: async (userId) => {
    set({ isLoading: true });
    const ids = await favoritesService.fetchFavoriteIds(userId);
    set({ favoriteAdIds: new Set(ids), isLoading: false });
  },
  toggle: async (userId, adId) => {
    const current = get().favoriteAdIds;
    const newSet = new Set(current);
    if (newSet.has(adId)) {
      newSet.delete(adId);
      set({ favoriteAdIds: newSet });
      await favoritesService.removeFavorite(userId, adId);
    } else {
      newSet.add(adId);
      set({ favoriteAdIds: newSet });
      await favoritesService.addFavorite(userId, adId);
    }
  },
  isFavorited: (adId) => get().favoriteAdIds.has(adId),
}));
