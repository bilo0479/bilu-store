import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../src/constants/colors';
import { AdCard } from '../src/components/AdCard';
import { EmptyState } from '../src/components/EmptyState';
import { useAuthStore } from '../src/stores/authStore';
import { useFavoritesStore } from '../src/stores/favoritesStore';
import { useAdsStore } from '../src/stores/adsStore';
import { redirectToLogin } from '../src/hooks/useAuth';
import type { Ad, SearchFilters } from '../src/types';
import * as Haptics from 'expo-haptics';

const AD_CARD_HEIGHT = 280;

export default function SearchResultsScreen() {
  const { q, categoryId, sortBy: sortParam } = useLocalSearchParams<{
    q?: string;
    categoryId?: string;
    sortBy?: string;
  }>();

  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { favoriteAdIds, toggle: toggleFav } = useFavoritesStore();

  const { searchResults: results, isLoading: loading, search, clearSearch } = useAdsStore();
  const [query, setQuery] = useState(q || '');

  useEffect(() => {
    if (q || categoryId) {
      const filters: SearchFilters = {
        categoryId: categoryId as SearchFilters['categoryId'],
        sortBy: (sortParam as SearchFilters['sortBy']) || 'NEWEST',
      };
      search(q || '', filters);
    }
    return () => {
      clearSearch();
    };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    const filters: SearchFilters = {
      sortBy: (sortParam as SearchFilters['sortBy']) || 'NEWEST',
    };
    await search(query, filters);
  }, [query, sortParam, search]);

  const handleFavorite = async (adId: string) => {
    if (!isAuthenticated || !user) {
      void redirectToLogin(`/ad/${adId}`);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFav(user.id, adId);
  };

  const renderItem = ({ item }: { item: Ad }) => (
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
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.TEXT_DARK} />
        </Pressable>

        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="search-outline" size={20} color={COLORS.TEXT_MUTED} />
            <TextInput
              style={styles.input}
              placeholder="Search..."
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
      </View>

      {!loading && results.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.ACCENT} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No results found"
              subtitle="Try different keywords or filters"
            />
          }
          showsVerticalScrollIndicator={false}
          getItemLayout={(data, index) => ({
            length: AD_CARD_HEIGHT,
            offset: AD_CARD_HEIGHT * index,
            index,
          })}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.BG_CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
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
  countRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: 12,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
