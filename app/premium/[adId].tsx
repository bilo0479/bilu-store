import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useUiStore } from '../../src/stores/uiStore';
import { getAvailableTiers, getActiveBoost } from '../../src/services/PremiumService';
import { initializePayment } from '../../src/services/PaymentService';
import { useRequireAuth } from '../../src/hooks/useAuth';
import type { PremiumTier, PremiumTierId, PaymentMethod } from '../../src/types';

const TIER_ICONS: Record<string, string> = {
  FEATURED: 'star',
  TOP_SEARCH: 'search',
  HOMEPAGE: 'home',
  HIGHLIGHT: 'color-palette',
};

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; subtitle: string }[] = [
  { id: 'CHAPA_HOSTED', label: 'Pay with Chapa', icon: 'card-outline', subtitle: 'Card, bank transfer, mobile wallet' },
  { id: 'CHAPA_USSD', label: 'Telebirr USSD Push', icon: 'phone-portrait-outline', subtitle: 'Approve via USSD prompt on your phone' },
  { id: 'TELEBIRR', label: 'Telebirr In-App', icon: 'wallet-outline', subtitle: 'Open Telebirr checkout in browser' },
];

export default function PremiumScreen() {
  const { adId } = useLocalSearchParams<{ adId: string }>();
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth(adId ? `/premium/${adId}` : '/premium');
  const showToast = useUiStore(s => s.showToast);

  const [tiers, setTiers] = useState<PremiumTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<PremiumTierId | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CHAPA_HOSTED');
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tierList, activeBoost] = await Promise.all([
        getAvailableTiers(),
        adId ? getActiveBoost(adId) : null,
      ]);
      setTiers(tierList);
      if (activeBoost) setActiveTier(activeBoost.tierId);
    } catch {
      showToast('Failed to load premium options');
    } finally {
      setLoading(false);
    }
  }, [adId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async () => {
    if (!selectedTier || !adId || !user) return;
    setPaying(true);
    try {
      const result = await initializePayment(adId, selectedTier, selectedMethod);

      if (result.ussdPushSent) {
        showToast('USSD push sent — approve on your phone to complete payment.');
        router.back();
        return;
      }

      if (result.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        return;
      }

      showToast('Payment initiated');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed. Please try again.';
      showToast(msg);
    } finally {
      setPaying(false);
    }
  };

  const handleWebViewNavigationChange = (navState: { url: string }) => {
    // Detect deep-link return URL: bilustore://payment/result
    if (navState.url.startsWith('bilustore://payment/result')) {
      const urlObj = new URL(navState.url.replace('bilustore://', 'https://bilustore.et/'));
      const status = urlObj.searchParams.get('status');
      setCheckoutUrl(null);
      if (status === 'success') {
        showToast('Payment complete! Your boost will activate shortly.');
      } else {
        showToast('Payment was not completed.');
      }
      router.back();
    }
  };

  if (authLoading || !canAccess || !user || loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Boost Your Ad</Text>
          <View style={{ width: 40 }} />
        </View>

        {activeTier && (
          <View style={styles.activeBanner}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS_GREEN} />
            <Text style={styles.activeBannerText}>
              Active boost: {tiers.find(t => t.id === activeTier)?.name ?? activeTier}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Choose a boost tier</Text>

        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const isActive = activeTier === tier.id;
          return (
            <Pressable
              key={tier.id}
              onPress={() => !isActive && setSelectedTier(tier.id)}
              style={[
                styles.tierCard,
                isSelected && styles.tierCardSelected,
                isActive && styles.tierCardActive,
              ]}
              disabled={isActive}
            >
              <View style={styles.tierHeader}>
                <View style={[styles.tierIcon, isSelected && styles.tierIconSelected]}>
                  <Ionicons
                    name={(TIER_ICONS[tier.id] ?? 'star') as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={isSelected ? COLORS.TEXT_ON_ACCENT : COLORS.ACCENT}
                  />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDuration}>{tier.durationDays} days · {tier.price > 0 ? `${tier.price} ${tier.currency}` : 'Price set by admin'}</Text>
                </View>
                {isActive && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tierDescription}>{tier.description}</Text>
            </Pressable>
          );
        })}

        {selectedTier && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Payment method</Text>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedMethod(m.id)}
                style={[styles.methodCard, selectedMethod === m.id && styles.methodCardSelected]}
              >
                <Ionicons
                  name={m.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={selectedMethod === m.id ? COLORS.ACCENT : COLORS.TEXT_MUTED}
                />
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodLabel, selectedMethod === m.id && styles.methodLabelSelected]}>
                    {m.label}
                  </Text>
                  <Text style={styles.methodSubtitle}>{m.subtitle}</Text>
                </View>
                {selectedMethod === m.id && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.ACCENT} />
                )}
              </Pressable>
            ))}
          </>
        )}

        <Pressable
          onPress={handlePay}
          disabled={!selectedTier || paying}
          style={({ pressed }) => [
            styles.boostBtn,
            !selectedTier && styles.boostBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
        >
          {paying ? (
            <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
          ) : (
            <Text style={styles.boostBtnText}>
              {selectedTier ? 'Pay & Boost' : 'Select a tier'}
            </Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Payments are processed securely via Chapa or Telebirr. Your boost activates automatically after payment confirmation.
        </Text>
      </ScrollView>

      {/* Checkout WebView Modal */}
      <Modal visible={!!checkoutUrl} animationType="slide" onRequestClose={() => setCheckoutUrl(null)}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <View style={styles.webViewHeader}>
            <Pressable onPress={() => setCheckoutUrl(null)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={COLORS.TEXT_DARK} />
            </Pressable>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleWebViewNavigationChange}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={COLORS.ACCENT} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.ACCENT_LIGHT, borderRadius: 12, padding: 14,
  },
  activeBannerText: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.SUCCESS_GREEN },
  sectionTitle: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_DARK, marginTop: 4 },
  tierCard: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  tierCardSelected: { borderColor: COLORS.ACCENT },
  tierCardActive: { opacity: 0.6 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  tierIconSelected: { backgroundColor: COLORS.ACCENT },
  tierInfo: { flex: 1, gap: 2 },
  tierName: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_DARK },
  tierDuration: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  activeTag: { backgroundColor: COLORS.SUCCESS_GREEN, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeTagText: { fontSize: FONT_SIZE.XS, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  tierDescription: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, lineHeight: 18 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, padding: 14,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodCardSelected: { borderColor: COLORS.ACCENT },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_DARK },
  methodLabelSelected: { color: COLORS.ACCENT },
  methodSubtitle: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED, marginTop: 2 },
  boostBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  boostBtnDisabled: { opacity: 0.5 },
  boostBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  note: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 16, marginTop: 4 },
  webViewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  webViewTitle: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_DARK },
});
