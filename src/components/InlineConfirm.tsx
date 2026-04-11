import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONT_SIZE } from '../constants/colors';

interface InlineConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Inline yes/no confirmation row displayed without a modal.
 * Confirm action is styled in ERROR_RED to signal a destructive action.
 */
export function InlineConfirm({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
}: InlineConfirmProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_DARK,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  confirmText: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.ERROR_RED,
  },
  cancelText: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '500',
    color: COLORS.TEXT_MUTED,
  },
});
