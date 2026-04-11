import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { useUiStore, ToastType } from '../stores/uiStore';

const TOAST_ICONS: Record<ToastType, { name: string; color: string }> = {
  default: { name: 'information-circle', color: COLORS.TEXT_ON_ACCENT },
  success: { name: 'checkmark-circle', color: COLORS.TEXT_ON_ACCENT },
  error: { name: 'alert-circle', color: COLORS.TEXT_ON_ACCENT },
  warning: { name: 'warning', color: COLORS.TEXT_ON_ACCENT },
  info: { name: 'information-circle', color: COLORS.TEXT_ON_ACCENT },
};

const TOAST_BORDER_COLORS: Record<ToastType, string> = {
  default: 'transparent',
  success: COLORS.TOAST_SUCCESS,
  error: COLORS.TOAST_ERROR,
  warning: COLORS.TOAST_WARNING,
  info: COLORS.TOAST_INFO,
};

export function Toast() {
  const toastData = useUiStore(s => s.toastData);
  const hideToast = useUiStore(s => s.hideToast);
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toastData) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }, 2700);

      return () => clearTimeout(timer);
    }
  }, [toastData]);

  if (!toastData) return null;

  const icon = TOAST_ICONS[toastData.type];
  const borderColor = TOAST_BORDER_COLORS[toastData.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          top: insets.top + 12,
          opacity,
          transform: [{ translateY }],
          borderLeftColor: borderColor,
          borderLeftWidth: toastData.type !== 'default' ? 4 : 0,
        },
      ]}
    >
      <View style={styles.content}>
        {toastData.type !== 'default' && (
          <Ionicons
            name={icon.name as keyof typeof Ionicons.glyphMap}
            size={20}
            color={icon.color}
          />
        )}
        <Text style={styles.text} numberOfLines={2}>{toastData.message}</Text>
      </View>
      {toastData.actionLabel && toastData.onAction && (
        <Pressable
          onPress={() => { toastData.onAction?.(); hideToast(); }}
          hitSlop={8}
        >
          <Text style={styles.actionText}>{toastData.actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: COLORS.TEXT_DARK,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  text: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_ON_ACCENT,
    fontWeight: '500',
    flex: 1,
  },
  actionText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.ACCENT_SOFT,
    fontWeight: '700',
    marginLeft: 12,
  },
});
