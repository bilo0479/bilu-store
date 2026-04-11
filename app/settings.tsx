import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../src/constants/colors';
import { useAuthStore } from '../src/stores/authStore';
import { useUiStore } from '../src/stores/uiStore';
import { updateUserProfile } from '../src/services/AuthService';
import { useRequireAuth } from '../src/hooks/useAuth';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth('/settings');
  const setUser = useAuthStore(s => s.setUser);
  const showToast = useUiStore(s => s.showToast);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates = { name: name.trim(), phone: phone.trim() || null, location: location.trim() || null };
      await updateUserProfile(user.id, updates);
      setUser({ ...user, ...updates });
      showToast('Profile updated');
    } catch {
      showToast('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !canAccess || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional" placeholderTextColor={COLORS.TEXT_MUTED} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City..." placeholderTextColor={COLORS.TEXT_MUTED} />
      </View>
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
      >
        {saving ? <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </Pressable>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About</Text>
        <Text style={styles.infoText}>Bilu Store v1.0.0</Text>
        <Text style={styles.infoText}>Local classified marketplace</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 20, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_DARK },
  input: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  saveBtn: { backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  infoSection: { marginTop: 32, gap: 6 },
  infoTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  infoText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
});
