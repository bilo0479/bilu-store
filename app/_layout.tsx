import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { Toast } from "../src/components/Toast";
import { useAuthStore } from "../src/stores/authStore";
import { useUiStore } from "../src/stores/uiStore";
import { onAuthChange, fetchUserProfile, logoutUser, consumeRedirectIntent } from "../src/services/AuthService";
import { COLORS, FONT_SIZE } from "../src/constants/colors";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";

SplashScreen.preventAutoHideAsync();

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

// Native-only: configure Google Sign-In SDK (Android / iOS builds only).
// NativeModules.RNGoogleSignin is only present in custom / EAS builds where
// the plugin has been compiled in. Skip silently in Expo Go or web.
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin') | undefined;
    if (mod?.GoogleSignin) {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
      if (!webClientId) {
        console.warn('[GoogleSignin] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. Google Sign-In will fail to return an idToken.');
      }
      mod.GoogleSignin.configure({
        webClientId,
        offlineAccess: true, // Required to receive idToken on Android
      });
    }
  } catch {
    // Native module not compiled into this build — sign-in button will show a clear error.
  }
}

const queryClient = new QueryClient();

function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore(s => s.setUser);
  const setLoading = useAuthStore(s => s.setLoading);
  const showToast = useUiStore(s => s.showToast);

  useEffect(() => {
    setLoading(true);
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);

          // Banned user detection
          if (profile && profile.banned) {
            await logoutUser();
            setUser(null);
            showToast('Your account has been suspended. Contact support.');
            return;
          }

          // profile may be null for brand-new social auth users whose Firestore
          // doc hasn't been written yet (race between signInWithCredential and
          // upsertSocialUser). Don't call setUser(null) — the login handler's
          // setUser(user) call already set the correct state.
          if (profile) {
            setUser(profile);
            const redirectRoute = await consumeRedirectIntent();
            if (redirectRoute) {
              setTimeout(() => {
                router.push(redirectRoute as never);
              }, 100);
            }
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

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
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            {KeyboardProvider ? (
              <KeyboardProvider>
                <AuthSessionProvider>
                  <StatusBar style="dark" />
                  <OfflineBanner />
                  <RootLayoutNav />
                  <Toast />
                </AuthSessionProvider>
              </KeyboardProvider>
            ) : (
              <AuthSessionProvider>
                <StatusBar style="dark" />
                <OfflineBanner />
                <RootLayoutNav />
                <Toast />
              </AuthSessionProvider>
            )}
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
