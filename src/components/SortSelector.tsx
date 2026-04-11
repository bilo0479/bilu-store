import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
}

/**
 * Sort dropdown selector. Displays the current sort option with a swap-vertical
 * icon. Pressing it opens a dropdown list of sort choices.
 */
export function SortSelector({ value, onChange, options }: SortSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentLabel = options.find((o) => o.value === value)?.label ?? 'Sort';

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={styles.trigger}
      >
        <Ionicons name="swap-vertical" size={18} color={COLORS.TEXT_DARK} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {currentLabel}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={COLORS.TEXT_MUTED}
        />
      </Pressable>

      {open && (
        <View style={styles.dropdown}>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleSelect(opt.value)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={16} color={COLORS.ACCENT} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BG_CARD,
  },
  triggerText: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    minWidth: 180,
    backgroundColor: COLORS.BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionSelected: {
    backgroundColor: COLORS.ACCENT_LIGHT,
  },
  optionText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_DARK,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
});
