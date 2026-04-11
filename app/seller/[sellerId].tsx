import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { RatingStars } from '../../src/components/RatingStars';
import { AdCard } from '../../src/components/AdCard';
import { EmptyState } from '../../src/components/EmptyState';
import { fetchUserProfile } from '../../src/services/AuthService';
import { fetchUserAds } from '../../src/services/AdService';
import { useRequireAuth } from '../../src/hooks/useAuth';
import type { User, Ad } from '../../src/types';

export default function SellerProfileScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const insets = useSafeAreaInsets();
  const { canAccess, isLoading: authLoading } = useRequireAuth(sellerId ? `/seller/${sellerId}` : '/seller');

  const [seller, setSeller] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    (async () => {
      try {
        const [profile, userAds] = await Promise.all([
          fetchUserProfile(sellerId),
          fetchUserAds(sellerId),
        ]);
        setSeller(profile);
        setAds(userAds.filter(a => a.status === 'ACTIVE'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  if (authLoading || !canAccess || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Seller not found</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.profileSection}>
      {seller.avatar ? (
        <Image source={{ uri: seller.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{seller.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.sellerName}>{seller.name}</Text>
      {!!seller.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={styles.locationText}>{seller.location}</Text>
        </View>
      )}
      <View style={styles.ratingRow}>
        <RatingStars rating={seller.averageRating} size={18} />
        <Text style={styles.ratingText}>
          {seller.averageRating.toFixed(1)} ({seller.totalReviews})
        </Text>
      </View>
      <Pressable
        onPress={() => router.push(`/reviews/${seller.id}` as never)}
        style={styles.reviewsLink}
      >
        <Text style={styles.reviewsLinkText}>View Reviews</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.ACCENT} />
      </Pressable>
      <Pressable
        onPress={() => router.push(`/review/create/${seller.id}` as never)}
        style={styles.writeReviewBtn}
      >
        <Ionicons name="star-outline" size={18} color={COLORS.TEXT_ON_ACCENT} />
        <Text style={styles.writeReviewBtnText}>Write a Review</Text>
      </Pressable>

      <Text style={styles.listingsTitle}>Listings ({ads.length})</Text>
    </View>
  );

  return (
    <FlatList
      data={ads}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <EmptyState icon="storefront-outline" title="No active listings" />
      }
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <AdCard
            ad={item}
            onPress={() => router.push(`/ad/${item.id}` as never)}
          />
        </View>
      )}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN },
  errorText: { fontSize: FONT_SIZE.LG, color: COLORS.TEXT_MUTED },
  profileSection: { alignItems: 'center', padding: 24, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.ACCENT_LIGHT, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: COLORS.ACCENT },
  sellerName: { fontSize: FONT_SIZE.XL, fontWeight: '700', color: COLORS.TEXT_DARK },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  reviewsLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reviewsLinkText: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.ACCENT },
  listingsTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK, alignSelf: 'flex-start', marginTop: 16 },
  list: { backgroundColor: COLORS.BG_SCREEN },
  row: { paddingHorizontal: 16, gap: 12 },
  writeReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.ACCENT, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  writeReviewBtnText: { fontSize: FONT_SIZE.SM, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
});
