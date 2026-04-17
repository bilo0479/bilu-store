# Bilu Store — SVG Assets Specification

> This document covers all SVG assets that are used as UI graphics, overlays, badges,
> and decorative elements — distinct from icons (see `icons.md`) and illustrations (see `illustrations.md`).
> These are typically smaller, more functional SVGs used directly inside components.

---

## 1. Splash Screen Graphic

| Field | Value |
|-------|-------|
| Asset Name | `splash-icon` |
| Purpose | Centered logo shown on Android cold launch splash screen |
| Used In | `app.json` splash config → `assets/images/splash-icon.png` |
| Background Color | `#FF6B35` (set in app.json) |
| Dimensions | 200×200px (source SVG), exported to PNG for splash |
| Format | SVG source → PNG export |
| File Path | `assets/images/splash-icon.png` (PNG), `assets/images/splash-icon.svg` (source) |

**Concept:** Brand mark — shopping bag with location pin, white on orange.

**AI Prompt:**
```
app splash screen logo, white vector graphic on transparent background,
abstract shopping bag outline with a location pin shape integrated
into the bag handle or body, bold clean geometry,
rounded corners, centered in 200x200 frame with generous padding,
flat 2D vector, no text, no gradients, suitable for white-on-orange display,
modern marketplace app logo symbol
```

**Export instructions:**
- SVG: white fills, transparent background
- PNG: export at 2×, 3× for density variants (`@2x`, `@3x`)

---

## 2. Premium Badge SVG

| Field | Value |
|-------|-------|
| Asset Name | `badge-premium` |
| Purpose | Gold "Featured" badge overlaid on premium ad images |
| Used In | `src/components/PremiumBadge.tsx`, `src/components/AdCard.tsx` |
| Dimensions | Dynamic width × 20px height (pill shape) |
| Format | SVG (inline component) |
| File Path | `assets/icons/features/badge-premium.svg` |

**Concept:** Rounded pill with star icon + label text. Gold background.

**AI Prompt:**
```
premium badge graphic SVG, horizontal pill shape,
gold background #FFB800, white star icon on left side (10px),
white text placeholder space on right, rounded corners 10px radius,
clean flat vector, no shadow, no border,
used as overlay on marketplace listing image card
```

---

## 3. Condition Badges

Rendered by `ConditionBadge.tsx`. Four variants, each a small pill.

| Variant | Color | File Path |
|---------|-------|-----------|
| New | `#4CAF50` (green) | `assets/icons/badges/condition-new.svg` |
| Like New | `#2196F3` (blue) | `assets/icons/badges/condition-like-new.svg` |
| Used Good | `#FF9800` (amber) | `assets/icons/badges/condition-used-good.svg` |
| Used Fair | `#9E9E9E` (gray) | `assets/icons/badges/condition-used-fair.svg` |

**AI Prompt (adapt color per variant):**
```
product condition badge SVG, small rounded pill shape,
[COLOR] background, white text space inside, 6px border radius,
flat vector, no shadow, no border, clean minimal badge design,
used on marketplace product listing cards
```

---

## 4. Status Dot Indicators

Used in `StatusBadge.tsx`. Six color variants as 6×6px filled circles.

| Status | Color | File Path |
|--------|-------|-----------|
| Active | `#4CAF50` | `assets/icons/status/dot-active.svg` |
| Pending | `#FF9800` | `assets/icons/status/dot-pending.svg` |
| Sold | `#2196F3` | `assets/icons/status/dot-sold.svg` |
| Rejected | `#F44336` | `assets/icons/status/dot-rejected.svg` |
| Expired | `#9E9E9E` | `assets/icons/status/dot-expired.svg` |
| Draft | `#B0B0B0` | `assets/icons/status/dot-draft.svg` |

These are 6×6 solid circle SVGs. Not worth generating with AI — create directly:

```svg
<svg viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
  <circle cx="3" cy="3" r="3" fill="#4CAF50"/>
</svg>
```

---

## 5. Rating Stars SVG Set

Used in `RatingStars.tsx`. Three states needed: filled, half, outline.

| State | File Path | Color |
|-------|-----------|-------|
| Star filled | `assets/icons/features/star-filled.svg` | `#FFC107` |
| Star half | `assets/icons/features/star-half.svg` | `#FFC107` + `#E0E0E0` |
| Star outline | `assets/icons/features/star-outline.svg` | `#E0E0E0` |

**AI Prompt:**
```
5-point star rating icon SVG, perfect geometric star shape,
24x24 viewBox, centered composition, filled variant: solid gold #FFC107,
no stroke, flat 2D vector, clean sharp points, symmetrical
```

For half-star: left half filled gold, right half outline gray — best implemented as two overlapping paths in SVG.

---

## 6. Notification Badge Counter Graphic

Used in `NotificationBadge.tsx` — rendered in-component.  
No external SVG needed; documented here for reference.

```tsx
// Current implementation renders as:
// - 20×20 circle, ERROR_RED (#F44336) background
// - White text, 11px, 700 weight
// - Position: absolute top-right (-6, -6) on parent
// - Shows "99+" for counts above 99
```

If a standalone SVG badge is needed for marketing materials:

**AI Prompt:**
```
notification count badge SVG, small circle shape, red #F44336 background,
white number "3" centered inside, 20x20 viewBox, flat 2D vector,
no shadow, clean minimal app badge indicator
```

---

## 7. Onboarding Progress Dots

Used in `OnboardingOverlay.tsx` — 3 dot pagination indicator.

| State | Width | Height | Color | Radius |
|-------|-------|--------|-------|--------|
| Active | 20px | 8px | `#FF6B35` | 4px |
| Inactive | 8px | 8px | `#EBEBEB` | 4px |

These animate between states. SVG not needed — rendered in React Native as `View` elements.  
Documented here for reference in design mockups.

---

## 8. Image Picker Dashed Border Button

Used in `ImagePicker.tsx` — the "Add Photo" placeholder tile.

| Field | Value |
|-------|-------|
| Asset Name | `add-photo-tile` |
| Purpose | Dashed border tile for adding photos in listing creation |
| Used In | `src/components/ImagePicker.tsx` |
| Dimensions | 100×100px |
| Format | SVG |
| File Path | `assets/icons/features/add-photo-tile.svg` |

**Design:** Dashed border square with camera icon and "Add" label.

**AI Prompt:**
```
add photo button tile SVG, square tile with dashed border,
light gray dashed stroke #B0B0B0 dash pattern 4 4,
8px border radius, light background #F7F8FA,
centered camera outline icon (20px, muted gray),
"Add Photo" text placeholder below camera,
100x100 viewBox, flat minimal vector
```

---

## 9. Chat Bubble Tail SVG

Used in `ChatBubble.tsx` — small tail shape indicating message direction.

| Variant | Color | Direction |
|---------|-------|-----------|
| Sent | `#FF6B35` | Right-pointing tail |
| Received | `#F0F0F5` | Left-pointing tail |

These are small triangle paths (8×8px) appended to message bubbles.  
Can be inline SVG path in component — no external file needed.

```svg
<!-- Sent bubble tail (right side) -->
<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 L8 4 L0 8 Z" fill="#FF6B35"/>
</svg>
```

---

## 10. Premium Tier Decorative SVGs

Used in `app/premium/[adId].tsx` — visual decorations for the premium tier cards.

### 10.1 Featured Tier Card Background

| Field | Value |
|-------|-------|
| Asset Name | `premium-featured-bg` |
| Purpose | Subtle decorative background pattern for Featured tier card |
| Dimensions | 320×120px |
| Format | SVG |
| File Path | `assets/icons/features/premium-featured-bg.svg` |

**AI Prompt:**
```
premium card background decoration SVG, subtle abstract pattern,
small stars and sparkle shapes scattered across horizontal rectangle,
gold #FFB800 at 15% opacity, transparent background,
320x120 viewBox, flat minimal vector,
used as decorative overlay on premium listing tier card
```

---

### 10.2 Top Search Tier Badge

| Field | Value |
|-------|-------|
| Asset Name | `premium-topsearch-badge` |
| Purpose | Badge for Top Search Placement tier |
| Dimensions | 80×24px |
| Format | SVG |
| File Path | `assets/icons/badges/premium-topsearch.svg` |

**AI Prompt:**
```
top search badge SVG, horizontal pill shape, teal #4ECDC4 background,
white rocket or upward arrow icon on left (12px), text space right,
20px height, 8px border radius, flat vector, no shadow,
marketplace premium listing top search badge
```

---

### 10.3 Homepage Spotlight Badge

| Field | Value |
|-------|-------|
| Asset Name | `premium-spotlight-badge` |
| Purpose | Badge for Homepage Spotlight tier |
| Dimensions | 80×24px |
| Format | SVG |
| File Path | `assets/icons/badges/premium-spotlight.svg` |

**AI Prompt:**
```
spotlight badge SVG, horizontal pill shape, purple #A29BFE background,
white star burst or sparkle icon on left (12px), text space right,
20px height, 8px border radius, flat vector, no shadow,
marketplace premium homepage spotlight badge
```

---

## 11. Drawer Menu Divider

Used in `DrawerContent.tsx` — horizontal rule between menu sections.

```svg
<!-- Simple 1px divider line, extends full width -->
<svg viewBox="0 0 320 1" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="0.5" x2="320" y2="0.5" stroke="#F0F0F5" stroke-width="1"/>
</svg>
```

---

## 12. App Logo Wordmark (Optional)

| Field | Value |
|-------|-------|
| Asset Name | `logo-wordmark` |
| Purpose | Full brand lockup — icon + "Bilu Store" text for marketing and splash |
| Used In | `src/components/DrawerContent.tsx` header, about screen |
| Dimensions | 200×48px |
| Format | SVG |
| File Path | `assets/images/logo-wordmark.svg` |

**AI Prompt:**
```
app logo wordmark SVG, horizontal layout, small shopping bag icon
on left side, "Bilu Store" text on right, bold sans-serif font style,
orange #FF6B35 for icon, dark #1A1A2E for text,
flat 2D vector, clean modern marketplace brand logo,
200x48 viewBox, no shadows, no gradients
```

---

## SVG Optimization Checklist

Before committing any SVG to the repo, run through this checklist:

```bash
# Install SVGO
npm install -g svgo

# Optimize all SVGs in assets/
svgo --recursive assets/icons/
svgo --recursive assets/illustrations/
```

**Manual checks:**
- [ ] No embedded raster images
- [ ] No `<style>` blocks with hardcoded colors (use `fill="currentColor"` for tintable icons)
- [ ] No `<defs>` with unused elements
- [ ] ViewBox set correctly
- [ ] No transform matrix on root `<svg>` element
- [ ] File size < 5KB per icon SVG, < 20KB per illustration SVG

---

## React Native SVG Integration

Install the SVG renderer:

```bash
pnpm add react-native-svg
npx expo install react-native-svg
```

Usage in components:

```tsx
import { SvgUri } from 'react-native-svg';

// Render SVG from file
<SvgUri
  width={24}
  height={24}
  uri={require('../../assets/icons/nav/home.svg')}
/>

// Or use inline SVG for tintable icons
import HomeSvg from '../../assets/icons/nav/home.svg';
<HomeSvg width={24} height={24} color={COLORS.ACCENT} />
```

Metro bundler config for SVG support (`metro.config.js`):

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
```
