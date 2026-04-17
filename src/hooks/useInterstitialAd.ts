import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useUiStore } from '../stores/uiStore';
import { usePlan } from './usePlan';

const UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS_ID ?? TestIds.INTERSTITIAL,
      android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID_ID ?? TestIds.INTERSTITIAL,
      default: TestIds.INTERSTITIAL,
    })!;

const COOLDOWN_MS = 3 * 60 * 1000;

export function useInterstitialAd() {
  const plan = usePlan();
  const lastShownAt = useUiStore(s => s.lastInterstitialAt);
  const setLastShownAt = useUiStore(s => s.setLastInterstitialAt);
  const adRef = useRef<InterstitialAd | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (plan === 'pro') return;

    const ad = InterstitialAd.createForAdRequest(UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const onLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const onClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      ad.load();
    });

    ad.load();

    return () => {
      onLoaded();
      onClosed();
      loadedRef.current = false;
      adRef.current = null;
    };
  }, [plan]);

  const showIfReady = useCallback(() => {
    if (plan === 'pro') return;
    const now = Date.now();
    if (lastShownAt !== null && now - lastShownAt < COOLDOWN_MS) return;
    if (!loadedRef.current || !adRef.current) return;

    setLastShownAt(now);
    void adRef.current.show();
  }, [plan, lastShownAt, setLastShownAt]);

  return { showIfReady };
}
