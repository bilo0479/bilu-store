import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { useUiStore } from '../../src/stores/uiStore';
import {
  fetchEscrowDeal,
  fetchBuyerCode,
  verifyDelivery,
  requestRefund,
} from '../../src/services/EscrowService';
import type { EscrowRow } from '@bilustore/shared';

const STATUS_LABEL: Record<string, string> = {
  held:      'Payment Secured',
  verified:  'Delivery Verified',
  completed: 'Payment Released',
  refunded:  'Refunded',
  disputed:  'Under Review',
};

const STATUS_COLOR: Record<string, string> = {
  held:      COLORS.INFO_BLUE,
  verified:  COLORS.ACCENT,
  completed: COLORS.SUCCESS_GREEN,
  refunded:  COLORS.TEXT_MUTED,
  disputed:  COLORS.ERROR_RED,
};

const POLL_INTERVAL_MS = 8000;

export default function EscrowScreen() {
  const { txId } = useLocalSearchParams<{ txId: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const showToast = useUiStore(s => s.showToast);

  const dealId = txId ? parseInt(txId, 10) : null;

  const [tx, setTx] = useState<EscrowRow | null>(null);
  const [buyerCode, setBuyerCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const loadDeal = useCallback(async () => {
    if (!dealId) return;
    const data = await fetchEscrowDeal(dealId);
    setTx(data);
    setLoading(false);
  }, [dealId]);

  // Poll for deal state changes (Convex reactive queries not available in imperative service calls)
  useEffect(() => {
    loadDeal();
    const interval = setInterval(loadDeal, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadDeal]);

  // Fetch plain OTP for buyer once status is 'held'
  useEffect(() => {
    if (!tx || !user || tx.status !== 'held' || tx.buyerId !== user.id || !dealId) return;
    fetchBuyerCode(dealId).then(res => setBuyerCode(res?.code ?? null)).catch(() => {});
  }, [tx?.status, user?.id, dealId]);

  const isBuyer = user?.id === tx?.buyerId;
  const isSeller = user?.id === tx?.sellerId;

  const handleVerify = useCallback(async () => {
    if (!otpInput.trim() || !dealId) return;
    setVerifying(true);
    try {
      await verifyDelivery(dealId, otpInput.trim());
      showToast('Delivery confirmed! Payment releases in 8 hours.');
      setOtpInput('');
      loadDeal();
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message ?? 'Verification failed';
      if (msg.includes('wrong_code')) {
        showToast('Wrong code. Please try again.');
      } else if (msg.includes('locked_out')) {
        showToast('Too many attempts. Transaction disputed automatically.');
      } else {
        showToast(msg);
      }
    } finally {
      setVerifying(false);
    }
  }, [otpInput, dealId, showToast, loadDeal]);

  const handleRefund = useCallback(() => {
    Alert.alert(
      'Request Refund',
      'Are you sure you want to cancel this transaction and request a refund?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Refund',
          style: 'destructive',
          onPress: async () => {
            if (!dealId) return;
            setRefunding(true);
            try {
              await requestRefund(dealId, 'Buyer requested cancellation');
              showToast('Refund requested. You\'ll receive it in 3–5 business days.');
              loadDeal();
            } catch (e: unknown) {
              showToast((e as Error).message ?? 'Refund request failed');
            } finally {
              setRefunding(false);
            }
          },
        },
      ]
    );
  }, [dealId, showToast, loadDeal]);

  const formatCountdown = (releaseAt: number | null): string => {
    if (!releaseAt) return '';
    const diff = releaseAt - Date.now();
    if (diff <= 0) return 'Releasing soon...';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m remaining`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.TEXT_MUTED} />
        <Text style={styles.errorText}>Transaction not found</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.link}>Go Back</Text></Pressable>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[tx.status] ?? COLORS.TEXT_MUTED;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Secure Purchase</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Badge */}
      <View style={[styles.statusCard, { borderColor: statusColor }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {STATUS_LABEL[tx.status] ?? tx.status}
        </Text>
      </View>

      {/* Transaction Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transaction Details</Text>
        <Row label="Total Paid" value={`${tx.amount.toLocaleString()} ETB`} bold />
        <Row label="Seller Receives" value={`${tx.payoutAmount.toLocaleString()} ETB`} />
        <Row label="Platform Fee" value={`${tx.commissionAmount.toLocaleString()} ETB (9.5%)`} />
        <Row label="Payment Method" value={tx.paymentMethod} />
      </View>

      {/* ── BUYER VIEW ── */}
      {isBuyer && tx.status === 'held' && (
        <View style={styles.card}>
          <View style={styles.otpHeader}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.INFO_BLUE} />
            <Text style={styles.cardTitle}>Your Delivery Code</Text>
          </View>
          <Text style={styles.otpSubtext}>
            Show this code to the seller <Text style={{ fontWeight: '700' }}>only after receiving your item</Text>.
          </Text>
          {buyerCode ? (
            <View style={styles.otpBox}>
              <Text style={styles.otpDigits}>{buyerCode}</Text>
            </View>
          ) : (
            <ActivityIndicator color={COLORS.ACCENT} style={{ marginTop: 12 }} />
          )}
          <Text style={styles.otpWarning}>
            ⚠️ Do not share this code before physical delivery
          </Text>
        </View>
      )}

      {(isBuyer || isSeller) && tx.status === 'verified' && (
        <View style={styles.card}>
          <Ionicons name="time-outline" size={32} color={COLORS.ACCENT} style={{ alignSelf: 'center' }} />
          <Text style={styles.timerLabel}>
            {isSeller ? 'Payment Releasing In' : 'Payout Countdown'}
          </Text>
          <Text style={styles.timerValue}>{formatCountdown(tx.payoutReleaseAt)}</Text>
          <Text style={styles.timerSubtext}>
            {isSeller
              ? `${tx.payoutAmount.toLocaleString()} ETB will be sent to your account automatically.`
              : 'Seller will receive payment automatically after the 8-hour window.'}
          </Text>
        </View>
      )}

      {tx.status === 'completed' && (
        <View style={[styles.card, styles.successCard]}>
          <Ionicons name="checkmark-circle" size={40} color={COLORS.SUCCESS_GREEN} style={{ alignSelf: 'center' }} />
          <Text style={styles.successText}>
            {isSeller ? 'Payment Sent!' : 'Transaction Complete'}
          </Text>
          <Text style={styles.successSubtext}>
            {isSeller
              ? `${tx.payoutAmount.toLocaleString()} ETB has been sent to your payout account.`
              : 'Payment has been released to the seller. Enjoy your purchase!'}
          </Text>
        </View>
      )}

      {/* ── SELLER CODE ENTRY ── */}
      {isSeller && tx.status === 'held' && (
        <View style={styles.card}>
          <View style={styles.otpHeader}>
            <Ionicons name="key-outline" size={24} color={COLORS.ACCENT} />
            <Text style={styles.cardTitle}>Confirm Delivery</Text>
          </View>
          <Text style={styles.otpSubtext}>
            Ask the buyer for their 6-digit delivery code and enter it below.
          </Text>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={otpInput}
            onChangeText={(t) => setOtpInput(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable
            onPress={handleVerify}
            disabled={otpInput.length < 6 || verifying}
            style={[styles.primaryBtn, (otpInput.length < 6 || verifying) && styles.btnDisabled]}
          >
            {verifying
              ? <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
              : <Text style={styles.primaryBtnText}>Confirm Delivery</Text>
            }
          </Pressable>
        </View>
      )}

      {/* Refund button (buyer only, when held) */}
      {isBuyer && tx.status === 'held' && (
        <Pressable
          onPress={handleRefund}
          disabled={refunding}
          style={styles.refundBtn}
        >
          {refunding
            ? <ActivityIndicator color={COLORS.ERROR_RED} />
            : <Text style={styles.refundBtnText}>Cancel & Request Refund</Text>
          }
        </Pressable>
      )}

      {tx.status === 'disputed' && (
        <View style={[styles.card, { borderColor: COLORS.ERROR_RED, borderWidth: 1 }]}>
          <Ionicons name="warning-outline" size={28} color={COLORS.ERROR_RED} style={{ alignSelf: 'center' }} />
          <Text style={[styles.successText, { color: COLORS.ERROR_RED }]}>Under Review</Text>
          <Text style={styles.successSubtext}>
            This transaction is being reviewed by our team. We'll contact both parties within 24 hours.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: FONT_SIZE.LG, color: COLORS.TEXT_MUTED },
  link: { fontSize: FONT_SIZE.MD, color: COLORS.ACCENT, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, padding: 14,
    borderWidth: 1.5,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: FONT_SIZE.MD, fontWeight: '700' },
  card: { backgroundColor: COLORS.BG_CARD, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  rowValue: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_DARK, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  rowValueBold: { fontWeight: '700', fontSize: FONT_SIZE.MD },
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  otpSubtext: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, lineHeight: 20 },
  otpBox: {
    backgroundColor: COLORS.BG_SCREEN, borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.ACCENT, borderStyle: 'dashed',
  },
  otpDigits: { fontSize: 36, fontWeight: '800', color: COLORS.ACCENT, letterSpacing: 10 },
  otpWarning: { fontSize: FONT_SIZE.XS, color: COLORS.WARNING_AMBER, fontWeight: '600', textAlign: 'center' },
  otpInput: {
    borderWidth: 1.5, borderColor: COLORS.BORDER, borderRadius: 12,
    padding: 14, fontSize: 24, fontWeight: '700', color: COLORS.TEXT_DARK,
    textAlign: 'center', letterSpacing: 8, backgroundColor: COLORS.BG_SCREEN,
  },
  primaryBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  timerLabel: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, textAlign: 'center' },
  timerValue: { fontSize: FONT_SIZE.XL, fontWeight: '800', color: COLORS.ACCENT, textAlign: 'center' },
  timerSubtext: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
  successCard: { alignItems: 'center', gap: 8 },
  successText: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK, textAlign: 'center' },
  successSubtext: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
  refundBtn: { alignItems: 'center', paddingVertical: 14 },
  refundBtnText: { fontSize: FONT_SIZE.SM, color: COLORS.ERROR_RED, fontWeight: '600' },
});
