import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { redirectToLogin } from '../../src/hooks/useAuth';

export default function PostTab() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        router.replace('/post/create' as never);
      } else {
        void redirectToLogin('/post/create', 'replace');
      }
    }, [isAuthenticated])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="add-circle-outline" size={64} color={COLORS.ACCENT} />
        </View>
        <Text style={styles.title}>Post an Ad</Text>
        <Text style={styles.subtitle}>Redirecting...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SCREEN,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconWrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  subtitle: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
  },
});
