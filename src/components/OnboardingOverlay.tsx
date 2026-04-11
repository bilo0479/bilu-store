import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORAGE_KEY = 'bilu_onboarding_seen';

interface CoachStep {
  icon: string;
  title: string;
  subtitle: string;
}

const STEPS: CoachStep[] = [
  {
    icon: 'search',
    title: 'Find anything in your city',
    subtitle: 'Search by keyword, category, or location to discover items near you.',
  },
  {
    icon: 'add-circle',
    title: 'Sell something in 60 seconds',
    subtitle: 'Post an ad with photos, set your price, and connect with buyers.',
  },
  {
    icon: 'chatbubbles',
    title: 'Chat directly with sellers',
    subtitle: 'Negotiate and arrange meetups through secure in-app messaging.',
  },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const slideY = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setVisible(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(slideY, { toValue: 0, damping: 15, useNativeDriver: true }),
        ]).start();
      }
    })();
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      // Animate transition
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(slideY, { toValue: -20, duration: 150, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(slideY, { toValue: 0, damping: 15, useNativeDriver: true }),
        ]),
      ]).start();
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = async () => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <Pressable style={styles.overlay} onPress={handleNext}>
      <Animated.View style={[styles.card, { opacity, transform: [{ translateY: slideY }] }]}>
        <View style={styles.iconCircle}>
          <Ionicons name={current.icon as keyof typeof Ionicons.glyphMap} size={32} color={COLORS.ACCENT} />
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <Pressable onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextText}>
              {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.TEXT_ON_ACCENT} />
          </Pressable>
        </View>

        {step < STEPS.length - 1 && (
          <Pressable onPress={dismiss} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: COLORS.BG_CARD,
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.DIVIDER,
  },
  dotActive: {
    backgroundColor: COLORS.ACCENT,
    width: 20,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextText: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.TEXT_ON_ACCENT,
  },
  skipText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    fontWeight: '500',
  },
});
