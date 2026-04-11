import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE } from '../constants/colors';
import type { Currency } from '../types';
import { formatPrice } from '../utils/priceFormatter';

interface PriceDisplayProps {
  price: number;
  currency: Currency;
  size?: 'sm' | 'md' | 'lg';
  negotiable?: boolean;
}

/** Font size mapping for each display size variant. */
const SIZE_MAP = {
  sm: FONT_SIZE.SM,
  md: FONT_SIZE.LG,
  lg: FONT_SIZE.PRICE,
} as const;

/**
 * Formatted price display with optional "Negotiable" tag.
 * Uses the shared formatPrice utility for consistent currency formatting.
 */
export function PriceDisplay({ price, currency, size = 'md', negotiable }: PriceDisplayProps) {
  const fontSize = SIZE_MAP[size];

  return (
    <View style={styles.container}>
      <Text style={[styles.price, { fontSize }]}>
        {formatPrice(price, currency)}
      </Text>
      {negotiable && (
        <View style={styles.negotiableBadge}>
          <Text style={styles.negotiableText}>Negotiable</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontWeight: '700',
    color: COLORS.ACCENT,
  },
  negotiableBadge: {
    backgroundColor: COLORS.ACCENT_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  negotiableText: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
});
