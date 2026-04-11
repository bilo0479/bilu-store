import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import type { PremiumTierId } from '../types';
import { getTierById } from '../constants/premiumTiers';

interface PremiumBadgeProps {
  tier?: PremiumTierId | null;
}

/**
 * Gold "Featured" badge for premium ads.
 * Positioned absolute top-left for overlay on card images.
 * Returns null when tier is not provided.
 */
export function PremiumBadge({ tier }: PremiumBadgeProps) {
  if (!tier) {
    return null;
  }

  const tierDef = getTierById(tier);
  const label = tierDef?.name ?? 'Premium';

  return (
    <View style={styles.badge}>
      <Ionicons name="star" size={10} color={COLORS.TEXT_ON_ACCENT} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
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
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
    color: COLORS.TEXT_ON_ACCENT,
  },
});
