import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { RatingStars } from '../../src/components/RatingStars';
import { useAuthStore } from '../../src/stores/authStore';
import { logoutUser } from '../../src/services/AuthService';
import { redirectToLogin } from '../../src/hooks/useAuth';
import * as Haptics from 'expo-haptics';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, badge, danger }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={22}
        color={danger ? COLORS.ERROR_RED : COLORS.TEXT_DARK}
      />
      <Text style={[styles.menuLabel, danger && { color: COLORS.ERROR_RED }]}>{label}</Text>
      <View style={styles.menuRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={COLORS.TEXT_MUTED} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await logoutUser();
      logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="person-outline" size={48} color={COLORS.TEXT_MUTED} />
          </View>
          <Text style={styles.guestTitle}>Join Bilu Store</Text>
          <Text style={styles.guestSubtitle}>
            Buy and sell locally with your community
          </Text>
          <Pressable
            onPress={() => void redirectToLogin('/(tabs)/profile')}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => void redirectToLogin('/(tabs)/profile')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}
    >
      <View style={styles.profileCard}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.userName}>{user.name}</Text>
        {!!user.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.TEXT_MUTED} />
            <Text style={styles.locationText}>{user.location}</Text>
          </View>
        )}
        <View style={styles.ratingRow}>
          <RatingStars rating={user.averageRating} size={16} />
          <Text style={styles.ratingText}>
            {user.averageRating.toFixed(1)} ({user.totalReviews} reviews)
          </Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.totalAds}</Text>
            <Text style={styles.statLabel}>Ads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {new Date(user.createdAt).getFullYear()}
            </Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="create-outline" label="Edit Profile" onPress={() => router.push('/profile/edit' as never)} />
        <MenuItem icon="list-outline" label="My Ads" onPress={() => router.push('/my-ads' as never)} />
        <MenuItem icon="heart-outline" label="Favorites" onPress={() => router.push('/favorites' as never)} />
        <MenuItem icon="star-outline" label="My Reviews" onPress={() => router.push(`/reviews/${user.id}` as never)} />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="settings-outline" label="Settings" onPress={() => router.push('/settings' as never)} />
        <MenuItem icon="information-circle-outline" label="About App" onPress={() => router.push('/about-app' as never)} />
        <MenuItem icon="person-circle-outline" label="About Developer" onPress={() => router.push('/about-developer' as never)} />
        <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SCREEN,
  },
  scrollContent: {
    gap: 16,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  guestIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.DIVIDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  guestSubtitle: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.ACCENT,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.TEXT_ON_ACCENT,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.ACCENT,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.ACCENT,
  },
  profileCard: {
    backgroundColor: COLORS.BG_CARD,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ACCENT,
  },
  userName: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 24,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  statLabel: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.BORDER,
  },
  menuSection: {
    backgroundColor: COLORS.BG_CARD,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.DIVIDER,
  },
  menuItemPressed: {
    backgroundColor: COLORS.DIVIDER,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZE.MD,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_ON_ACCENT,
  },
});
