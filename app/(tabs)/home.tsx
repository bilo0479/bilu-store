import React, { useState, useEffect, useCallback } from 'react';
import { DrawerContent } from '../../src/components/DrawerContent';
import {
  View, Text, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { CategoryRow } from '../../src/components/CategoryGrid';
import { AdCard } from '../../src/components/AdCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonCardGrid } from '../../src/components/Skeleton';
import { OnboardingOverlay } from '../../src/components/OnboardingOverlay';
import { useAuthStore } from '../../src/stores/authStore';
import { useFavoritesStore } from '../../src/stores/favoritesStore';
import { useChatStore } from '../../src/stores/chatStore';
import { useAdsStore } from '../../src/stores/adsStore';
import { redirectToLogin } from '../../src/hooks/useAuth';
import type { Ad } from '../../src/types';
import * as Haptics from 'expo-haptics';

const SCREEN_W = Dimensions.get('window').width;
const AD_CARD_HEIGHT = 280;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { favoriteAdIds, toggle: toggleFav, loadFavorites } = useFavoritesStore();
  const subscribeToChats = useChatStore(s => s.subscribeToChats);

  const { homeFeed: ads, isLoading, loadHomeFeed, loadMoreHomeFeed } = useAdsStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadAds = useCallback(async () => {
    try {
      await loadHomeFeed();
    } catch (e) {
      console.error('Failed to load ads:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadHomeFeed]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFavorites(user.id);
      const unsub = subscribeToChats(user.id);
      return unsub;
    }
  }, [isAuthenticated, user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAds();
  };

  const handleFavorite = async (adId: string) => {
    if (!isAuthenticated || !user) {
      void redirectToLogin(`/ad/${adId}`);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFav(user.id, adId);
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => setDrawerOpen(true)}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu-outline" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>
            {isAuthenticated ? `Hi, ${user?.name?.split(' ')[0] ?? 'there'}` : 'Welcome'}
          </Text>
          <Text style={styles.appName}>Bilu Store</Text>
        </View>
        <Pressable
          onPress={() => {
            if (isAuthenticated) {
              router.push('/favorites' as never);
              return;
            }

            void redirectToLogin('/favorites');
          }}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityLabel="Favorites"
          accessibilityRole="button"
        >
          <Ionicons name="heart-outline" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/search')}
        style={styles.searchBar}
        accessibilityLabel="Search for anything"
        accessibilityRole="search"
      >
        <Ionicons name="search-outline" size={20} color={COLORS.TEXT_MUTED} />
        <Text style={styles.searchPlaceholder}>Search for anything...</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      <CategoryRow onSelect={(id) => router.push(`/category/${id}` as never)} />

      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Recent Listings</Text>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: Ad; index: number }) => (
    <View style={index % 2 === 0 ? styles.leftCard : styles.rightCard}>
      <AdCard
        ad={item}
        onPress={() => router.push(`/ad/${item.id}` as never)}
        onFavorite={() => handleFavorite(item.id)}
        isFavorited={favoriteAdIds.has(item.id)}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: insets.top + 8 }}>
          {renderHeader()}
          <SkeletonCardGrid count={6} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title="No listings yet"
            subtitle="Be the first to post an ad!"
            actionLabel="Post Ad"
            onAction={() => router.push('/(tabs)/post' as never)}
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.ACCENT} />
        }
        showsVerticalScrollIndicator={false}
      />
      <DrawerContent visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <OnboardingOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SCREEN,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BG_SCREEN,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  greeting: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    fontWeight: '500',
  },
  appName: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.BG_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.BG_CARD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  searchPlaceholder: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  list: {
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
  },
  leftCard: {
    flex: 1,
  },
  rightCard: {
    flex: 1,
  },
});
