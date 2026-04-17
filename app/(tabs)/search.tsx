import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, RefreshControl, Dimensions, ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { AdCard } from '../../src/components/AdCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonCardGrid } from '../../src/components/Skeleton';
import { useAuthStore } from '../../src/stores/authStore';
import { useFavoritesStore } from '../../src/stores/favoritesStore';
import { useAdsStore } from '../../src/stores/adsStore';
import { CATEGORIES } from '../../src/constants/categories';
import { redirectToLogin } from '../../src/hooks/useAuth';
import type { Ad, SearchFilters, CategoryId } from '../../src/types';
import * as Haptics from 'expo-haptics';

const AD_CARD_HEIGHT = 280;

type SortBy = 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RELEVANCE';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { favoriteAdIds, toggle: toggleFav } = useFavoritesStore();

  const { searchResults: results, isLoading: loading, search, clearSearch } = useAdsStore();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | undefined>();
  const [sortBy, setSortBy] = useState<SortBy>('NEWEST');

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !selectedCategory) return;
    setHasSearched(true);
    try {
      const filters: SearchFilters = {
        categoryId: selectedCategory,
        sortBy,
      };
      await search(query, filters);
    } catch (e) {
      console.error('Search failed:', e);
    }
  }, [query, selectedCategory, sortBy, search]);

  const handleFavorite = async (adId: string) => {
    if (!isAuthenticated || !user) {
      void redirectToLogin(`/ad/${adId}`);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFav(user.id, adId);
  };

  const renderItem = ({ item, index }: { item: Ad; index: number }) => (
    <View style={{ flex: 1 }}>
      <AdCard
        ad={item}
        onPress={() => router.push(`/ad/${item.id}` as never)}
        onFavorite={() => handleFavorite(item.id)}
        isFavorited={favoriteAdIds.has(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="search-outline" size={20} color={COLORS.TEXT_MUTED} />
            <TextInput
              style={styles.input}
              placeholder="What are you looking for?"
              placeholderTextColor={COLORS.TEXT_MUTED}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.TEXT_MUTED} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={handleSearch} style={styles.searchBtn}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.TEXT_ON_ACCENT} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            onPress={() => { setSelectedCategory(undefined); }}
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>All</Text>
          </Pressable>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {([['NEWEST', 'Newest'], ['PRICE_LOW', 'Price: Low'], ['PRICE_HIGH', 'Price: High']] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { setSortBy(key); handleSearch(); }}
              style={[styles.sortChip, sortBy === key && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, sortBy === key && styles.sortTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading && results.length === 0 ? (
        <View style={styles.list}>
          <SkeletonCardGrid count={6} />
        </View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            hasSearched ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await handleSearch();
                  setRefreshing(false);
                }}
                tintColor={COLORS.ACCENT}
              />
            ) : undefined
          }
          ListEmptyComponent={
            hasSearched ? (
              <EmptyState
                icon="search-outline"
                title="No results found"
                subtitle="Try different keywords or filters"
              />
            ) : (
              <EmptyState
                icon="search-outline"
                title="Find what you need"
                subtitle="Search by keyword, category, or location"
              />
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SCREEN,
  },
  header: {
    backgroundColor: COLORS.BG_CARD,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.BG_SCREEN,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_DARK,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BG_CARD,
  },
  filterChipActive: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  filterText: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  filterTextActive: {
    color: COLORS.TEXT_ON_ACCENT,
  },
  sortRow: {
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.BG_SCREEN,
  },
  sortChipActive: {
    backgroundColor: COLORS.ACCENT_LIGHT,
  },
  sortText: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '500',
    color: COLORS.TEXT_MUTED,
  },
  sortTextActive: {
    color: COLORS.ACCENT,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: 12,
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
