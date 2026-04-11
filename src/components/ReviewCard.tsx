import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { relativeTime } from '../utils/dateHelpers';
import { RatingStars } from './RatingStars';
import type { Review } from '../types';

interface ReviewCardProps {
  review: Review;
}

/**
 * Displays a single review with reviewer avatar, name, star rating,
 * relative date, and comment text.
 */
export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {review.reviewerAvatar ? (
          <Image source={{ uri: review.reviewerAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={20} color={COLORS.TEXT_MUTED} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{review.reviewerName}</Text>
            <Text style={styles.date}>{relativeTime(review.createdAt)}</Text>
          </View>
          <RatingStars rating={review.rating} size={14} />
        </View>
      </View>
      {review.comment.length > 0 && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BG_CARD,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BG_SCREEN,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BG_SCREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
  },
  comment: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_DARK,
    lineHeight: 20,
  },
});
