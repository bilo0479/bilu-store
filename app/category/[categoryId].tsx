import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { AdCard } from '../../src/components/AdCard';
import { EmptyState } from '../../src/components/EmptyState';
import { getCategoryMeta } from '../../src/constants/categories';
import { useAuthStore } from '../../src/stores/authStore';
import { useFavoritesStore } from '../../src/stores/favoritesStore';
import { fetchAdsByCategory } from '../../src/services/AdService';
import { redirectToLogin } from '../../src/hooks/useAuth';
import { useInterstitialAd } from '../../src/hooks/useInterstitialAd';
import type { Ad, CategoryId } from '../../src/types';
import * as Haptics from 'expo-haptics';

const AD_CARD_HEIGHT = 280;

export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { favoriteAdIds, toggle: toggleFav } = useFavoritesStore();
  const { showIfReady } = useInterstitialAd();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const category = getCategoryMeta(categoryId as CategoryId);

  useEffect(() => {
    showIfReady();
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      try {
        const result = await fetchAdsByCategory(categoryId as CategoryId);
        setAds(result.items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId]);

  const handleFavorite = async (adId: string) => {
    if (!isAuthenticated || !user) {
      void redirectToLogin(`/ad/${adId}`);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFav(user.id, adId);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.TEXT_DARK} />
        </Pressable>
        <View style={styles.headerTitleRow}>
          <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={20} color={category.color} />
          <Text style={styles.headerTitle}>{category.label}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.ACCENT} />
        </View>
      ) : (
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
                isFavorited={favoriteAdIds.has(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="storefront-outline" title="No listings in this category" subtitle="Check back later or browse other categories" />
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COLORS.BG_CARD,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 12 },
  row: { paddingHorizontal: 16, gap: 12 },
});
