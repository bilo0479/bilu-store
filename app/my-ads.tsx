import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../src/constants/colors';
import { EmptyState } from '../src/components/EmptyState';
import { useAuthStore } from '../src/stores/authStore';
import { fetchUserAds, deleteAd } from '../src/services/AdService';
import { useUiStore } from '../src/stores/uiStore';
import { useRequireAuth } from '../src/hooks/useAuth';
import type { Ad, AdStatus } from '../src/types';

const STATUS_COLORS: Record<AdStatus, string> = {
  ACTIVE: COLORS.SUCCESS_GREEN,
  PENDING_REVIEW: COLORS.WARNING_AMBER,
  DRAFT: COLORS.TEXT_MUTED,
  SOLD: COLORS.INFO_BLUE,
  EXPIRED: COLORS.TEXT_MUTED,
  REJECTED: COLORS.ERROR_RED,
  REMOVED: COLORS.ERROR_RED,
};

const MY_AD_ITEM_HEIGHT = 96;
const EDITABLE_STATUSES: AdStatus[] = ['DRAFT', 'ACTIVE', 'PENDING_REVIEW', 'REJECTED', 'EXPIRED'];

function MyAdItem({ ad, onPress, onDelete, onEdit }: { ad: Ad; onPress: () => void; onDelete: () => void; onEdit: () => void }) {
  const statusColor = STATUS_COLORS[ad.status] ?? COLORS.TEXT_MUTED;
  const canEdit = EDITABLE_STATUSES.includes(ad.status);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.adItem, pressed && { opacity: 0.9 }]}>
      {ad.images.length > 0 ? (
        <Image source={{ uri: ad.images[0] }} style={styles.adThumb} contentFit="cover" />
      ) : (
        <View style={[styles.adThumb, styles.adThumbPlaceholder]}>
          <Ionicons name="image-outline" size={24} color={COLORS.TEXT_MUTED} />
        </View>
      )}
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
        <Text style={styles.adPrice}>{ad.price.toLocaleString()} {ad.currency}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{ad.status.replace('_', ' ')}</Text>
        </View>
      </View>
      {canEdit && (
        <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
          <Ionicons name="create-outline" size={20} color={COLORS.ACCENT} />
        </Pressable>
      )}
      <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color={COLORS.ERROR_RED} />
      </Pressable>
    </Pressable>
  );
}

export default function MyAdsScreen() {
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth('/my-ads');
  const showToast = useUiStore(s => s.showToast);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await fetchUserAds(user.id);
        setAds(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleDelete = async (adId: string) => {
    try {
      await deleteAd(adId);
      setAds(ads.filter(a => a.id !== adId));
      showToast('Ad deleted');
    } catch {
      showToast('Failed to delete');
    }
  };

  if (authLoading || !canAccess || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.ACCENT} /></View>;
  }

  return (
    <FlatList
      data={ads}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MyAdItem
          ad={item}
          onPress={() => router.push(`/ad/${item.id}` as never)}
          onEdit={() => router.push(`/post/edit/${item.id}` as never)}
          onDelete={() => handleDelete(item.id)}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="storefront-outline"
          title="No ads yet"
          subtitle="Post your first ad to start selling"
          actionLabel="Post Ad"
          onAction={() => router.push('/post/create' as never)}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
      getItemLayout={(data, index) => ({
        length: MY_AD_ITEM_HEIGHT,
        offset: MY_AD_ITEM_HEIGHT * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN },
  list: { backgroundColor: COLORS.BG_SCREEN },
  adItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.BG_CARD },
  adThumb: { width: 64, height: 64, borderRadius: 10 },
  adThumbPlaceholder: { backgroundColor: COLORS.DIVIDER, alignItems: 'center', justifyContent: 'center' },
  adInfo: { flex: 1, gap: 4 },
  adTitle: { fontSize: FONT_SIZE.MD, fontWeight: '600', color: COLORS.TEXT_DARK },
  adPrice: { fontSize: FONT_SIZE.SM, fontWeight: '700', color: COLORS.ACCENT },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FONT_SIZE.XS, fontWeight: '600' },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  separator: { height: 1, backgroundColor: COLORS.DIVIDER },
});
