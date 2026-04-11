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
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { Toast } from "../src/components/Toast";
import { useAuthStore } from "../src/stores/authStore";
import { useUiStore } from "../src/stores/uiStore";
import { onAuthChange, fetchUserProfile, logoutUser, consumeRedirectIntent } from "../src/services/AuthService";
import { COLORS, FONT_SIZE } from "../src/constants/colors";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";

SplashScreen.preventAutoHideAsync();

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
});

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

          setUser(profile);

          // Redirect after login - check if there's a saved redirect intent
          if (profile) {
            const redirectRoute = await consumeRedirectIntent();
            if (redirectRoute) {
              // Small delay to ensure navigation is ready
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
            <KeyboardProvider>
              <AuthSessionProvider>
                <StatusBar style="dark" />
                <OfflineBanner />
                <RootLayoutNav />
                <Toast />
              </AuthSessionProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
