import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface NotificationBadgeProps {
  count: number;
  size?: number;
}

/**
 * Red circle badge showing unread count.
 * Returns null when count is zero. Positioned absolute at top-right of parent.
 */
export function NotificationBadge({ count, size = 20 }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  const fontSize = size * 0.55;

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          /* Wider badge for multi-digit numbers */
          minWidth: size,
          paddingHorizontal: count > 9 ? 4 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.ERROR_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.TEXT_ON_ACCENT,
    fontWeight: '700',
    textAlign: 'center',
  },
});
