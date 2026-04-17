/**
 * AnimatedStateIcon — animated SVG state graphics for Bilu Store.
 * Built with react-native-svg + react-native-reanimated (zero extra deps).
 *
 * ┌──────────┬──────────────────────────────────────────┐
 * │  type    │  Animation                               │
 * ├──────────┼──────────────────────────────────────────┤
 * │ check    │  stroke-draws ✓  (Correct / Verified)   │
 * │ done     │  circle + ✓  draw  (Success / Complete) │
 * │ error    │  stroke-draws ×  (Wrong / Dismiss)      │
 * │ fail     │  circle + × draw  (Failed / Rejected)   │
 * │ loading  │  spinning arc  (Processing / API call)  │
 * │ heart    │  bounce + fill  (Like / Favorite)       │
 * │ warning  │  triangle + ! draw  (Alert / Caution)   │
 * └──────────┴──────────────────────────────────────────┘
 *
 * Usage:
 *   <AnimatedStateIcon type="done"    size={72} onAnimationEnd={onDone} />
 *   <AnimatedStateIcon type="loading" size={40} color={COLORS.ACCENT} />
 *   <AnimatedStateIcon type="heart"   size={32} active={liked} />
 *   <AnimatedStateIcon type="fail"    size={64} autoPlay />
 */

import React, { useEffect, useRef } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const AnimatedPath   = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Pre-calculated approximate path lengths (for stroke-draw animation) ────
//   strokeDashoffset: pathLength → 0  =  "draws itself in"
const PL = {
  CHECK:      22,   // M 5 13 L 10 18 L 19 7
  CHECK_SM:   12,   // M 8 12 L 11 15 L 16 9  (inside ○)
  CIRCLE:     57,   // 2π × 9 ≈ 56.55
  X_SOLO:     14,   // M 7 7 L 17 17
  X_INSIDE:    9,   // M 9 9 L 15 15  (inside ○)
  TRIANGLE:   61,   // M 12 3 L 22 21 L 2 21 Z
  EXCLAMATION: 5,   // M 12 9 L 12 14
};

const EASE_OUT = Easing.out(Easing.cubic);

export type StateIconType =
  | 'check'
  | 'done'
  | 'error'
  | 'fail'
  | 'loading'
  | 'heart'
  | 'warning';

export interface AnimatedStateIconProps {
  type: StateIconType;
  size?: number;
  color?: string;
  /** Start animation on mount (default: true for all except heart) */
  autoPlay?: boolean;
  /** Loop forever — only used by 'loading' */
  loop?: boolean;
  /** heart only: filled (active) vs outline (inactive) */
  active?: boolean;
  onAnimationEnd?: () => void;
}

// ─── check ───────────────────────────────────────────────────────────────────
function CheckAnimation({
  size = 64,
  color = COLORS.SUCCESS_GREEN ?? '#4CAF50',
  autoPlay = true,
  onAnimationEnd,
}: Omit<AnimatedStateIconProps, 'type'>) {
  const offset = useSharedValue(PL.CHECK);

  useEffect(() => {
    if (!autoPlay) return;
    offset.value = PL.CHECK;
    offset.value = withTiming(
      0,
      { duration: 450, easing: EASE_OUT },
      (ok) => { if (ok && onAnimationEnd) runOnJS(onAnimationEnd)(); },
    );
  }, [autoPlay]);

  const ap = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedPath
        d="M 5 13 L 10 18 L 19 7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={PL.CHECK}
        animatedProps={ap}
      />
    </Svg>
  );
}

// ─── done ────────────────────────────────────────────────────────────────────
function DoneAnimation({
  size = 64,
  color = COLORS.SUCCESS_GREEN ?? '#4CAF50',
  autoPlay = true,
  onAnimationEnd,
}: Omit<AnimatedStateIconProps, 'type'>) {
  const circOff  = useSharedValue(PL.CIRCLE);
  const checkOff = useSharedValue(PL.CHECK_SM);

  useEffect(() => {
    if (!autoPlay) return;
    circOff.value  = PL.CIRCLE;
    checkOff.value = PL.CHECK_SM;

    // 1) Circle draws in 350 ms
    circOff.value = withTiming(0, { duration: 350, easing: EASE_OUT });
    // 2) Checkmark draws 300 ms later
    checkOff.value = withDelay(
      300,
      withTiming(
        0,
        { duration: 400, easing: EASE_OUT },
        (ok) => { if (ok && onAnimationEnd) runOnJS(onAnimationEnd)(); },
      ),
    );
  }, [autoPlay]);

  const circAP  = useAnimatedProps(() => ({ strokeDashoffset: circOff.value }));
  const checkAP = useAnimatedProps(() => ({ strokeDashoffset: checkOff.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedCircle
        cx={12} cy={12} r={9}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.CIRCLE}
        animatedProps={circAP}
      />
      <AnimatedPath
        d="M 8 12 L 11 15 L 16 9"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={PL.CHECK_SM}
        animatedProps={checkAP}
      />
    </Svg>
  );
}

// ─── error ───────────────────────────────────────────────────────────────────
function ErrorAnimation({
  size = 64,
  color = COLORS.ERROR_RED ?? '#F44336',
  autoPlay = true,
  onAnimationEnd,
}: Omit<AnimatedStateIconProps, 'type'>) {
  const off1 = useSharedValue(PL.X_SOLO);
  const off2 = useSharedValue(PL.X_SOLO);

  useEffect(() => {
    if (!autoPlay) return;
    off1.value = PL.X_SOLO;
    off2.value = PL.X_SOLO;
    // First diagonal draws, second follows 80 ms later
    off1.value = withTiming(0, { duration: 300, easing: EASE_OUT });
    off2.value = withDelay(
      80,
      withTiming(
        0,
        { duration: 300, easing: EASE_OUT },
        (ok) => { if (ok && onAnimationEnd) runOnJS(onAnimationEnd)(); },
      ),
    );
  }, [autoPlay]);

  const ap1 = useAnimatedProps(() => ({ strokeDashoffset: off1.value }));
  const ap2 = useAnimatedProps(() => ({ strokeDashoffset: off2.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedPath
        d="M 7 7 L 17 17"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.X_SOLO}
        animatedProps={ap1}
      />
      <AnimatedPath
        d="M 17 7 L 7 17"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.X_SOLO}
        animatedProps={ap2}
      />
    </Svg>
  );
}

// ─── fail ────────────────────────────────────────────────────────────────────
function FailAnimation({
  size = 64,
  color = COLORS.ERROR_RED ?? '#F44336',
  autoPlay = true,
  onAnimationEnd,
}: Omit<AnimatedStateIconProps, 'type'>) {
  const circOff = useSharedValue(PL.CIRCLE);
  const xOff1   = useSharedValue(PL.X_INSIDE);
  const xOff2   = useSharedValue(PL.X_INSIDE);

  useEffect(() => {
    if (!autoPlay) return;
    circOff.value = PL.CIRCLE;
    xOff1.value   = PL.X_INSIDE;
    xOff2.value   = PL.X_INSIDE;

    // 1) Circle draws
    circOff.value = withTiming(0, { duration: 350, easing: EASE_OUT });
    // 2) X lines draw in sequence
    xOff1.value = withDelay(300, withTiming(0, { duration: 280, easing: EASE_OUT }));
    xOff2.value = withDelay(
      380,
      withTiming(
        0,
        { duration: 280, easing: EASE_OUT },
        (ok) => { if (ok && onAnimationEnd) runOnJS(onAnimationEnd)(); },
      ),
    );
  }, [autoPlay]);

  const circAP = useAnimatedProps(() => ({ strokeDashoffset: circOff.value }));
  const xAP1   = useAnimatedProps(() => ({ strokeDashoffset: xOff1.value }));
  const xAP2   = useAnimatedProps(() => ({ strokeDashoffset: xOff2.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedCircle
        cx={12} cy={12} r={9}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.CIRCLE}
        animatedProps={circAP}
      />
      <AnimatedPath
        d="M 9 9 L 15 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.X_INSIDE}
        animatedProps={xAP1}
      />
      <AnimatedPath
        d="M 15 9 L 9 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.X_INSIDE}
        animatedProps={xAP2}
      />
    </Svg>
  );
}

// ─── loading ─────────────────────────────────────────────────────────────────
function LoadingAnimation({
  size = 40,
  color = COLORS.ACCENT ?? '#FF6B35',
}: Omit<AnimatedStateIconProps, 'type'>) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,   // infinite
      false,
    );
    return () => cancelAnimation(rotation);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* ~3/4 arc visible, 1/4 gap — creates classic spinner look */}
        <Circle
          cx={12} cy={12} r={9}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="42 15"
          strokeDashoffset={0}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── heart ───────────────────────────────────────────────────────────────────
function HeartAnimation({
  size = 32,
  color = COLORS.ERROR_RED ?? '#F44336',
  active = false,
}: Omit<AnimatedStateIconProps, 'type'>) {
  const scale   = useSharedValue(1);
  const prevRef = useRef(active);

  useEffect(() => {
    // Bounce only when toggling FROM inactive → active
    if (active && !prevRef.current) {
      scale.value = withSequence(
        withSpring(1.42, { damping: 4, stiffness: 350 }),
        withSpring(1.0,  { damping: 12, stiffness: 200 }),
      );
    }
    prevRef.current = active;
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Clean bezier heart path centered in 24×24 viewBox
  const d =
    'M 12 21 ' +
    'C 9 18.5 2 14 2 8.5 ' +
    'C 2 5.4 4.4 3 7.5 3 ' +
    'C 9.2 3 10.8 3.8 12 5.2 ' +
    'C 13.2 3.8 14.8 3 16.5 3 ' +
    'C 19.6 3 22 5.4 22 8.5 ' +
    'C 22 14 15 18.5 12 21 Z';

  return (
    <Animated.View style={animStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={d}
          fill={active ? color : 'none'}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── warning ─────────────────────────────────────────────────────────────────
function WarningAnimation({
  size = 64,
  color = '#FF9800',
  autoPlay = true,
  onAnimationEnd,
}: Omit<AnimatedStateIconProps, 'type'>) {
  const triOff   = useSharedValue(PL.TRIANGLE);
  const exclOff  = useSharedValue(PL.EXCLAMATION);
  const dotOpac  = useSharedValue(0);

  useEffect(() => {
    if (!autoPlay) return;
    triOff.value  = PL.TRIANGLE;
    exclOff.value = PL.EXCLAMATION;
    dotOpac.value = 0;

    // 1) Triangle outline draws (450 ms)
    triOff.value = withTiming(0, { duration: 450, easing: EASE_OUT });
    // 2) Exclamation body draws (delayed 380 ms)
    exclOff.value = withDelay(380, withTiming(0, { duration: 250, easing: EASE_OUT }));
    // 3) Dot fades in last
    dotOpac.value = withDelay(
      620,
      withTiming(
        1,
        { duration: 150 },
        (ok) => { if (ok && onAnimationEnd) runOnJS(onAnimationEnd)(); },
      ),
    );
  }, [autoPlay]);

  const triAP  = useAnimatedProps(() => ({ strokeDashoffset: triOff.value }));
  const exclAP = useAnimatedProps(() => ({ strokeDashoffset: exclOff.value }));
  const dotAP  = useAnimatedProps(() => ({ opacity: dotOpac.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Triangle */}
      <AnimatedPath
        d="M 12 3 L 22 21 L 2 21 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={PL.TRIANGLE}
        animatedProps={triAP}
      />
      {/* Exclamation body */}
      <AnimatedPath
        d="M 12 9 L 12 14"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={PL.EXCLAMATION}
        animatedProps={exclAP}
      />
      {/* Exclamation dot */}
      <AnimatedCircle
        cx={12} cy={17} r={1.2}
        fill={color}
        animatedProps={dotAP}
      />
    </Svg>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function AnimatedStateIcon({ type, ...rest }: AnimatedStateIconProps) {
  switch (type) {
    case 'check':   return <CheckAnimation   {...rest} />;
    case 'done':    return <DoneAnimation    {...rest} />;
    case 'error':   return <ErrorAnimation   {...rest} />;
    case 'fail':    return <FailAnimation    {...rest} />;
    case 'loading': return <LoadingAnimation {...rest} />;
    case 'heart':   return <HeartAnimation   {...rest} />;
    case 'warning': return <WarningAnimation {...rest} />;
  }
}
