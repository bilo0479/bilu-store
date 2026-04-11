import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONT_SIZE } from '../constants/colors';

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

/**
 * Pill-shaped filter chip for category selection.
 * Highlights with ACCENT background when selected.
 */
export function CategoryChip({ label, selected, onPress, color }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? [styles.chipSelected, color ? { backgroundColor: color } : undefined]
          : styles.chipUnselected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={selected ? styles.textSelected : styles.textUnselected}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: COLORS.ACCENT,
  },
  chipUnselected: {
    backgroundColor: COLORS.BG_CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  pressed: {
    opacity: 0.85,
  },
  textSelected: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.TEXT_ON_ACCENT,
  },
  textUnselected: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
});
