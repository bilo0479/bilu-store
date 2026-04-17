import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useUiStore } from '../../src/stores/uiStore';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

const PRO_FEATURES = [
  { icon: 'eye-off-outline' as const, title: 'Ghost Mode', desc: 'Hide your profile from visitors' },
  { icon: 'time-outline' as const, title: 'First Look', desc: 'See new listings 30 min before free users' },
  { icon: 'ban-outline' as const, title: 'Ad-Free', desc: 'No sponsored content in your feed' },
  { icon: 'infinite-outline' as const, title: 'Unlimited Listings', desc: 'Post more than 5 ads at once' },
  { icon: 'refresh-outline' as const, title: 'One-Click Re-list', desc: 'Renew expired ads instantly' },
];

export default function ProUpgradeScreen() {
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(s => s.showToast);
  const { success } = useLocalSearchParams<{ success?: string }>();

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{ plan: string; planExpiresAt: number | null } | null>(null);

  const startCheckout = useAction(api.pro.startCheckout);
  const getMyPlan = useAction(api.pro.getMyPlan);

  useEffect(() => {
    getMyPlan({}).then(setPlan).catch(() => {});
  }, []);

  useEffect(() => {
    if (success === '1') {
      showToast('Pro activated! Enjoy your subscription.');
      getMyPlan({}).then(setPlan).catch(() => {});
    }
  }, [success]);

  const handleUpgrade = async (referralCode?: string) => {
    setLoading(true);
    try {
      const result = await startCheckout({ referralCode });
      await Linking.openURL((result as { checkoutUrl: string }).checkoutUrl);
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const isPro = plan?.plan === 'pro';
  const expiresDate = plan?.planExpiresAt
    ? new Date(plan.planExpiresAt).toLocaleDateString('en-ET', { dateStyle: 'medium' })
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Bilu Store Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.proBadge}>
          <Ionicons name="star" size={20} color={COLORS.PRO_GOLD ?? '#F5C518'} />
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
        <Text style={styles.heroTitle}>Sell smarter,{'\n'}earn faster</Text>
        <Text style={styles.heroPrice}>199 ETB / month</Text>
      </View>

      {/* Current plan status */}
      {isPro && (
        <View style={[styles.card, { borderColor: COLORS.ACCENT, borderWidth: 1.5 }]}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.SUCCESS_GREEN} />
          <Text style={styles.cardTitle}>You're on Pro</Text>
          {expiresDate && (
            <Text style={styles.cardSubtext}>Renews {expiresDate}</Text>
          )}
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresCard}>
        {PRO_FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={20} color={COLORS.ACCENT} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {!isPro && (
        <>
          <Pressable
            onPress={() => handleUpgrade()}
            disabled={loading}
            style={[styles.upgradeBtn, loading && styles.btnDisabled]}
          >
            {loading
              ? <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
              : <Text style={styles.upgradeBtnText}>Upgrade to Pro — 199 ETB/mo</Text>
            }
          </Pressable>

          <Pressable onPress={() => handleUpgrade('TT-TRIAL')} style={styles.trialBtn}>
            <Text style={styles.trialBtnText}>Start 7-day free trial</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.BG_CARD, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1.5, borderColor: COLORS.PRO_GOLD ?? '#F5C518',
  },
  proBadgeText: { fontSize: FONT_SIZE.SM, fontWeight: '800', color: COLORS.PRO_GOLD ?? '#F5C518' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: COLORS.TEXT_DARK, textAlign: 'center', lineHeight: 36 },
  heroPrice: { fontSize: FONT_SIZE.LG, color: COLORS.TEXT_MUTED, fontWeight: '500' },
  card: { backgroundColor: COLORS.BG_CARD, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  cardTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  cardSubtext: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  featuresCard: { backgroundColor: COLORS.BG_CARD, borderRadius: 16, padding: 16, gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: `${COLORS.ACCENT}18`, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { fontSize: FONT_SIZE.MD, fontWeight: '600', color: COLORS.TEXT_DARK },
  featureDesc: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  upgradeBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  upgradeBtnText: { fontSize: FONT_SIZE.LG, fontWeight: '800', color: COLORS.TEXT_ON_ACCENT },
  trialBtn: { alignItems: 'center', paddingVertical: 12 },
  trialBtnText: { fontSize: FONT_SIZE.SM, color: COLORS.ACCENT, fontWeight: '600', textDecoration: 'underline' as never },
});
