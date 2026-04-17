import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../src/constants/colors';
import { AdCard } from '../src/components/AdCard';
import { EmptyState } from '../src/components/EmptyState';
import { SkeletonCardGrid } from '../src/components/Skeleton';
import { useAuthStore } from '../src/stores/authStore';
import { useFavoritesStore } from '../src/stores/favoritesStore';
import { fetchAdById } from '../src/services/AdService';
import { useRequireAuth } from '../src/hooks/useAuth';
import type { Ad } from '../src/types';
import * as Haptics from 'expo-haptics';

const AD_CARD_HEIGHT = 280;

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth('/favorites');
  const { favoriteAdIds, toggle: toggleFav } = useFavoritesStore();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavoriteAds = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const ids = Array.from(favoriteAdIds);
      const results = await Promise.all(ids.map(id => fetchAdById(id)));
      setAds(results.filter((a): a is Ad => !!a));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, favoriteAdIds]);

  useEffect(() => {
    loadFavoriteAds();
  }, [favoriteAdIds.size]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavoriteAds();
  };

  const handleFavorite = async (adId: string) => {
    if (!user) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFav(user.id, adId);
    setAds(ads.filter(a => a.id !== adId));
  };

  if (authLoading || !canAccess || loading) {
    return (
      <View style={[styles.center, { paddingTop: 12 }]}>
        <SkeletonCardGrid count={6} />
      </View>
    );
  }

  return (
    <FlashList
      data={ads}
      keyExtractor={(item) => item.id}
      numColumns={2}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <AdCard
            ad={item}
            onPress={() => router.push(`/ad/${item.id}` as never)}
            onFavorite={() => handleFavorite(item.id)}
            isFavorited={true}
          />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="No favorites yet"
          subtitle="Save ads you like to find them easily later"
          actionLabel="Browse Ads"
          onAction={() => router.push('/(tabs)' as never)}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.ACCENT} />
      }
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN },
  list: { paddingTop: 12, backgroundColor: COLORS.BG_SCREEN },
  row: { paddingHorizontal: 16, gap: 12 },
});
