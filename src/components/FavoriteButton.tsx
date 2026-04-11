import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { redirectToLogin } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { useFavoritesStore } from '../stores/favoritesStore';

interface FavoriteButtonProps {
  adId: string;
  size?: number;
  redirectTo?: string;
}

/**
 * Heart toggle button for favoriting/unfavoriting an ad.
 * Redirects unauthenticated users to the login screen.
 */
export function FavoriteButton({ adId, size = 24, redirectTo = `/ad/${adId}` }: FavoriteButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorited, toggle } = useFavoritesStore();

  const favorited = isFavorited(adId);

  const handlePress = useCallback(() => {
    if (!isAuthenticated || !user) {
      void redirectToLogin(redirectTo);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggle(user.id, adId);
  }, [adId, isAuthenticated, redirectTo, toggle, user]);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={styles.button}
      accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
      accessibilityRole="button"
    >
      <Ionicons
        name={favorited ? 'heart' : 'heart-outline'}
        size={size}
        color={favorited ? COLORS.ERROR_RED : COLORS.TEXT_MUTED}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
