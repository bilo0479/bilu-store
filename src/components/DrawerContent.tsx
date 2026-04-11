import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions,
  ScrollView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { RatingStars } from './RatingStars';
import { useAuthStore } from '../stores/authStore';
import { logoutUser } from '../services/AuthService';

const SCREEN_W = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_W * 0.82;

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * DrawerContent — slide-out overlay menu (PRP §3.3).
 * Renders brand header, user info, navigation links, and logout.
 * Animated from the left edge using React Native's Animated API.
 */
export function DrawerContent({ visible, onClose }: DrawerProps) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -DRAWER_WIDTH,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    onClose();
    try {
      await logoutUser();
      logout();
    } catch {
      // Silent — logout errors are non-critical
    }
  };

  const navigate = (path: string, params?: Record<string, string>) => {
    onClose();
    if (params) {
      router.push({ pathname: path as `/${string}`, params });
    } else {
      router.push(path as `/${string}`);
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Semi-transparent backdrop */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX }], paddingTop: insets.top },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Brand header */}
          <View style={styles.brandSection}>
            <View style={styles.brandRow}>
              <Ionicons name="storefront" size={28} color={COLORS.ACCENT} />
              <Text style={styles.brandName}>Bilu Store</Text>
            </View>
            <Text style={styles.tagline}>Buy & sell locally</Text>
          </View>

          {/* User section — authenticated vs guest */}
          {isAuthenticated && user ? (
            <View style={styles.userSection}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.ratingRow}>
                <RatingStars rating={user.averageRating} size={14} />
                <Text style={styles.ratingText}>
                  {user.averageRating.toFixed(1)} · {user.totalReviews} reviews
                </Text>
              </View>
              {!!user.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={COLORS.TEXT_MUTED} />
                  <Text style={styles.locationText}>{user.location}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.guestSection}>
              <Pressable
                onPress={() => navigate('/auth/login')}
                style={styles.loginBtn}
              >
                <Text style={styles.loginBtnText}>Log In / Register</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.divider} />

          {/* Menu items — only for authenticated users */}
          {isAuthenticated && user && (
            <>
              <DrawerItem
                icon="list-outline"
                label={`My Ads (${user.totalAds})`}
                onPress={() => navigate('/my-ads')}
              />
              <DrawerItem
                icon="heart-outline"
                label="Favorites"
                onPress={() => navigate('/favorites')}
              />
              <DrawerItem
                icon="star-outline"
                label="Premium Services"
                onPress={() => navigate('/premium/[adId]', { adId: 'landing' })}
              />
              <View style={styles.divider} />
            </>
          )}

          <DrawerItem
            icon="settings-outline"
            label="Settings"
            onPress={() => navigate('/settings')}
          />
          <DrawerItem
            icon="information-circle-outline"
            label="About App"
            onPress={() => navigate('/about-app')}
          />
          <DrawerItem
            icon="person-circle-outline"
            label="About Developer"
            onPress={() => navigate('/about-developer')}
          />

          <View style={styles.divider} />

          {isAuthenticated && (
            <DrawerItem
              icon="log-out-outline"
              label="Log Out"
              onPress={handleLogout}
              danger
            />
          )}

          <Text style={styles.version}>App Version v1.0.0</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** Individual menu row inside the drawer. */
function DrawerItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.BG_CARD,
    zIndex: 101,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  brandSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  tagline: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  userSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 8 },
  avatarFallback: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarInitial: { fontSize: 24, fontWeight: '700', color: COLORS.ACCENT },
  userName: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  ratingText: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED },
  guestSection: { paddingHorizontal: 20, paddingVertical: 16 },
  loginBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
  },
  loginBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  divider: { height: 1, backgroundColor: COLORS.DIVIDER, marginVertical: 8, marginHorizontal: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  menuItemPressed: { backgroundColor: COLORS.DIVIDER },
  menuLabel: { fontSize: FONT_SIZE.MD, fontWeight: '500', color: COLORS.TEXT_DARK },
  version: {
    fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED,
    textAlign: 'center', marginTop: 24,
  },
});
