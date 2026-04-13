import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../src/constants/colors';
import { useAuthStore } from '../src/stores/authStore';
import { useUiStore } from '../src/stores/uiStore';
import { savePayoutAccount } from '../src/services/EscrowService';
import type { PayoutAccount, PayoutAccountType } from '../src/types';

const ACCOUNT_TYPES: { id: PayoutAccountType; label: string; icon: string; placeholder: string }[] = [
  { id: 'telebirr', label: 'Telebirr', icon: 'phone-portrait-outline', placeholder: '09XXXXXXXX' },
  { id: 'cbe', label: 'CBE Birr', icon: 'business-outline', placeholder: '1000XXXXXXXXX' },
  { id: 'bank', label: 'Bank Account', icon: 'card-outline', placeholder: 'Account number' },
];

// Common Ethiopian bank codes (Chapa)
const BANK_CODES = [
  { label: 'Awash Bank', code: 'Awash' },
  { label: 'Abyssinia Bank', code: 'Abyssinia' },
  { label: 'Dashen Bank', code: 'Dashen' },
  { label: 'Oromia Bank', code: 'Oromia' },
  { label: 'Hibret Bank', code: 'Hibret' },
  { label: 'Nib Bank', code: 'Nib' },
  { label: 'Wegagen Bank', code: 'Wegagen' },
  { label: 'Berhan Bank', code: 'Berhan' },
];

export default function PayoutAccountScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const showToast = useUiStore(s => s.showToast);

  const [type, setType] = useState<PayoutAccountType>('telebirr');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankCode, setBankCode] = useState('Awash');
  const [saving, setSaving] = useState(false);

  // Pre-fill if user already has a payout account
  useEffect(() => {
    const existing = (user as unknown as Record<string, unknown>)?.payoutAccount as PayoutAccount | undefined;
    if (existing) {
      setType(existing.type);
      setAccountNumber(existing.accountNumber);
      setAccountName(existing.accountName);
      if (existing.bankCode) setBankCode(existing.bankCode);
    } else if (user?.name) {
      setAccountName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!accountNumber.trim() || !accountName.trim()) {
      showToast('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      const account: PayoutAccount = {
        type,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        ...(type === 'bank' ? { bankCode } : {}),
      };
      await savePayoutAccount(user.id, account);
      showToast('Payout account saved!');
      router.back();
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Payout Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Where should we send your money after a successful sale? Funds arrive within minutes via Chapa.
      </Text>

      <Text style={styles.sectionLabel}>Account type</Text>
      {ACCOUNT_TYPES.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => setType(t.id)}
          style={[styles.typeRow, type === t.id && styles.typeRowActive]}
        >
          <Ionicons
            name={t.icon as keyof typeof Ionicons.glyphMap}
            size={22}
            color={type === t.id ? COLORS.ACCENT : COLORS.TEXT_MUTED}
          />
          <Text style={[styles.typeLabel, type === t.id && { color: COLORS.ACCENT }]}>{t.label}</Text>
          {type === t.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.ACCENT} />}
        </Pressable>
      ))}

      <Text style={styles.sectionLabel}>Account holder name</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name as on account"
        placeholderTextColor={COLORS.TEXT_MUTED}
        value={accountName}
        onChangeText={setAccountName}
      />

      <Text style={styles.sectionLabel}>
        {type === 'telebirr' ? 'Telebirr phone number' : type === 'cbe' ? 'CBE account number' : 'Bank account number'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={ACCOUNT_TYPES.find(t => t.id === type)?.placeholder ?? 'Account number'}
        placeholderTextColor={COLORS.TEXT_MUTED}
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
      />

      {type === 'bank' && (
        <>
          <Text style={styles.sectionLabel}>Bank</Text>
          {BANK_CODES.map((b) => (
            <Pressable
              key={b.code}
              onPress={() => setBankCode(b.code)}
              style={[styles.bankRow, bankCode === b.code && styles.bankRowActive]}
            >
              <Text style={[styles.bankLabel, bankCode === b.code && { color: COLORS.ACCENT, fontWeight: '600' }]}>
                {b.label}
              </Text>
              {bankCode === b.code && <Ionicons name="checkmark" size={16} color={COLORS.ACCENT} />}
            </Pressable>
          ))}
        </>
      )}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.INFO_BLUE} />
        <Text style={styles.infoText}>
          9.5% platform commission is deducted. You receive 90.5% of the sale price, 8 hours after delivery confirmation.
        </Text>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
      >
        {saving
          ? <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
          : <Text style={styles.saveBtnText}>Save Payout Account</Text>
        }
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  subtitle: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, lineHeight: 20, marginBottom: 8 },
  sectionLabel: { fontSize: FONT_SIZE.SM, fontWeight: '700', color: COLORS.TEXT_DARK, marginTop: 8 },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
  },
  typeRowActive: { borderColor: COLORS.ACCENT, backgroundColor: COLORS.ACCENT_LIGHT },
  typeLabel: { flex: 1, fontSize: FONT_SIZE.MD, fontWeight: '600', color: COLORS.TEXT_DARK },
  input: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, padding: 14,
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  bankRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.BG_CARD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  bankRowActive: { borderColor: COLORS.ACCENT },
  bankLabel: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_DARK },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#EBF5FF', borderRadius: 12, padding: 14, marginTop: 8,
  },
  infoText: { flex: 1, fontSize: FONT_SIZE.XS, color: COLORS.INFO_BLUE, lineHeight: 18 },
  saveBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
});
