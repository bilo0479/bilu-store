import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../src/constants/colors';

export default function AboutDeveloperScreen() {
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
        <Text style={styles.headerTitle}>About Developer</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          <Ionicons name="code-slash" size={40} color={COLORS.ACCENT} />
        </View>
        <Text style={styles.devName}>Bilu Store Team</Text>
        <Text style={styles.devRole}>Full-Stack Development</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Built With</Text>
        <View style={styles.techRow}>
          <View style={styles.techBadge}><Text style={styles.techText}>React Native</Text></View>
          <View style={styles.techBadge}><Text style={styles.techText}>Expo</Text></View>
          <View style={styles.techBadge}><Text style={styles.techText}>TypeScript</Text></View>
          <View style={styles.techBadge}><Text style={styles.techText}>Firebase</Text></View>
          <View style={styles.techBadge}><Text style={styles.techText}>Zustand</Text></View>
          <View style={styles.techBadge}><Text style={styles.techText}>Cloudinary</Text></View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <Pressable style={styles.contactRow}>
          <Ionicons name="mail-outline" size={20} color={COLORS.ACCENT} />
          <Text style={styles.contactText}>support@bilustore.com</Text>
        </Pressable>
        <Pressable style={styles.contactRow}>
          <Ionicons name="globe-outline" size={20} color={COLORS.ACCENT} />
          <Text style={styles.contactText}>bilustore.com</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acknowledgments</Text>
        <Text style={styles.ackText}>
          Built with open-source technologies and community-driven tools. Special thanks to the
          Expo, Firebase, and React Native communities.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  profileSection: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  devName: { fontSize: 22, fontWeight: '700', color: COLORS.TEXT_DARK },
  devRole: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  card: { backgroundColor: COLORS.BG_CARD, borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_DARK },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techBadge: {
    backgroundColor: COLORS.ACCENT_LIGHT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  techText: { fontSize: FONT_SIZE.XS, fontWeight: '600', color: COLORS.ACCENT },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  contactText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_DARK },
  ackText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, lineHeight: 20 },
});
