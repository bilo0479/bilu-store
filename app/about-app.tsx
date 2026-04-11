import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../src/constants/colors';

export default function AboutAppScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>About Bilu Store</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.logoSection}>
        <View style={styles.logoWrap}>
          <Ionicons name="storefront" size={48} color={COLORS.ACCENT} />
        </View>
        <Text style={styles.appName}>Bilu Store</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Our Mission</Text>
        <Text style={styles.cardText}>
          Connect local buyers and sellers instantly. No payments. No shipping. Just people meeting
          locally to trade. The fastest way to post, find, and buy locally.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Features</Text>
        <View style={styles.featureRow}>
          <Ionicons name="search-outline" size={18} color={COLORS.ACCENT} />
          <Text style={styles.featureText}>Browse 10+ categories of local listings</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="chatbubbles-outline" size={18} color={COLORS.ACCENT} />
          <Text style={styles.featureText}>Real-time chat with buyers and sellers</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="star-outline" size={18} color={COLORS.ACCENT} />
          <Text style={styles.featureText}>Reputation system with reviews</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.ACCENT} />
          <Text style={styles.featureText}>Moderation for a safe marketplace</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Legal</Text>
        <Pressable style={styles.linkRow}>
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_MUTED} />
        </Pressable>
        <Pressable style={styles.linkRow}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_MUTED} />
        </Pressable>
      </View>

      <Text style={styles.copyright}>
        {'\u00A9'} {new Date().getFullYear()} Bilu Store. All rights reserved.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  logoSection: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  logoWrap: {
    width: 88, height: 88, borderRadius: 22, backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 24, fontWeight: '700', color: COLORS.TEXT_DARK },
  version: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  card: { backgroundColor: COLORS.BG_CARD, borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_DARK },
  cardText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, lineHeight: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_DARK, flex: 1 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: COLORS.DIVIDER,
  },
  linkText: { fontSize: FONT_SIZE.SM, color: COLORS.ACCENT, fontWeight: '600' },
  copyright: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED, textAlign: 'center', marginTop: 8 },
});
