/**
 * AppIcon — unified icon abstraction for Bilu Store (mobile).
 *
 * Uses phosphor-react-native for consistent 1.5 px stroke,
 * round line caps, and clean outline ↔ filled active states.
 *
 * Brand icons (Google, Facebook) that are absent from Phosphor
 * fall back to Ionicons from @expo/vector-icons.
 *
 * Usage:
 *   <AppIcon name="heart" size={24} color={COLORS.ERROR_RED} weight="fill" />
 *   <AppIcon name="home"  size={24} color={color} weight={focused ? 'fill' : 'regular'} />
 *   <AppIcon name="logo-google" size={20} color={COLORS.ACCENT} />
 */

import React from 'react';
import type { IconWeight } from 'phosphor-react-native';
import {
  House, MagnifyingGlass, Plus, PlusCircle, ChatTeardropDots,
  ChatCircle, ChatCircleDots, User, UserCircle, Heart,
  ArrowLeft, ArrowRight, X, XCircle, MapPin, Clock, Camera,
  Star, StarHalf, Image, Check, CheckCircle, WarningCircle, Warning,
  CaretRight, ArrowsDownUp, Storefront, NavigationArrow, Key,
  ShieldCheck, Info, CreditCard, DeviceMobile, Buildings,
  DotsThreeHorizontal, ShareNetwork, List, Lock, Envelope, Phone,
  PaperPlaneTilt, SignIn, SignOut, PencilSimple, Trash, Gear,
  ListBullets, Eye, EyeSlash, Code, Globe, Football, Briefcase, Wrench, CheckSquare, Square,
  GraduationCap, Bed, TShirt, Car, GridFour, Faders, Menu,
  ShoppingBag,
} from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';

export type AppIconWeight = IconWeight;

export type AppIconName =
  | 'house'
  | 'magnifying-glass'
  | 'plus'
  | 'plus-circle'
  | 'chat-teardrop-dots'
  | 'chat-circle'
  | 'chat-circle-dots'
  | 'user'
  | 'user-circle'
  | 'heart'
  | 'arrow-left'
  | 'arrow-right'
  | 'x'
  | 'x-circle'
  | 'map-pin'
  | 'clock'
  | 'camera'
  | 'star'
  | 'star-half'
  | 'image'
  | 'check'
  | 'check-circle'
  | 'warning-circle'
  | 'warning'
  | 'caret-right'
  | 'arrows-down-up'
  | 'storefront'
  | 'navigation-arrow'
  | 'key'
  | 'shield-check'
  | 'info'
  | 'credit-card'
  | 'device-mobile'
  | 'buildings'
  | 'dots-three-horizontal'
  | 'share-network'
  | 'list'
  | 'lock'
  | 'envelope'
  | 'phone'
  | 'paper-plane-tilt'
  | 'sign-in'
  | 'sign-out'
  | 'pencil-simple'
  | 'trash'
  | 'gear'
  | 'list-bullets'
  | 'eye'
  | 'eye-slash'
  | 'check-square'
  | 'square'
  | 'code'
  | 'globe'
  | 'football'
  | 'briefcase'
  | 'wrench'
  | 'graduation-cap'
  | 'bed'
  | 't-shirt'
  | 'car'
  | 'grid-four'
  | 'faders'
  | 'menu'
  | 'shopping-bag'
  // Brand / social icons (Ionicons fallback)
  | 'logo-google'
  | 'logo-facebook';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  weight?: AppIconWeight;
  style?: object;
}

type PhosphorComponent = React.ComponentType<{
  size?: number;
  color?: string;
  weight?: IconWeight;
  style?: object;
}>;

const PHOSPHOR_MAP: Record<string, PhosphorComponent> = {
  'house':               House,
  'magnifying-glass':    MagnifyingGlass,
  'plus':                Plus,
  'plus-circle':         PlusCircle,
  'chat-teardrop-dots':  ChatTeardropDots,
  'chat-circle':         ChatCircle,
  'chat-circle-dots':    ChatCircleDots,
  'user':                User,
  'user-circle':         UserCircle,
  'heart':               Heart,
  'arrow-left':          ArrowLeft,
  'arrow-right':         ArrowRight,
  'x':                   X,
  'x-circle':            XCircle,
  'map-pin':             MapPin,
  'clock':               Clock,
  'camera':              Camera,
  'star':                Star,
  'star-half':           StarHalf,
  'image':               Image,
  'check':               Check,
  'check-circle':        CheckCircle,
  'warning-circle':      WarningCircle,
  'warning':             Warning,
  'caret-right':         CaretRight,
  'arrows-down-up':      ArrowsDownUp,
  'storefront':          Storefront,
  'navigation-arrow':    NavigationArrow,
  'key':                 Key,
  'shield-check':        ShieldCheck,
  'info':                Info,
  'credit-card':         CreditCard,
  'device-mobile':       DeviceMobile,
  'buildings':           Buildings,
  'dots-three-horizontal': DotsThreeHorizontal,
  'share-network':       ShareNetwork,
  'list':                List,
  'lock':                Lock,
  'envelope':            Envelope,
  'phone':               Phone,
  'paper-plane-tilt':    PaperPlaneTilt,
  'sign-in':             SignIn,
  'sign-out':            SignOut,
  'pencil-simple':       PencilSimple,
  'trash':               Trash,
  'gear':                Gear,
  'list-bullets':        ListBullets,
  'eye':                 Eye,
  'eye-slash':           EyeSlash,
  'check-square':        CheckSquare,
  'square':              Square,
  'code':                Code,
  'globe':               Globe,
  'football':            Football,
  'briefcase':           Briefcase,
  'wrench':              Wrench,
  'graduation-cap':      GraduationCap,
  'bed':                 Bed,
  't-shirt':             TShirt,
  'car':                 Car,
  'grid-four':           GridFour,
  'faders':              Faders,
  'menu':                Menu,
  'shopping-bag':        ShoppingBag,
};

// Ionicons fallback map for brand/social icons
const IONICONS_FALLBACK: Record<string, string> = {
  'logo-google':   'logo-google',
  'logo-facebook': 'logo-facebook',
};

export function AppIcon({
  name,
  size = 24,
  color = '#1A1A2E',
  weight = 'regular',
  style,
}: AppIconProps) {
  // Brand icons → Ionicons
  if (name in IONICONS_FALLBACK) {
    return (
      <Ionicons
        name={IONICONS_FALLBACK[name] as keyof typeof Ionicons.glyphMap}
        size={size}
        color={color}
        style={style as never}
      />
    );
  }

  const IconComponent = PHOSPHOR_MAP[name];
  if (!IconComponent) {
    console.warn(`AppIcon: unknown icon "${name}" — falling back to nothing`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      weight={weight}
      style={style}
    />
  );
}
