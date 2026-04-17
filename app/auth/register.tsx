import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { upsertClerkUser } from '../../src/services/AuthService';
import { useAuthStore } from '../../src/stores/authStore';
import { useUiStore } from '../../src/stores/uiStore';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore(s => s.setUser);
  const showToast = useUiStore(s => s.showToast);

  const { signUp, setActive, isLoaded } = useSignUp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // When Clerk requires email verification before completing signup
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    setError('');
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: name.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        const userId = result.createdUserId;
        if (userId) {
          const user = await upsertClerkUser(userId, {
            name: name.trim(),
            email: email.trim(),
          });
          setUser(user);
        }
        showToast('Account created!');
        router.back();
      } else if (result.status === 'missing_requirements') {
        // Clerk dashboard has email verification enabled — prompt user to check email
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setAwaitingVerification(true);
        setError('');
        showToast('Check your email for a verification code.');
      } else {
        setError('Registration could not be completed. Please try again.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('taken')) {
        setError('This email is already registered');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (awaitingVerification) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="mail-outline" size={64} color={COLORS.ACCENT} />
        <Text style={[styles.label, { fontSize: FONT_SIZE.LG, marginTop: 24, textAlign: 'center' }]}>
          Check your email
        </Text>
        <Text style={[styles.label, { fontWeight: '400', color: COLORS.TEXT_MUTED, marginTop: 12, textAlign: 'center' }]}>
          We sent a verification link to {email}. Click it to complete your registration.
        </Text>
        <Pressable
          onPress={() => { setAwaitingVerification(false); setError(''); }}
          style={[styles.registerBtn, { marginTop: 32, width: '100%' }]}
        >
          <Text style={styles.registerBtnText}>Back to Sign Up</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={28} color={COLORS.TEXT_DARK} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.logo}>Bilu Store</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.ERROR_RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={COLORS.TEXT_MUTED} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={COLORS.TEXT_MUTED}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

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
                placeholder="Min. 8 characters"
                placeholderTextColor={COLORS.TEXT_MUTED}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.TEXT_MUTED} />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={COLORS.TEXT_MUTED}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.85 }, loading && styles.disabledBtn]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => { router.back(); router.push('/auth/login'); }}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_CARD,
  },
  content: {
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
    marginTop: 16,
    marginBottom: 28,
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
    gap: 18,
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
  registerBtn: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  registerBtnText: {
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
});
