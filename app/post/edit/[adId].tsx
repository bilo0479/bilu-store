import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../../src/constants/colors';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUiStore } from '../../../src/stores/uiStore';
import { fetchAdById, updateAd } from '../../../src/services/AdService';
import { pickImages } from '../../../src/services/MediaService';
import { validateAdTitle, validateAdDescription, validateAdPrice, validateAdImages } from '../../../src/utils/validators';
import { CATEGORIES } from '../../../src/constants/categories';
import { useRequireAuth } from '../../../src/hooks/useAuth';
import type { Ad } from '../../../src/types';

export default function EditAdScreen() {
  const { adId } = useLocalSearchParams<{ adId: string }>();
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth(adId ? `/post/edit/${adId}` : '/post/edit');
  const showToast = useUiStore(s => s.showToast);

  const [ad, setAd] = useState<Ad | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAd();
  }, [adId]);

  const loadAd = async () => {
    if (!adId) return;
    try {
      const result = await fetchAdById(adId);
      if (result) {
        setAd(result);
        setTitle(result.title);
        setDescription(result.description);
        setPrice(String(result.price));
        setLocation(result.location);
        setImages(result.images);
      }
    } catch {
      showToast('Failed to load ad');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImages = async () => {
    const maxNew = 8 - images.length;
    if (maxNew <= 0) {
      showToast('Maximum 8 photos allowed');
      return;
    }
    const result = await pickImages(maxNew);
    if (result) {
      setImages([...images, ...result]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!ad || !user) return;

    const titleResult = validateAdTitle(title);
    if (!titleResult.valid) { showToast(titleResult.error ?? 'Invalid title'); return; }
    const descResult = validateAdDescription(description);
    if (!descResult.valid) { showToast(descResult.error ?? 'Invalid description'); return; }
    const priceResult = validateAdPrice(price);
    if (!priceResult.valid) { showToast(priceResult.error ?? 'Invalid price'); return; }
    const imageResult = validateAdImages(images.length);
    if (!imageResult.valid) { showToast(imageResult.error ?? 'Invalid images'); return; }

    setSaving(true);
    try {
      await updateAd(ad.id, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        location: location.trim(),
        images,
      });
      showToast('Ad updated');
      router.back();
    } catch {
      showToast('Failed to update ad');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !canAccess || loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Ad not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
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
        <Text style={styles.headerTitle}>Edit Ad</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.imagesSection}>
        <Text style={styles.label}>Photos ({images.length}/8)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.imageThumb} />
              <Pressable onPress={() => handleRemoveImage(i)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={22} color={COLORS.ERROR_RED} />
              </Pressable>
            </View>
          ))}
          {images.length < 8 && (
            <Pressable onPress={handleAddImages} style={styles.addImageBtn}>
              <Ionicons name="add" size={28} color={COLORS.ACCENT} />
            </Pressable>
          )}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={100} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />
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
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  errorText: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_MUTED },
  backLink: { marginTop: 12, paddingVertical: 8 },
  backLinkText: { fontSize: FONT_SIZE.MD, color: COLORS.ACCENT, fontWeight: '600' },
  imagesSection: { gap: 8 },
  label: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_DARK },
  imageRow: { gap: 8, paddingVertical: 4 },
  imageWrap: { position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 10 },
  removeBtn: { position: 'absolute', top: -6, right: -6 },
  addImageBtn: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: COLORS.BORDER,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  inputGroup: { gap: 6 },
  input: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  textArea: { minHeight: 120 },
  saveBtn: { backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
});
