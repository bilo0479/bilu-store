import "../global.css";

import * as Sentry from "@sentry/react-native";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: !__DEV__,
  beforeSend(event) {
    // Strip PII from events — full scrub in P11; this is the hook point
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

if (__DEV__) {
  // Verify Sentry init works during development
  Sentry.captureMessage("Sentry init verified", "debug");
}

import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { Toast } from "../src/components/Toast";
import { useAuthStore } from "../src/stores/authStore";
import { useUiStore } from "../src/stores/uiStore";
import { fetchUserProfile, consumeRedirectIntent } from "../src/services/AuthService";
import { COLORS, FONT_SIZE } from "../src/constants/colors";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";

SplashScreen.preventAutoHideAsync();

// SecureStore token cache for Clerk — tokens are stored in the device keychain,
// never in AsyncStorage (which is unencrypted).
const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

// Native-only: react-native-keyboard-controller has no web support
// Lazily require so the web bundle never touches the native module
let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    KeyboardProvider = (require('react-native-keyboard-controller') as typeof import('react-native-keyboard-controller')).KeyboardProvider;
  } catch {
    // Module unavailable in current environment
  }
}

const queryClient = new QueryClient();

/**
 * ClerkAuthSync — replaces the old Firebase-based AuthSessionProvider.
 *
 * Listens to Clerk's auth state via `useAuth()` and keeps the Zustand
 * authStore in sync. Also handles banned-user detection and post-login
 * redirect intent consumption.
 */
function ClerkAuthSync({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId, isLoaded, signOut } = useAuth();
  const setUser = useAuthStore(s => s.setUser);
  const setLoading = useAuthStore(s => s.setLoading);
  const showToast = useUiStore(s => s.showToast);

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (isSignedIn && userId) {
      setLoading(true);
      fetchUserProfile(userId)
        .then(async (profile) => {
          // Banned user detection
          if (profile?.banned) {
            await signOut();
            setUser(null);
            showToast('Your account has been suspended. Contact support.');
            return;
          }

          // profile may be null for brand-new users whose Firestore doc hasn't
          // been written yet (race with upsertClerkUser in the auth screen).
          // Don't call setUser(null) — the login handler's setUser(user) call
          // already set the correct state.
          if (profile) {
            setUser(profile);
            const redirectRoute = await consumeRedirectIntent();
            if (redirectRoute) {
              setTimeout(() => {
                router.push(redirectRoute as never);
              }, 100);
            }
          }
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isSignedIn, userId, isLoaded]);

  return <>{children}</>;
}

/** §12.8 — Subtle offline badge shown when device has no connectivity. */
function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return null;
  return (
    <View style={offlineStyles.banner}>
      <Text style={offlineStyles.text}>Offline — limited functionality</Text>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.WARNING_AMBER,
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
    color: COLORS.TEXT_ON_ACCENT,
  },
});

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: COLORS.BG_SCREEN },
      }}
    >
      {/* Root entry: immediately redirects to /(tabs)/home — no header needed */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="ad/[adId]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
      <Stack.Screen name="seller/[sellerId]" options={{ title: 'Seller Profile' }} />
      <Stack.Screen name="post/create" options={{ title: 'Post Ad', headerShown: false }} />
      <Stack.Screen name="my-ads" options={{ title: 'My Ads' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="category/[categoryId]" options={{ headerShown: false }} />
      <Stack.Screen name="reviews/[sellerId]" options={{ title: 'Reviews' }} />
      <Stack.Screen name="auth/phone-verify" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="premium/[adId]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="post/edit/[adId]" options={{ headerShown: false }} />
      <Stack.Screen name="about-app" options={{ headerShown: false }} />
      <Stack.Screen name="about-developer" options={{ headerShown: false }} />
      <Stack.Screen name="search-results" options={{ headerShown: false }} />
      <Stack.Screen name="review/create/[sellerId]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              {KeyboardProvider ? (
                <KeyboardProvider>
                  <ClerkAuthSync>
                    <StatusBar style="dark" />
                    <OfflineBanner />
                    <RootLayoutNav />
                    <Toast />
                  </ClerkAuthSync>
                </KeyboardProvider>
              ) : (
                <ClerkAuthSync>
                  <StatusBar style="dark" />
                  <OfflineBanner />
                  <RootLayoutNav />
                  <Toast />
                </ClerkAuthSync>
              )}
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
