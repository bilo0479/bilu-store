import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../../src/constants/colors';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUiStore } from '../../../src/stores/uiStore';
import { submitReview, canReview } from '../../../src/services/ReviewService';
import { fetchUserProfile } from '../../../src/services/AuthService';
import { RatingStars } from '../../../src/components/RatingStars';
import { validateReviewRating, validateReviewComment } from '../../../src/utils/validators';
import { useRequireAuth } from '../../../src/hooks/useAuth';
import type { User } from '../../../src/types';

export default function CreateReviewScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth(
    sellerId ? `/review/create/${sellerId}` : '/review/create'
  );
  const showToast = useUiStore(s => s.showToast);

  const [seller, setSeller] = useState<User | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (!sellerId || !user) return;
    (async () => {
      try {
        const [profile, reviewCheck] = await Promise.all([
          fetchUserProfile(sellerId),
          canReview(sellerId, user.id),
        ]);
        setSeller(profile);
        setCanSubmit(reviewCheck.allowed);
        if (!reviewCheck.allowed) {
          showToast(reviewCheck.reason ?? 'You cannot review this seller');
        }
      } catch {
        showToast('Failed to load seller info');
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId, user?.id]);

  const handleSubmit = async () => {
    if (!user || !sellerId) return;

    const ratingResult = validateReviewRating(rating);
    if (!ratingResult.valid) { showToast(ratingResult.error ?? 'Invalid rating'); return; }
    const commentResult = validateReviewComment(comment);
    if (!commentResult.valid) { showToast(commentResult.error ?? 'Invalid comment'); return; }

    setSubmitting(true);
    try {
      await submitReview({
        sellerId,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerAvatar: user.avatar,
        rating,
        comment: comment.trim(),
      });
      showToast('Review submitted!');
      router.back();
    } catch {
      showToast('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !canAccess || loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  if (!canSubmit) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.TEXT_MUTED} />
          <Text style={styles.errorText}>Cannot review this seller</Text>
          <Text style={styles.errorSub}>You may have already reviewed them, or you need to chat first.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Write Review</Text>
        <View style={{ width: 40 }} />
      </View>

      {seller && (
        <View style={styles.sellerInfo}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>{seller.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.sellerName}>{seller.name}</Text>
        </View>
      )}

      <View style={styles.ratingSection}>
        <Text style={styles.label}>Your Rating</Text>
        <RatingStars rating={rating} size={36} interactive onChange={setRating} />
        <Text style={styles.ratingHint}>
          {rating === 0 ? 'Tap a star to rate' : `${rating} star${rating > 1 ? 's' : ''}`}
        </Text>
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.label}>Your Review</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience with this seller (min 10 characters)..."
          placeholderTextColor={COLORS.TEXT_MUTED}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || rating === 0}
        style={({ pressed }) => [
          styles.submitBtn,
          (rating === 0) && styles.submitBtnDisabled,
          pressed && { opacity: 0.85 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
        ) : (
          <Text style={styles.submitBtnText}>Submit Review</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { padding: 16, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  errorText: { fontSize: FONT_SIZE.LG, fontWeight: '600', color: COLORS.TEXT_DARK, marginTop: 8 },
  errorSub: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, textAlign: 'center', paddingHorizontal: 32 },
  sellerInfo: { alignItems: 'center', gap: 8 },
  sellerAvatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  sellerInitial: { fontSize: 26, fontWeight: '700', color: COLORS.ACCENT },
  sellerName: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  ratingSection: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  label: { fontSize: FONT_SIZE.MD, fontWeight: '600', color: COLORS.TEXT_DARK },
  ratingHint: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  commentSection: { gap: 8 },
  commentInput: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, padding: 14,
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, minHeight: 120,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  charCount: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED, textAlign: 'right' },
  submitBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
});
