import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePlan } from '../hooks/usePlan';

const BANNER_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS_ID ?? TestIds.ADAPTIVE_BANNER,
      android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID_ID ?? TestIds.ADAPTIVE_BANNER,
      default: TestIds.ADAPTIVE_BANNER,
    })!;

export function FeedAdSlot() {
  const plan = usePlan();
  if (plan === 'pro') return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
});
