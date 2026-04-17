import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { RatingStars } from '../../src/components/RatingStars';
import { EmptyState } from '../../src/components/EmptyState';
import { fetchReviews } from '../../src/services/ReviewService';
import { useRequireAuth } from '../../src/hooks/useAuth';
import type { Review } from '../../src/types';

function ReviewItem({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        {review.reviewerAvatar ? (
          <Image source={{ uri: review.reviewerAvatar }} style={styles.reviewerAvatar} />
        ) : (
          <View style={styles.reviewerAvatarFallback}>
            <Ionicons name="person" size={16} color={COLORS.TEXT_MUTED} />
          </View>
        )}
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.reviewerName}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <RatingStars rating={review.rating} size={14} />
      </View>
      {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
    </View>
  );
}

const REVIEW_ITEM_HEIGHT = 140;

export default function ReviewsScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const insets = useSafeAreaInsets();
  const { canAccess, isLoading: authLoading } = useRequireAuth(sellerId ? `/reviews/${sellerId}` : '/reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    (async () => {
      try {
        const data = await fetchReviews(sellerId);
        setReviews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  if (authLoading || !canAccess || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.ACCENT} /></View>;
  }

  return (
    <FlashList
      data={reviews}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ReviewItem review={item} />}
      ListEmptyComponent={
        <EmptyState icon="star-outline" title="No reviews yet" subtitle="Reviews will appear here" />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN },
  list: { backgroundColor: COLORS.BG_SCREEN },
  reviewItem: { padding: 16, backgroundColor: COLORS.BG_CARD, gap: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewerAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.DIVIDER, alignItems: 'center', justifyContent: 'center' },
  reviewerInfo: { flex: 1, gap: 2 },
  reviewerName: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_DARK },
  reviewDate: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED },
  reviewComment: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, lineHeight: 22 },
  separator: { height: 1, backgroundColor: COLORS.DIVIDER },
});
