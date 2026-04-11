import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { useUiStore } from '../../src/stores/uiStore';
import { updateUserProfile } from '../../src/services/AuthService';
import { pickImages, uploadAvatar } from '../../src/services/MediaService';
import { useRequireAuth } from '../../src/hooks/useAuth';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth('/profile/edit');
  const setUser = useAuthStore(s => s.setUser);
  const showToast = useUiStore(s => s.showToast);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar ?? null);
  const [saving, setSaving] = useState(false);

  const handlePickAvatar = async () => {
    const result = await pickImages(1);
    if (result && result.length > 0) {
      setAvatarUri(result[0]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      showToast('Name is required');
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, string | null> = {
        name: name.trim(),
        phone: phone.trim() || null,
        location: location.trim() || null,
      };

      // If avatar changed, compress and upload to Cloudinary
      if (avatarUri && avatarUri !== user.avatar) {
        const cloudUrl = await uploadAvatar(user.id, avatarUri);
        updates.avatar = cloudUrl;
      }

      await updateUserProfile(user.id, updates);
      setUser({ ...user, ...updates } as typeof user);
      showToast('Profile updated');
      router.back();
    } catch {
      showToast('Failed to update profile');
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={styles.cameraOverlay}>
          <Ionicons name="camera" size={18} color={COLORS.TEXT_ON_ACCENT} />
        </View>
      </Pressable>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={COLORS.TEXT_MUTED} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  avatarWrap: { alignSelf: 'center', position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '700', color: COLORS.ACCENT },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.ACCENT, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.BG_SCREEN,
  },
  inputGroup: { gap: 6 },
  label: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_DARK },
  input: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  saveBtn: { backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
});
