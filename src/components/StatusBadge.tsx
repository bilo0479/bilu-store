import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE } from '../constants/colors';
import type { AdStatus } from '../types';
import { AD_STATUS_LABELS } from '../constants/adStatuses';

interface StatusBadgeProps {
  status: AdStatus;
}

/** Color mapping for each ad status. */
const STATUS_COLORS: Record<AdStatus, string> = {
  ACTIVE: COLORS.SUCCESS_GREEN,
  PENDING_REVIEW: COLORS.WARNING_AMBER,
  SOLD: COLORS.INFO_BLUE,
  REJECTED: COLORS.ERROR_RED,
  DRAFT: COLORS.TEXT_MUTED,
  EXPIRED: COLORS.TEXT_MUTED,
  REMOVED: COLORS.ERROR_RED,
};

/**
 * Color-coded pill badge with a dot indicator showing the current ad status.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {AD_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.BG_SCREEN,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
  },
});
