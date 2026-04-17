import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSignIn, useOAuth, useUser } from '@clerk/clerk-expo';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { upsertClerkUser } from '../../src/services/AuthService';
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

  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { user: clerkUser } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // upsertClerkUser writes/updates the Firestore profile doc
        const userId = result.createdUserId ?? clerkUser?.id;
        if (userId) {
          const user = await upsertClerkUser(userId, {
            email: email.trim(),
          });
          setUser(user);
        }
        showToast('Welcome back!');
        goAfterAuth();
      } else {
        // Clerk may require additional verification steps in some configurations
        setError('Sign-in could not be completed. Please try again.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      // Generic message — never confirm whether an email is registered
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
        setError('Invalid email or password');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive: setOAuthActive, createdUserId, signUp } = await startOAuthFlow();

      if (createdSessionId) {
        await setOAuthActive!({ session: createdSessionId });
        const userId = createdUserId ?? clerkUser?.id;
        if (userId) {
          const user = await upsertClerkUser(userId, {
            name: signUp?.firstName ?? clerkUser?.fullName ?? 'User',
            email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
            avatar: clerkUser?.imageUrl ?? null,
          });
          setUser(user);
        }
        showToast('Welcome!');
        goAfterAuth();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed';
      // Don't show error for user-cancelled flows
      if (!msg.toLowerCase().includes('cancel')) {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
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
});
