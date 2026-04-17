# Bilu Store — Banners Specification

> Banners are raster graphics (WebP preferred, PNG fallback).  
> All banners are full-bleed horizontal images with safe text zones.  
> Primary accent: `#FF6B35`. Background variations: dark, light, gradient.

---

## Banner Design Principles

- **Safe zone**: Keep key visuals and text in center 80% of width
- **Text overlay**: Banners may have text overlaid in app — keep left or right 40% clear
- **Aspect ratio**: 16:5 for hero banners, 2:1 for promo cards
- **Edge bleed**: Colors extend to all edges, no white borders
- **Brand warmth**: Orange and warm tones dominate; avoid cold blues as primary

---

## 1. Home Hero Banners

Displayed at the top of the home screen in a horizontal carousel.  
Height: 160dp rendered, source: 1200×375px.  
Carousel auto-scrolls every 4 seconds.

### 1.1 Default Welcome Banner

| Field | Value |
|-------|-------|
| Asset Name | `home-hero-default` |
| Purpose | Default hero when no personalization applied |
| Used In | `app/(tabs)/home.tsx` — hero carousel, slide 1 |
| Dimensions | 1200×375px |
| Format | WebP (primary), PNG (fallback) |
| File Path | `assets/banners/home-hero-default.webp` |

**Concept:** Warm marketplace scene — diverse items arranged beautifully (phone, sneaker, chair, book), radiating from center with a welcoming feel.

**AI Prompt:**
```
horizontal app banner, local marketplace theme, flat lay arrangement
of diverse items (smartphone, sneakers, book, small plant),
warm orange gradient background #FF6B35 to #FFEAA7,
clean flat 2D illustration style, items spaced with generous
white space, no text, modern e-commerce banner aesthetic,
16:5 aspect ratio, centered composition, soft warm palette,
material design inspired, high quality vector art style
```

**Negative:**
```
--no photorealism, dark backgrounds, neon colors, cluttered layout,
3D rendering, shadows, text overlays
```

---

### 1.2 Electronics Feature Banner

| Field | Value |
|-------|-------|
| Asset Name | `home-hero-electronics` |
| Purpose | Feature banner for electronics category promotion |
| Used In | `app/(tabs)/home.tsx` — hero carousel, slide 2 |
| Dimensions | 1200×375px |
| Format | WebP |
| File Path | `assets/banners/home-hero-electronics.webp` |

**Concept:** Tech/electronics theme — modern devices arranged in a clean flat layout on teal background.

**AI Prompt:**
```
horizontal app banner, electronics marketplace theme,
flat lay of tech gadgets (smartphone, headphones, laptop, smartwatch),
teal to dark teal gradient background #4ECDC4 to #2D9E97,
clean flat 2D illustration style, items on right side of frame,
left side clear for text overlay, modern UI banner aesthetic,
no text, 16:5 aspect ratio, material design inspired,
product category banner for Android marketplace app
```

**Negative:**
```
--no photorealism, busy backgrounds, neon effects, 3D renders, text
```

---

### 1.3 Vehicles Feature Banner

| Field | Value |
|-------|-------|
| Asset Name | `home-hero-vehicles` |
| Purpose | Feature banner for vehicles category promotion |
| Used In | `app/(tabs)/home.tsx` — hero carousel, slide 3 |
| Dimensions | 1200×375px |
| Format | WebP |
| File Path | `assets/banners/home-hero-vehicles.webp` |

**Concept:** Vehicles/cars banner with clean car silhouette on sky-blue gradient.

**AI Prompt:**
```
horizontal app banner, vehicles marketplace theme,
flat 2D car silhouette side view centered-right, modern sedan shape,
sky blue gradient background #45B7D1 to #2E8FAA,
minimal vector illustration, road line indicator at bottom edge,
left zone clear for text, clean flat design,
no text, 16:5 aspect ratio, material design style,
marketplace vehicle category banner
```

**Negative:**
```
--no photorealism, busy scene, 3D, shadows, text, cluttered
```

---

## 2. Homepage Spotlight Carousel Banner

Used in the "Spotlight" premium tier section.  
Renders individual ad cards in a horizontal carousel at top.  
Source image is the ad's own listing photo — no custom banner needed.  
However a **spotlight frame overlay** SVG is needed.

### 2.1 Spotlight Frame Overlay

| Field | Value |
|-------|-------|
| Asset Name | `spotlight-frame` |
| Purpose | Gold border frame applied over premium HOMEPAGE tier ads |
| Used In | `app/(tabs)/home.tsx` — Spotlight carousel frame |
| Dimensions | 200×240px (card size) |
| Format | SVG |
| File Path | `assets/icons/features/spotlight-frame.svg` |

**AI Prompt:**
```
gold border frame graphic, rounded rectangle outline,
premium gold color #FFB800, 3px stroke weight,
subtle star decorations on top corners, vector SVG,
transparent interior, no fill inside frame,
premium marketplace listing frame indicator
```

---

## 3. Promotional Banners

Displayed in inline promo slots within the home feed or as modal overlays.  
Dimensions: 800×400px. Aspect ratio 2:1.

### 3.1 Premium Upgrade Banner

| Field | Value |
|-------|-------|
| Asset Name | `promo-premium` |
| Purpose | Encourage sellers to upgrade to premium listing |
| Used In | `app/(tabs)/home.tsx` inline promo slot, `app/premium/[adId].tsx` |
| Dimensions | 800×400px |
| Format | WebP |
| File Path | `assets/banners/promo-premium.webp` |

**Concept:** Premium/gold theme — star medal or badge on dark warm background suggesting exclusivity and promotion boost.

**AI Prompt:**
```
promotional banner, premium listing upgrade theme,
large golden star badge or medal in center-right,
dark warm charcoal background #2D2D2D with gold accents,
orange #FF6B35 and gold #FFB800 color scheme,
flat vector illustration style, upward arrow or rocket to suggest boost,
left half clear for text overlay, 2:1 aspect ratio,
modern marketplace premium feature banner, material design aesthetic
```

**Negative:**
```
--no photorealism, cold blue tones, busy background, 3D, gradients
```

---

### 3.2 Sell Now — New Listing CTA Banner

| Field | Value |
|-------|-------|
| Asset Name | `promo-sell-now` |
| Purpose | Encourage users to post their first listing |
| Used In | `app/(tabs)/home.tsx` — shown to users with 0 listings |
| Dimensions | 800×400px |
| Format | WebP |
| File Path | `assets/banners/promo-sell-now.webp` |

**Concept:** Positive action scene — open box or items being listed, warm encouraging tone.

**AI Prompt:**
```
promotional banner, sell items marketplace theme,
flat illustration of open cardboard box with items spilling out
(phone, sneaker, book), warm orange background #FF6B35,
white accent elements, friendly inviting composition,
items arranged right side, left clear for text,
2:1 aspect ratio, flat 2D vector art style,
modern Android marketplace app banner, energetic and warm
```

**Negative:**
```
--no photorealism, dark tones, complex detail, 3D, shadows, text
```

---

### 3.3 Featured Listing Banner

| Field | Value |
|-------|-------|
| Asset Name | `promo-featured` |
| Purpose | Explain "Featured Listing" premium tier benefit |
| Used In | `app/premium/[adId].tsx` — tier description card |
| Dimensions | 800×400px |
| Format | WebP |
| File Path | `assets/banners/promo-featured.webp` |

**Concept:** Spotlight effect — single item highlighted/spotlit, surrounded by dimmed other items to show prominence.

**AI Prompt:**
```
promotional banner, featured listing spotlight theme,
one item card in center glowing brighter than surrounding dimmed cards,
spotlight beam from top, warm gold #FFB800 highlight,
dark subtle background with product cards arranged in grid,
flat 2D vector illustration, 2:1 aspect ratio,
premium marketplace featured position concept banner
```

**Negative:**
```
--no photorealism, cold tones, complex textures, 3D effects, text
```

---

### 3.4 New User Welcome Banner

| Field | Value |
|-------|-------|
| Asset Name | `promo-new-user` |
| Purpose | Welcome banner shown to users on first sign-in |
| Used In | `app/auth/` post-registration flow or home first visit |
| Dimensions | 800×400px |
| Format | WebP |
| File Path | `assets/banners/promo-new-user.webp` |

**Concept:** Welcoming marketplace arrival — friendly handshake or open door illustration with warm tones.

**AI Prompt:**
```
welcome banner, new user onboarding theme, marketplace greeting,
friendly open hands gesture or handshake symbol,
orange gradient background #FF6B35 to #FFEAA7,
flat 2D vector illustration, warm friendly tone,
abstract city or market in background (minimal),
left half clear for text, 2:1 aspect ratio,
modern Android marketplace welcome banner, material design style
```

**Negative:**
```
--no photorealism, dark tones, complex people faces, 3D, text overlays
```

---

## 4. Listing Placeholder Images

Used when an ad has no images or images fail to load.

### 4.1 Generic Ad Placeholder

| Field | Value |
|-------|-------|
| Asset Name | `ad-placeholder` |
| Purpose | Fallback when listing has no uploaded photos |
| Used In | `src/components/AdCard.tsx`, `src/components/AdImageCarousel.tsx` |
| Dimensions | 400×400px |
| Format | WebP |
| File Path | `assets/images/placeholders/ad-placeholder.webp` |

**AI Prompt:**
```
product placeholder image, clean minimal composition,
soft gray background #F7F8FA, simple shopping bag outline
centered in frame, subtle and unobtrusive,
flat 2D vector style, no text, no color, 1:1 square aspect ratio,
used as fallback when no product photo available,
neutral minimal design for marketplace app
```

---

### 4.2 Avatar Placeholder

| Field | Value |
|-------|-------|
| Asset Name | `avatar-placeholder` |
| Purpose | Default user avatar when no profile photo set |
| Used In | `src/components/ChatListItem.tsx`, `src/components/SellerCard.tsx` |
| Dimensions | 200×200px |
| Format | WebP (circle-crop in app) |
| File Path | `assets/images/placeholders/avatar-placeholder.webp` |

**AI Prompt:**
```
user avatar placeholder, neutral person silhouette,
head circle above rounded shoulder arc,
light gray background #EBEBEB, medium gray silhouette #B0B0B0,
1:1 square aspect ratio centered, flat 2D vector,
no face details, minimal generic person symbol,
clean modern app avatar placeholder
```

---

## Export Checklist

- [ ] `home-hero-default.webp` — 1200×375px
- [ ] `home-hero-electronics.webp` — 1200×375px
- [ ] `home-hero-vehicles.webp` — 1200×375px
- [ ] `promo-premium.webp` — 800×400px
- [ ] `promo-sell-now.webp` — 800×400px
- [ ] `promo-featured.webp` — 800×400px
- [ ] `promo-new-user.webp` — 800×400px
- [ ] `ad-placeholder.webp` — 400×400px
- [ ] `avatar-placeholder.webp` — 200×200px
- [ ] `spotlight-frame.svg` — 200×240px
