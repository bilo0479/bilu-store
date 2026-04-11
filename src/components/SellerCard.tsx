import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { RatingStars } from './RatingStars';

interface SellerCardProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar: string | null;
  rating: number;
  totalReviews: number;
  onPress: () => void;
}

/**
 * Seller information card for the ad detail screen.
 * Shows avatar, name, star rating with review count, and a navigation chevron.
 */
export function SellerCard({
  sellerName,
  sellerAvatar,
  rating,
  totalReviews,
  onPress,
}: SellerCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {sellerAvatar ? (
        <Image source={{ uri: sellerAvatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={24} color={COLORS.TEXT_MUTED} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{sellerName}</Text>
        <View style={styles.ratingRow}>
          <RatingStars rating={rating} size={14} />
          <Text style={styles.reviewCount}>({totalReviews})</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BG_CARD,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.BG_SCREEN,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.BG_SCREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCount: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
  },
});
