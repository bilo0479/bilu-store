import React from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useChatStore } from '../../src/stores/chatStore';
import { useAuthStore } from '../../src/stores/authStore';
import { redirectToLogin } from '../../src/hooks/useAuth';

export default function TabLayout() {
  const totalUnread = useChatStore(s => s.totalUnread);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  // On Android, insets.bottom reflects the system nav bar height (gesture nav ~28dp,
  // 3-button nav ~48dp). We add it to both height and paddingBottom so tab items
  // never render behind the system navigation bar.
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === 'android' ? insets.bottom : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.ACCENT,
        tabBarInactiveTintColor: COLORS.TEXT_MUTED,
        tabBarStyle: {
          backgroundColor: COLORS.BG_CARD,
          borderTopColor: COLORS.BORDER,
          borderTopWidth: 0.5,
          // iOS: 88 already includes the home-indicator safe area.
          // Android: 64 is the icon+label area; add the system nav bar height on top.
          height: Platform.OS === 'ios' ? 88 : 64 + androidBottomInset,
          paddingTop: 6,
          paddingBottom: androidBottomInset,
          elevation: 8,
          shadowColor: COLORS.SHADOW,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.XS,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
              accessibilityLabel="Home tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
              accessibilityLabel="Search tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: () => (
            <View style={styles.postBtn} accessibilityLabel="Post an ad" accessibilityRole="button">
              <Ionicons name="add" size={28} color={COLORS.TEXT_ON_ACCENT} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            if (isAuthenticated) {
              router.push('/post/create' as never);
            } else {
              void redirectToLogin('/post/create');
            }
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={24}
              color={color}
              accessibilityLabel={totalUnread > 0 ? `Chats, ${totalUnread} unread` : 'Chats tab'}
            />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.ACCENT,
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
              accessibilityLabel="Profile tab"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  postBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
