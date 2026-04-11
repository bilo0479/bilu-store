import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform, NativeModules,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { loginUser, loginWithGoogle, loginWithGoogleWeb, loginWithFacebook, loginWithFacebookWeb } from '../../src/services/AuthService';
import { useAuthStore } from '../../src/stores/authStore';
import { useUiStore } from '../../src/stores/uiStore';

function goAfterAuth() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/home');
  }
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore(s => s.setUser);
  const showToast = useUiStore(s => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginUser(email.trim(), password);
      setUser(user);
      showToast('Welcome back!');
      goAfterAuth();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      let user;
      if (Platform.OS === 'web') {
        // Web: Firebase popup — no native SDK needed
        user = await loginWithGoogleWeb();
      } else {
        // Guard: RNGoogleSignin must be registered in the native binary.
        // It is present only in custom / EAS builds, NOT in Expo Go.
        // Adding "@react-native-google-signin/google-signin" to app.json plugins
        // and running `eas build` (or `expo run:android`) makes it available.
        if (!NativeModules.RNGoogleSignin) {
          setError(
            'Google Sign-In requires a native build.\n' +
            'Run: eas build --profile development, then reload the app.'
          );
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult.data?.idToken;
        if (!idToken) throw new Error(
          'Google sign-in did not return an ID token. ' +
          'Ensure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set and offlineAccess is enabled in GoogleSignin.configure().'
        );
        user = await loginWithGoogle(idToken);
      }
      setUser(user);
      showToast('Welcome!');
      goAfterAuth();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed';
      if (!msg.includes('SIGN_IN_CANCELLED')) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setFbLoading(true);
    setError('');
    try {
      let user;
      if (Platform.OS === 'web') {
        // Web: Firebase popup — no native SDK needed
        user = await loginWithFacebookWeb();
      } else {
        // Native: FBSDK (requires native build)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LoginManager, AccessToken } = require('react-native-fbsdk-next') as typeof import('react-native-fbsdk-next');
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        if (result.isCancelled) return;
        const tokenData = await AccessToken.getCurrentAccessToken();
        if (!tokenData?.accessToken) throw new Error('Facebook did not return an access token');
        user = await loginWithFacebook(tokenData.accessToken);
      }
      setUser(user);
      showToast('Welcome!');
      goAfterAuth();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Facebook login failed';
      setError(msg);
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={28} color={COLORS.TEXT_DARK} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.logo}>Bilu Store</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.ERROR_RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={COLORS.TEXT_MUTED} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.TEXT_MUTED}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.TEXT_MUTED} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={COLORS.TEXT_MUTED}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.TEXT_MUTED}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }, loading && styles.disabledBtn]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialBtnsContainer}>
          <Pressable
            onPress={() => router.push('/auth/phone-verify')}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="call-outline" size={20} color={COLORS.ACCENT} />
            <Text style={styles.socialBtnText}>Sign in with Phone Number</Text>
          </Pressable>

          <Pressable
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.85 }]}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={COLORS.ACCENT} />
            ) : (
              <Ionicons name="logo-google" size={20} color={COLORS.ACCENT} />
            )}
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={handleFacebookLogin}
            disabled={fbLoading}
            style={({ pressed }) => [styles.socialBtn, styles.fbBtn, pressed && { opacity: 0.85 }]}
          >
            {fbLoading ? (
              <ActivityIndicator size="small" color={COLORS.TEXT_ON_ACCENT} />
            ) : (
              <Ionicons name="logo-facebook" size={20} color={COLORS.TEXT_ON_ACCENT} />
            )}
            <Text style={[styles.socialBtnText, styles.fbBtnText]}>Continue with Facebook</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <Pressable onPress={() => router.replace('/auth/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_CARD,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    gap: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.ACCENT,
  },
  subtitle: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.ERROR_RED + '10',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.ERROR_RED,
    flex: 1,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.BG_SCREEN,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_DARK,
  },
  loginBtn: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.TEXT_ON_ACCENT,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
  },
  footerLink: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.BORDER,
  },
  dividerText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
  },
  socialBtnsContainer: {
    gap: 12,
    marginTop: 4,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
  },
  socialBtnText: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
  fbBtn: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  fbBtnText: {
    color: COLORS.TEXT_ON_ACCENT,
  },
});
