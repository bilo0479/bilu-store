import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE } from '../constants/colors';
import type { AdCondition } from '../types';
import { getConditionLabel } from '../constants/conditions';

interface ConditionBadgeProps {
  condition: AdCondition | null;
}

/**
 * Small rounded pill badge displaying the item condition label.
 * Returns null when condition is not set.
 */
export function ConditionBadge({ condition }: ConditionBadgeProps) {
  if (condition === null) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{getConditionLabel(condition)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.BG_SCREEN,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
});
