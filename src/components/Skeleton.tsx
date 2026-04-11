import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const SCREEN_W = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_W - 48) / 2;

interface SkeletonBlockProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

function SkeletonBlock({ width, height, borderRadius = 8, style }: SkeletonBlockProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: COLORS.SKELETON_BASE,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonBlock width="100%" height={CARD_WIDTH * 0.85} borderRadius={0} />
      <View style={skeletonStyles.cardInfo}>
        <SkeletonBlock width="70%" height={16} />
        <SkeletonBlock width="90%" height={14} />
        <SkeletonBlock width="50%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  const cards = Array.from({ length: count });
  const rows: React.ReactNode[] = [];

  for (let i = 0; i < cards.length; i += 2) {
    rows.push(
      <View key={i} style={skeletonStyles.gridRow}>
        <SkeletonCard />
        {i + 1 < cards.length && <SkeletonCard />}
      </View>
    );
  }

  return <View>{rows}</View>;
}

export function SkeletonChatRow() {
  return (
    <View style={skeletonStyles.chatRow}>
      <SkeletonBlock width={52} height={52} borderRadius={26} />
      <View style={skeletonStyles.chatContent}>
        <View style={skeletonStyles.chatTopRow}>
          <SkeletonBlock width={120} height={14} />
          <SkeletonBlock width={40} height={12} />
        </View>
        <SkeletonBlock width="80%" height={13} />
        <SkeletonBlock width="50%" height={11} />
      </View>
    </View>
  );
}

export function SkeletonChatList({ count = 5 }: { count?: number }) {
  return (
    <View style={skeletonStyles.chatList}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChatRow key={i} />
      ))}
    </View>
  );
}

export function SkeletonAdDetail() {
  return (
    <View>
      <SkeletonBlock width={SCREEN_W} height={SCREEN_W * 0.75} borderRadius={0} />
      <View style={skeletonStyles.detailContent}>
        <SkeletonBlock width="50%" height={24} />
        <SkeletonBlock width="80%" height={20} />
        <View style={skeletonStyles.detailRow}>
          <SkeletonBlock width={100} height={28} borderRadius={14} />
          <SkeletonBlock width={80} height={28} borderRadius={14} />
        </View>
        <SkeletonBlock width="40%" height={14} />
        <SkeletonBlock width="60%" height={14} />
        <View style={skeletonStyles.divider} />
        <SkeletonBlock width="30%" height={16} />
        <SkeletonBlock width="100%" height={14} />
        <SkeletonBlock width="100%" height={14} />
        <SkeletonBlock width="70%" height={14} />
        <View style={skeletonStyles.divider} />
        <View style={skeletonStyles.sellerRow}>
          <SkeletonBlock width={48} height={48} borderRadius={24} />
          <View style={{ gap: 6, flex: 1 }}>
            <SkeletonBlock width={120} height={16} />
            <SkeletonBlock width={80} height={13} />
          </View>
        </View>
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.BG_CARD,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  chatContent: {
    flex: 1,
    gap: 6,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatList: {
    gap: 2,
  },
  detailContent: {
    padding: 20,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 8,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
