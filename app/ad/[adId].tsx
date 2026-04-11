import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Animated, Dimensions, FlatList, Share, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { SkeletonAdDetail } from '../../src/components/Skeleton';
import { RatingStars } from '../../src/components/RatingStars';
import { getCategoryMeta } from '../../src/constants/categories';
import { useAuthStore } from '../../src/stores/authStore';
import { useFavoritesStore } from '../../src/stores/favoritesStore';
import { useUiStore } from '../../src/stores/uiStore';
import { fetchAdById, incrementViewCount } from '../../src/services/AdService';
import { getOrCreateChat } from '../../src/services/ChatService';
import { redirectToLogin } from '../../src/hooks/useAuth';
import type { Ad } from '../../src/types';
import * as Haptics from 'expo-haptics';

const SCREEN_W = Dimensions.get('window').width;

export default function AdDetailScreen() {
  const { adId } = useLocalSearchParams<{ adId: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { favoriteAdIds, toggle: toggleFav } = useFavoritesStore();
  const showToast = useUiStore(s => s.showToast);

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const favScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!adId) return;
    (async () => {
      try {
        const data = await fetchAdById(adId);
        setAd(data);
        if (data) incrementViewCount(adId);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [adId]);

  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated || !user || !ad) {
      if (ad) {
        void redirectToLogin(`/ad/${ad.id}`);
      }
      return;
    }
    Animated.sequence([
      Animated.spring(favScale, { toValue: 1.35, useNativeDriver: true, friction: 3, tension: 200 }),
      Animated.spring(favScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFav(user.id, ad.id);
  }, [isAuthenticated, user, ad, favScale, toggleFav]);

  const handleChat = async () => {
    if (!isAuthenticated || !user || !ad) {
      if (ad) {
        void redirectToLogin(`/ad/${ad.id}`);
      }
      return;
    }
    if (ad.sellerId === user.id) {
      showToast("You can't chat with yourself");
      return;
    }
    setChatLoading(true);
    try {
      const chatId = await getOrCreateChat(
        user.id, user.name, user.avatar,
        ad.sellerId, ad.sellerName, ad.sellerAvatar,
        ad.id, ad.title, ad.images[0] ?? '',
        ad.sellerId
      );
      router.push(`/chat/${chatId}` as never);
    } catch (e) {
      showToast('Failed to start chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = async () => {
    if (!ad) return;
    try {
      await Share.share({ message: `Check out "${ad.title}" on Bilu Store for ${ad.price} ${ad.currency}!` });
    } catch {}
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'ETB') return `${price.toLocaleString()} ETB`;
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonAdDetail />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 80 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.TEXT_MUTED} />
        <Text style={styles.errorText}>Ad not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isFavorited = favoriteAdIds.has(ad.id);
  const isOwner = user?.id === ad.sellerId;
  const category = getCategoryMeta(ad.category);
  const canViewFullDetails = isAuthenticated || isOwner;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageSection}>
          <FlatList
            data={ad.images.length > 0 ? ad.images : [null]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
            }}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) =>
              item ? (
                <Pressable onPress={() => setGalleryVisible(true)}>
                  <Image source={{ uri: item }} style={styles.adImage} contentFit="cover" transition={200} />
                </Pressable>
              ) : (
                <View style={[styles.adImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={48} color={COLORS.TEXT_MUTED} />
                </View>
              )
            }
          />
          <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
            <Pressable onPress={() => router.back()} style={styles.topBtn} accessibilityLabel="Go back" accessibilityRole="button">
              <Ionicons name="arrow-back" size={22} color={COLORS.TEXT_DARK} />
            </Pressable>
            <View style={styles.topActions}>
              <Pressable onPress={handleFavorite} style={styles.topBtn} accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'} accessibilityRole="button">
                <Animated.View style={{ transform: [{ scale: favScale }] }}>
                  <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={22} color={isFavorited ? COLORS.ERROR_RED : COLORS.TEXT_DARK} />
                </Animated.View>
              </Pressable>
              <Pressable onPress={handleShare} style={styles.topBtn} accessibilityLabel="Share this ad" accessibilityRole="button">
                <Ionicons name="share-outline" size={22} color={COLORS.TEXT_DARK} />
              </Pressable>
            </View>
          </View>
          {ad.images.length > 1 && (
            <View style={styles.dots}>
              {ad.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.price}>{formatPrice(ad.price, ad.currency)}</Text>
          {ad.negotiable && <Text style={styles.negotiable}>Negotiable</Text>}
          <Text style={styles.adTitle}>{ad.title}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={14} color={category.color} />
              <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
            </View>
            {!!ad.condition && (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{ad.condition.replace('_', ' ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.TEXT_MUTED} />
            <Text style={styles.locationText}>{ad.location}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={COLORS.TEXT_MUTED} />
              <Text style={styles.statText}>{ad.viewCount} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={14} color={COLORS.TEXT_MUTED} />
              <Text style={styles.statText}>{ad.favoriteCount} saves</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.TEXT_MUTED} />
              <Text style={styles.statText}>{formatDate(ad.createdAt)}</Text>
            </View>
          </View>
        </View>

        {canViewFullDetails ? (
          <>
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{ad.description}</Text>
            </View>

            <Pressable
              onPress={() => router.push(`/seller/${ad.sellerId}` as never)}
              style={styles.sellerCard}
            >
              {ad.sellerAvatar ? (
                <Image source={{ uri: ad.sellerAvatar }} style={styles.sellerAvatar} />
              ) : (
                <View style={styles.sellerAvatarFallback}>
                  <Text style={styles.sellerInitial}>{ad.sellerName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{ad.sellerName}</Text>
                <Text style={styles.sellerLabel}>View profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
            </Pressable>
          </>
        ) : (
          <View style={styles.authPreviewCard}>
            <Ionicons name="lock-closed-outline" size={24} color={COLORS.ACCENT} />
            <Text style={styles.authPreviewTitle}>Log in to view full item details</Text>
            <Text style={styles.authPreviewText}>
              Description, seller profile, reviews, and contact options are available after sign in.
            </Text>
            <Pressable
              onPress={() => void redirectToLogin(`/ad/${ad.id}`)}
              style={styles.authPreviewButton}
            >
              <Text style={styles.authPreviewButtonText}>Log In to Continue</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {!isOwner && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleChat}
            disabled={chatLoading}
            style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel="Chat with seller"
            accessibilityRole="button"
          >
            {chatLoading ? (
              <Animated.View><Text style={styles.chatBtnText}>Starting chat...</Text></Animated.View>
            ) : !canViewFullDetails ? (
              <>
                <Ionicons name="log-in-outline" size={20} color={COLORS.TEXT_ON_ACCENT} />
                <Text style={styles.chatBtnText}>Log In to Contact Seller</Text>
              </>
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.TEXT_ON_ACCENT} />
                <Text style={styles.chatBtnText}>Chat with Seller</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Fullscreen Image Gallery */}
      <Modal visible={galleryVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.galleryOverlay}>
          <Pressable
            onPress={() => setGalleryVisible(false)}
            style={[styles.galleryCloseBtn, { top: insets.top + 12 }]}
            accessibilityLabel="Close gallery"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <FlatList
            data={ad.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={imageIndex}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            keyExtractor={(_, i) => `gallery-${i}`}
            renderItem={({ item }) => (
              <View style={styles.galleryImageWrap}>
                <Image source={{ uri: item }} style={styles.galleryImage} contentFit="contain" />
              </View>
            )}
          />
          <View style={styles.galleryCounter}>
            <Text style={styles.galleryCounterText}>
              {imageIndex + 1} / {ad.images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG_SCREEN, gap: 12 },
  errorText: { fontSize: FONT_SIZE.LG, color: COLORS.TEXT_MUTED, fontWeight: '500' },
  backLink: { marginTop: 8 },
  backLinkText: { fontSize: FONT_SIZE.MD, color: COLORS.ACCENT, fontWeight: '600' },
  imageSection: { position: 'relative' },
  adImage: { width: SCREEN_W, height: SCREEN_W * 0.75 },
  placeholderImage: { backgroundColor: COLORS.DIVIDER, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.SHADOW, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  topActions: { flexDirection: 'row', gap: 10 },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: COLORS.BG_CARD, width: 20 },
  infoSection: { padding: 20, backgroundColor: COLORS.BG_CARD, gap: 8 },
  price: { fontSize: FONT_SIZE.PRICE, fontWeight: '800', color: COLORS.PRICE_TEXT },
  negotiable: { fontSize: FONT_SIZE.XS, color: COLORS.SUCCESS_GREEN, fontWeight: '600' },
  adTitle: { fontSize: FONT_SIZE.XL, fontWeight: '700', color: COLORS.TEXT_DARK, lineHeight: 28 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  categoryText: { fontSize: FONT_SIZE.XS, fontWeight: '600' },
  conditionBadge: { backgroundColor: COLORS.DIVIDER, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  conditionText: { fontSize: FONT_SIZE.XS, fontWeight: '500', color: COLORS.TEXT_DARK },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED },
  descSection: { padding: 20, backgroundColor: COLORS.BG_CARD, marginTop: 8, gap: 8 },
  sectionTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  description: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, lineHeight: 24 },
  authPreviewCard: {
    alignItems: 'center',
    gap: 10,
    padding: 20,
    backgroundColor: COLORS.BG_CARD,
    marginTop: 8,
  },
  authPreviewTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK, textAlign: 'center' },
  authPreviewText: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
  authPreviewButton: {
    marginTop: 4,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  authPreviewButtonText: { fontSize: FONT_SIZE.SM, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, backgroundColor: COLORS.BG_CARD, marginTop: 8 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24 },
  sellerAvatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.ACCENT_LIGHT, alignItems: 'center', justifyContent: 'center' },
  sellerInitial: { fontSize: 20, fontWeight: '700', color: COLORS.ACCENT },
  sellerInfo: { flex: 1, gap: 2 },
  sellerName: { fontSize: FONT_SIZE.MD, fontWeight: '600', color: COLORS.TEXT_DARK },
  sellerLabel: { fontSize: FONT_SIZE.SM, color: COLORS.TEXT_MUTED },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.BG_CARD, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.ACCENT, borderRadius: 14, paddingVertical: 16 },
  chatBtnText: { fontSize: FONT_SIZE.MD, fontWeight: '700', color: COLORS.TEXT_ON_ACCENT },
  galleryOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  galleryCloseBtn: { position: 'absolute', right: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  galleryImageWrap: { width: SCREEN_W, justifyContent: 'center', alignItems: 'center' },
  galleryImage: { width: SCREEN_W, height: SCREEN_W },
  galleryCounter: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  galleryCounterText: { color: '#fff', fontSize: FONT_SIZE.SM, fontWeight: '600' },
});
