# Bilu Store — Visual Assets Overview

> **Platform:** Android only  
> **App Type:** Local classified marketplace  
> **Design Language:** Material Design 3 · Flat vector · Warm orange accent  
> **Primary Accent:** `#FF6B35`

---

## Quick Reference

| Doc | Contents |
|-----|----------|
| [`icons.md`](icons.md) | App icon, adaptive icon, nav icons, category icons, feature icons |
| [`banners.md`](banners.md) | Hero banners, promo banners, listing placeholders |
| [`illustrations.md`](illustrations.md) | Empty states, onboarding, error screens |
| [`svg-assets.md`](svg-assets.md) | Badges, overlays, UI decorations, wordmark |

---

## Design System Foundation

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ACCENT` | `#FF6B35` | Primary CTA, active states, splash background |
| `ACCENT_LIGHT` | `#FFF0E8` | Icon backgrounds, light tints |
| `ACCENT_DARK` | `#E55A2B` | Pressed/hover state |
| `PREMIUM_GOLD` | `#FFB800` | Premium badges, star ratings |
| `BG_SCREEN` | `#F7F8FA` | App background |
| `BG_CARD` | `#FFFFFF` | Card surfaces |
| `TEXT_DARK` | `#1A1A2E` | Primary text |
| `TEXT_MUTED` | `#6A6A7A` | Secondary text, empty states |
| `SUCCESS_GREEN` | `#4CAF50` | Active status, success toasts |
| `ERROR_RED` | `#F44336` | Error states, favorites (filled) |
| `WARNING_AMBER` | `#FF9800` | Pending status, warning toasts |
| `INFO_BLUE` | `#2196F3` | Info toasts, sold status |

### Category Accent Colors

| Category | Hex |
|----------|-----|
| Electronics | `#4ECDC4` |
| Vehicles | `#45B7D1` |
| Real Estate | `#96CEB4` |
| Fashion | `#DDA0DD` |
| Home & Furniture | `#FFEAA7` |
| Jobs | `#74B9FF` |
| Services | `#A29BFE` |
| Education | `#FD79A8` |
| Sports | `#00B894` |
| Other | `#B0B0B0` |

### Typography Scale

| Token | Size | Usage |
|-------|------|-------|
| XS | 11px | Badge counts, captions |
| SM | 13px | Secondary labels |
| MD | 15px | Body text, buttons |
| LG | 17px | Section headers |
| XL | 22px | Screen titles |
| XXL | 28px | Large headings |
| PRICE | 24px | Price display |
| DISPLAY | 32px | Hero text |

---

## Complete Asset Inventory

### App Branding (3 assets)

| Asset | Format | Dimensions | Status |
|-------|--------|------------|--------|
| App launcher icon | PNG | 1024×1024px | Exists (needs review) |
| Splash screen icon | PNG | 200×200px | Exists (needs review) |
| Logo wordmark | SVG | 200×48px | Missing |
| Adaptive icon (foreground) | PNG | 108×108dp | Needs creating |

---

### Navigation Icons (10 assets)

| Asset | Format | Dimensions |
|-------|--------|------------|
| Home (outline + filled) | SVG | 24×24dp |
| Search (outline + filled) | SVG | 24×24dp |
| Post / Add (center button) | SVG | 24×24dp |
| Chat (outline + filled) | SVG | 24×24dp |
| Profile (outline + filled) | SVG | 24×24dp |

---

### Category Icons (10 assets)

| Asset | Background | Format | Dimensions |
|-------|-----------|--------|------------|
| Electronics | `#4ECDC4` | SVG | 28×28dp |
| Vehicles | `#45B7D1` | SVG | 28×28dp |
| Real Estate | `#96CEB4` | SVG | 28×28dp |
| Fashion | `#DDA0DD` | SVG | 28×28dp |
| Home & Furniture | `#FFEAA7` | SVG | 28×28dp |
| Jobs | `#74B9FF` | SVG | 28×28dp |
| Services | `#A29BFE` | SVG | 28×28dp |
| Education | `#FD79A8` | SVG | 28×28dp |
| Sports | `#00B894` | SVG | 28×28dp |
| Other | `#B0B0B0` | SVG | 28×28dp |

---

### Feature & Action Icons (12 assets)

| Asset | Format | Dimensions |
|-------|--------|------------|
| Favorite (outline) | SVG | 24dp |
| Favorite (filled / red) | SVG | 24dp |
| Premium Star | SVG | 16dp |
| Camera | SVG | 24dp |
| Location Pin | SVG | 16dp |
| Share | SVG | 24dp |
| Filter | SVG | 20dp |
| Sort | SVG | 20dp |
| Edit / Pencil | SVG | 20dp |
| Delete / Trash | SVG | 20dp |
| Time / Clock | SVG | 14dp |
| Chevron Right | SVG | 16dp |

---

### Status & Feedback Icons (4 assets)

| Asset | Color | Format | Dimensions |
|-------|-------|--------|------------|
| Success checkmark circle | `#4CAF50` | SVG | 24dp |
| Error alert circle | `#F44336` | SVG | 24dp |
| Warning triangle | `#FF9800` | SVG | 24dp |
| Info circle | `#2196F3` | SVG | 24dp |

---

### Empty State Illustrations (6 assets)

| Asset | Screen | Format | Dimensions |
|-------|--------|--------|------------|
| Empty search | Search results | SVG | 280×200px |
| Empty favorites | Favorites screen | SVG | 280×200px |
| Empty chat | Chat list | SVG | 280×200px |
| Empty listings | My ads / Seller | SVG | 280×200px |
| Empty category | Category browse | SVG | 280×200px |
| Empty notifications | Notifications | SVG | 200×200px |

---

### Onboarding Illustrations (3 assets)

| Asset | Step | Format | Dimensions |
|-------|------|--------|------------|
| Onboarding — Search/Discover | Step 1 | SVG | 240×200px |
| Onboarding — Sell/List | Step 2 | SVG | 240×200px |
| Onboarding — Chat/Connect | Step 3 | SVG | 240×200px |

---

### Error Screen Illustrations (3 assets)

| Asset | Trigger | Format | Dimensions |
|-------|---------|--------|------------|
| Network error | No internet / Firebase unreachable | SVG | 280×220px |
| 404 Not found | Invalid route `app/+not-found.tsx` | SVG | 280×220px |
| Generic error | `ErrorBoundary`, `ErrorFallback` | SVG | 280×220px |

---

### Banners (9 assets)

| Asset | Usage | Format | Dimensions |
|-------|-------|--------|------------|
| Home hero — Default | Home carousel slide 1 | WebP | 1200×375px |
| Home hero — Electronics | Home carousel slide 2 | WebP | 1200×375px |
| Home hero — Vehicles | Home carousel slide 3 | WebP | 1200×375px |
| Promo — Premium upgrade | Premium upsell slot | WebP | 800×400px |
| Promo — Sell now | New user CTA | WebP | 800×400px |
| Promo — Featured listing | Premium tier description | WebP | 800×400px |
| Promo — New user welcome | Post-registration | WebP | 800×400px |
| Ad placeholder | No-image ad fallback | WebP | 400×400px |
| Avatar placeholder | No-photo user fallback | WebP | 200×200px |

---

### Badge & Overlay SVGs (8 assets)

| Asset | Usage | Format | Dimensions |
|-------|-------|--------|------------|
| Premium badge | Ad card overlay | SVG | dynamic × 20px |
| Spotlight frame | Homepage carousel frame | SVG | 200×240px |
| Add photo tile | ImagePicker placeholder | SVG | 100×100px |
| Logo wordmark | Drawer header, About screen | SVG | 200×48px |
| Premium Featured bg | Tier card decoration | SVG | 320×120px |
| Top Search badge | Premium tier badge | SVG | 80×24px |
| Spotlight badge | Premium tier badge | SVG | 80×24px |
| Splash screen source | Splash PNG source | SVG | 200×200px |

---

## Full Asset Count

| Category | Count |
|----------|-------|
| App branding | 4 |
| Navigation icons | 10 |
| Category icons | 10 |
| Feature & action icons | 12 |
| Status icons | 4 |
| Empty state illustrations | 6 |
| Onboarding illustrations | 3 |
| Error illustrations | 3 |
| Banners & placeholders | 9 |
| Badge & overlay SVGs | 8 |
| **Total** | **69** |

---

## File Structure

```
assets/
├── images/
│   ├── icon.png                           # App launcher (existing)
│   ├── splash-icon.png                    # Splash screen (existing)
│   ├── splash-icon.svg                    # Splash source (create)
│   ├── adaptive-icon-fg.png               # Android adaptive fg (create)
│   ├── logo-wordmark.svg                  # Brand lockup (create)
│   └── placeholders/
│       ├── ad-placeholder.webp
│       └── avatar-placeholder.webp
├── icons/
│   ├── nav/
│   │   ├── home.svg
│   │   ├── home-filled.svg
│   │   ├── search.svg
│   │   ├── search-filled.svg
│   │   ├── post.svg
│   │   ├── chat.svg
│   │   ├── chat-filled.svg
│   │   ├── profile.svg
│   │   └── profile-filled.svg
│   ├── categories/
│   │   ├── electronics.svg
│   │   ├── vehicles.svg
│   │   ├── real-estate.svg
│   │   ├── fashion.svg
│   │   ├── home-furniture.svg
│   │   ├── jobs.svg
│   │   ├── services.svg
│   │   ├── education.svg
│   │   ├── sports.svg
│   │   └── other.svg
│   ├── features/
│   │   ├── favorite.svg
│   │   ├── favorite-filled.svg
│   │   ├── premium-star.svg
│   │   ├── camera.svg
│   │   ├── location.svg
│   │   ├── share.svg
│   │   ├── filter.svg
│   │   ├── sort.svg
│   │   ├── edit.svg
│   │   ├── delete.svg
│   │   ├── time.svg
│   │   ├── chevron-right.svg
│   │   ├── add-photo-tile.svg
│   │   ├── spotlight-frame.svg
│   │   ├── badge-premium.svg
│   │   └── premium-featured-bg.svg
│   ├── badges/
│   │   ├── condition-new.svg
│   │   ├── condition-like-new.svg
│   │   ├── condition-used-good.svg
│   │   ├── condition-used-fair.svg
│   │   ├── premium-topsearch.svg
│   │   └── premium-spotlight.svg
│   └── status/
│       ├── success.svg
│       ├── error.svg
│       ├── warning.svg
│       └── info.svg
├── illustrations/
│   ├── empty-states/
│   │   ├── empty-search.svg
│   │   ├── empty-favorites.svg
│   │   ├── empty-chat.svg
│   │   ├── empty-listings.svg
│   │   ├── empty-category.svg
│   │   └── empty-notifications.svg
│   ├── onboarding/
│   │   ├── onboarding-search.svg
│   │   ├── onboarding-sell.svg
│   │   └── onboarding-chat.svg
│   └── errors/
│       ├── error-network.svg
│       ├── error-404.svg
│       └── error-generic.svg
└── banners/
    ├── home-hero-default.webp
    ├── home-hero-electronics.webp
    ├── home-hero-vehicles.webp
    ├── promo-premium.webp
    ├── promo-sell-now.webp
    ├── promo-featured.webp
    └── promo-new-user.webp
```

---

## Design Principles

1. **Vector-first** — All icons and illustrations are SVG. Raster only for photos and banners.
2. **Outline style by default** — Icons use outline strokes in inactive states; filled on active.
3. **Rounded corners everywhere** — Cards 12px, buttons 10px, modals 20px top radius.
4. **Warm orange accent** — `#FF6B35` is the single primary action color.
5. **High contrast** — Text dark `#1A1A2E` on light `#F7F8FA` background.
6. **Category color coding** — Each category has its own dedicated color.
7. **Consistent icon sizing** — 16px (inline), 24px (nav/action), 32px (feature), 48px (empty state).
8. **Premium = Gold** — `#FFB800` is reserved exclusively for premium tier indicators.
9. **Friendly not corporate** — Rounded shapes, warm hues, no hard edges or cold grays.
10. **Performance** — SVGs < 5KB each; banners served as WebP; illustrations < 20KB.

---

## AI Generation Tools

| Asset Type | Recommended Tool |
|-----------|-----------------|
| Icons (SVG) | Recraft.ai, Midjourney + SVG trace |
| Illustrations (SVG) | Adobe Firefly, Midjourney, DALL-E 3 |
| Banners (WebP/PNG) | Midjourney, DALL-E 3, Adobe Firefly |
| App Icon | Midjourney + Figma refinement |

### Universal Style Prefix

Add this prefix to **every AI prompt** to maintain style consistency:

```
minimal flat vector graphic, material design 3 style, clean lines,
no gradients, no shadows, no textures, solid flat colors,
warm orange primary accent #FF6B35, friendly rounded shapes,
Android marketplace app aesthetic, 2D vector, white or light background,
modern UI graphic design
```

### Universal Negative Prompt

Add this to **every AI prompt**:

```
--no photorealism, 3D render, shading, drop shadows, textures, gradients,
serif fonts, cluttered design, neon colors, dark moody background,
low resolution, blurry edges, watermark
```

---

## Generation Workflow

```
1. Write prompt using spec in relevant doc (icons.md / banners.md / illustrations.md / svg-assets.md)
2. Add Universal Style Prefix + Universal Negative Prompt
3. Generate in AI tool at 2× target resolution
4. For SVGs: trace/clean in Figma, Inkscape, or Illustrator → export optimized SVG
5. For rasters: export as WebP with 80% quality
6. Run SVGO on all SVG outputs (svgo --recursive assets/)
7. Place in correct path per this file tree
8. Test in app on Android emulator
```
