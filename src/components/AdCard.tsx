import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { relativeTime } from '../utils/dateHelpers';
import type { Ad } from '../types';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface AdCardProps {
  ad: Ad;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export function AdCard({ ad, onPress, onFavorite, isFavorited }: AdCardProps) {
  const favScale = useRef(new Animated.Value(1)).current;

  const handleFavoritePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(favScale, { toValue: 1.35, useNativeDriver: true, friction: 3, tension: 200 }),
      Animated.spring(favScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    onFavorite?.();
  }, [onFavorite, favScale]);
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'ETB') return `${price.toLocaleString()} ETB`;
    return `$${price.toLocaleString()}`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        {ad.images.length > 0 ? (
          <Image
            source={{ uri: ad.images[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={32} color={COLORS.TEXT_MUTED} />
          </View>
        )}
        {!!onFavorite && (
          <Pressable
            onPress={handleFavoritePress}
            style={styles.favoriteBtn}
            hitSlop={8}
            accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ scale: favScale }] }}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorited ? COLORS.ERROR_RED : COLORS.TEXT_MUTED}
              />
            </Animated.View>
          </Pressable>
        )}
        {ad.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={10} color={COLORS.TEXT_ON_ACCENT} />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.price} numberOfLines={1}>
          {formatPrice(ad.price, ad.currency)}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.TEXT_MUTED} />
          <Text style={styles.location} numberOfLines={1}>
            {ad.location}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.TEXT_MUTED} />
          <Text style={styles.location} numberOfLines={1}>
            {relativeTime(ad.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.BG_CARD,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    backgroundColor: COLORS.BG_SCREEN,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.DIVIDER,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.PREMIUM_GOLD,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
    color: COLORS.TEXT_ON_ACCENT,
  },
  info: {
    padding: 10,
    gap: 3,
  },
  price: {
    fontSize: FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRICE_TEXT,
  },
  title: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  location: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    flex: 1,
  },
});
