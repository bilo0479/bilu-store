import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { CATEGORIES } from '../../src/constants/categories';
import { useAuthStore } from '../../src/stores/authStore';
import { useUiStore } from '../../src/stores/uiStore';
import { createAd } from '../../src/services/AdService';
import { pickImages, uploadImages } from '../../src/services/MediaService';
import { useRequireAuth } from '../../src/hooks/useAuth';
import type { CategoryId, ContactPreference, AdCondition } from '../../src/types';
import * as Haptics from 'expo-haptics';

const MAX_IMAGES = 8;

const CONDITIONS: { value: AdCondition; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'USED_GOOD', label: 'Used - Good' },
  { value: 'USED_FAIR', label: 'Used - Fair' },
];

const CURRENCIES = ['ETB', 'USD'] as const;
type Currency = typeof CURRENCIES[number];

export default function CreateAdScreen() {
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth('/post/create');
  const showToast = useUiStore(s => s.showToast);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('ETB');
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [condition, setCondition] = useState<AdCondition | ''>('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [negotiable, setNegotiable] = useState(false);
  const [contactPref, setContactPref] = useState<ContactPreference>('CHAT_ONLY');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePickImages = async () => {
    const uris = await pickImages(MAX_IMAGES - images.length);
    if (uris.length > 0) {
      setImages([...images, ...uris].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) { showToast('Please add a title', 'warning'); return; }
    if (!description.trim()) { showToast('Please add a description', 'warning'); return; }
    if (!price.trim() || isNaN(Number(price))) { showToast('Please enter a valid price', 'warning'); return; }
    if (!category) { showToast('Please select a category', 'warning'); return; }
    if (!location.trim()) { showToast('Please enter a location', 'warning'); return; }

    setLoading(true);
    try {
      let uploadedUrls = images;
      if (images.length > 0) {
        uploadedUrls = await uploadImages(images);
      }
      await createAd(
        {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          currency,
          category: category as CategoryId,
          condition: condition ? (condition as AdCondition) : undefined,
          images: uploadedUrls,
          location: location.trim(),
          contactPreference: contactPref,
          negotiable,
        },
        {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
        }
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
    } catch (e) {
      showToast('Failed to post ad', 'error');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !canAccess || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top }]}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={COLORS.SUCCESS_GREEN} />
        </View>
        <Text style={styles.successTitle}>Ad Posted!</Text>
        <Text style={styles.successSubtitle}>
          Your ad is pending review.{'\n'}We'll notify you when it's live.
        </Text>
        <View style={styles.successActions}>
          <Pressable
            onPress={() => router.replace('/my-ads')}
            style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.successBtnText}>View My Ads</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowSuccess(false);
              setTitle(''); setDescription(''); setPrice(''); setCategory('');
              setCondition(''); setLocation(''); setImages([]);
              setNegotiable(false); setContactPref('CHAT_ONLY'); setCurrency('ETB');
            }}
            style={({ pressed }) => [styles.successBtnSecondary, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.successBtnSecondaryText}>Post Another</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Close" accessibilityRole="button">
          <Ionicons name="close" size={24} color={COLORS.TEXT_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Post Ad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
              <Pressable onPress={() => handleRemoveImage(i)} style={styles.removeBtn} accessibilityLabel="Remove photo" accessibilityRole="button">
                <Ionicons name="close" size={14} color={COLORS.TEXT_ON_ACCENT} />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <Pressable onPress={handlePickImages} style={styles.addImageBtn} accessibilityLabel="Add photo" accessibilityRole="button">
              <Ionicons name="camera-outline" size={28} color={COLORS.TEXT_MUTED} />
              <Text style={styles.addImageText}>{images.length}/{MAX_IMAGES}</Text>
            </Pressable>
          )}
        </ScrollView>

        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you selling?"
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item..."
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_MUTED}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <View style={styles.currencyToggle}>
              {CURRENCIES.map(cur => (
                <Pressable
                  key={cur}
                  onPress={() => setCurrency(cur)}
                  style={[styles.currencyBtn, currency === cur && styles.currencyBtnActive]}
                >
                  <Text style={[styles.currencyText, currency === cur && styles.currencyTextActive]}>
                    {cur}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable onPress={() => setNegotiable(!negotiable)} style={styles.checkRow}>
          <Ionicons
            name={negotiable ? 'checkbox' : 'square-outline'}
            size={22}
            color={negotiable ? COLORS.ACCENT : COLORS.TEXT_MUTED}
          />
          <Text style={styles.checkLabel}>Price is negotiable</Text>
        </Pressable>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.chip, category === cat.id && styles.chipActive]}
              >
                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color={category === cat.id ? COLORS.TEXT_ON_ACCENT : cat.color} />
                <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Condition</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CONDITIONS.map(cond => (
              <Pressable
                key={cond.value}
                onPress={() => setCondition(cond.value)}
                style={[styles.chip, condition === cond.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, condition === cond.value && styles.chipTextActive]}>{cond.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, neighborhood..."
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Preference</Text>
          <View style={styles.toggleRow}>
            {(['CHAT_ONLY', 'CHAT_AND_PHONE'] as const).map(pref => (
              <Pressable
                key={pref}
                onPress={() => setContactPref(pref)}
                style={[styles.toggleBtn, contactPref === pref && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, contactPref === pref && styles.toggleTextActive]}>
                  {pref === 'CHAT_ONLY' ? 'Chat Only' : 'Chat & Phone'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.TEXT_ON_ACCENT} />
          ) : (
            <Text style={styles.submitText}>Post Ad</Text>
          )}
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COLORS.BG_CARD,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  form: { padding: 20, gap: 16 },
  sectionTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK, marginTop: 4 },
  imageRow: { gap: 10 },
  imageThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  addImageBtn: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.BORDER,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED },
  inputGroup: { gap: 6 },
  label: { fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_DARK },
  input: {
    backgroundColor: COLORS.BG_CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK },
  chipRow: { gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.BORDER, backgroundColor: COLORS.BG_CARD,
  },
  chipActive: { backgroundColor: COLORS.ACCENT, borderColor: COLORS.ACCENT },
  chipText: { fontSize: FONT_SIZE.SM, fontWeight: '500', color: COLORS.TEXT_DARK },
  chipTextActive: { color: COLORS.TEXT_ON_ACCENT },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER,
    alignItems: 'center', backgroundColor: COLORS.BG_CARD,
  },
  toggleActive: { backgroundColor: COLORS.ACCENT_LIGHT, borderColor: COLORS.ACCENT },
  toggleText: { fontSize: FONT_SIZE.SM, fontWeight: '500', color: COLORS.TEXT_DARK },
  toggleTextActive: { color: COLORS.ACCENT, fontWeight: '600' },
  priceRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  priceInput: {
    flex: 1,
  },
  currencyToggle: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  currencyBtn: {
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.BG_CARD,
  },
  currencyBtnActive: {
    backgroundColor: COLORS.ACCENT_LIGHT,
  },
  currencyText: {
    fontSize: FONT_SIZE.SM, fontWeight: '600', color: COLORS.TEXT_MUTED,
  },
  currencyTextActive: {
    color: COLORS.ACCENT,
  },
  submitBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  successContainer: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  successIconWrap: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 32, fontWeight: '800', color: COLORS.TEXT_DARK, marginBottom: 8,
  },
  successSubtitle: {
    fontSize: FONT_SIZE.MD, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 22,
    marginBottom: 32,
  },
  successActions: {
    width: '100%', gap: 12,
  },
  successBtn: {
    backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  successBtnText: {
    fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT,
  },
  successBtnSecondary: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.ACCENT, backgroundColor: COLORS.BG_CARD,
  },
  successBtnSecondaryText: {
    fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.ACCENT,
  },
});
