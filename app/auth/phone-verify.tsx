import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSignIn, useUser } from '@clerk/clerk-expo';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { upsertClerkUser } from '../../src/services/AuthService';
import { useAuthStore } from '../../src/stores/authStore';
import { useUiStore } from '../../src/stores/uiStore';

const OTP_LENGTH = 6;

type Step = 'phone' | 'otp';

export default function PhoneVerifyScreen() {
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore(s => s.setUser);
  const showToast = useUiStore(s => s.showToast);

  const { signIn, setActive, isLoaded } = useSignIn();
  const { user: clerkUser } = useUser();

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);

  // phoneNumberId is returned by Clerk when OTP is requested
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState('');
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────

  const handleSendCode = async () => {
    const phone = phoneNumber.trim();
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    // Expect E.164 format (+251...)
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError('Enter number in international format: +251912345678');
      return;
    }
    if (!isLoaded) return;

    setSending(true);
    setError('');
    try {
      // Create a sign-in attempt with the phone number as identifier
      await signIn.create({ identifier: phone });

      // Find the phone_code first factor
      const phoneFactor = signIn.supportedFirstFactors?.find(
        (f) => f.strategy === 'phone_code'
      );

      if (!phoneFactor || !('phoneNumberId' in phoneFactor)) {
        setError('Phone sign-in is not available. Please use email or Google.');
        return;
      }

      const pid = (phoneFactor as { phoneNumberId: string }).phoneNumberId;
      setPhoneNumberId(pid);

      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
        phoneNumberId: pid,
      });

      setStep('otp');
      showToast('Code sent to ' + phone);
    } catch {
      // Generic message — never reveal whether a phone number is registered
      setError('Failed to send verification code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code');
      return;
    }
    if (!isLoaded) return;

    setVerifying(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        const userId = result.createdUserId ?? clerkUser?.id;
        if (userId) {
          const user = await upsertClerkUser(userId, {
            phone: phoneNumber.trim(),
          });
          setUser(user);
        }
        showToast('Phone verified!');
        router.replace('/(tabs)');
      } else {
        setError('Verification could not be completed. Please try again.');
      }
    } catch (e: unknown) {
      // Do not log OTP codes or internal error details
      setError('Invalid code. Please check and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setPhoneNumberId('');
    setError('');
    setStep('phone');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => (step === 'otp' ? handleResend() : router.back())}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
      </Pressable>

      <View style={styles.content}>
        {step === 'phone' ? (
          <>
            <Text style={styles.title}>Sign in with phone</Text>
            <Text style={styles.subtitle}>
              We'll send a verification code to your number
            </Text>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={20} color={COLORS.TEXT_MUTED} />
              <TextInput
                style={styles.input}
                placeholder="+251912345678"
                placeholderTextColor={COLORS.TEXT_MUTED}
                value={phoneNumber}
                onChangeText={(t) => { setPhoneNumber(t); setError(''); }}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>

            <Pressable
              onPress={handleSendCode}
              disabled={sending}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
              ) : (
                <Text style={styles.btnText}>Send Code</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              Sent to {phoneNumber}
            </Text>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { otpRefs.current[i] = ref; }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, i)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={verifying}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            >
              {verifying ? (
                <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
              ) : (
                <Text style={styles.btnText}>Verify</Text>
              )}
            </Pressable>

            <Pressable onPress={handleResend} style={styles.resendBtn}>
              <Text style={styles.resendText}>Didn't receive a code? Change number</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 24, alignItems: 'center', gap: 16 },
  title: { fontSize: FONT_SIZE.XL, fontWeight: '700', color: COLORS.TEXT_DARK, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_MUTED, textAlign: 'center' },
  errorText: {
    fontSize: FONT_SIZE.SM, color: COLORS.ERROR_RED,
    textAlign: 'center', fontWeight: '500',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.BG_CARD, borderRadius: 12,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: COLORS.BORDER,
    width: '100%',
  },
  input: { flex: 1, fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK },
  btn: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    backgroundColor: COLORS.ACCENT, alignItems: 'center', marginTop: 8,
  },
  btnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  otpRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  otpInput: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BG_CARD, textAlign: 'center',
    fontSize: 22, fontWeight: '700', color: COLORS.TEXT_DARK,
  },
  otpInputFilled: { borderColor: COLORS.ACCENT },
  resendBtn: { marginTop: 8, paddingVertical: 8 },
  resendText: { fontSize: FONT_SIZE.SM, color: COLORS.ACCENT, fontWeight: '600' },
});
