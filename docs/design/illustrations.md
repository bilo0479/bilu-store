# Bilu Store — Illustrations Specification

> Illustrations are SVG vector graphics used for empty states, onboarding, and error screens.  
> Style: Flat 2D, friendly characters optional (abstract preferred), warm palette.  
> ViewBox: 280×200 for horizontal, 200×200 for square, 240×300 for tall vertical.

---

## Illustration Design System

### Shared Style Rules

- **Line weight**: 2px stroke on any outlines
- **Corner radius**: All rectangular elements get 8px+ radius — nothing sharp
- **Color palette**: Pull from brand tokens; accent at `#FF6B35`, backgrounds at `#FFF0E8`
- **Character style**: If humans are shown — simple round heads, no facial detail, single-color fills
- **Composition**: Centered subject with supporting micro-elements (dots, lines, shapes) as decoration
- **White space**: Generous padding around main illustration

### Illustration Sizes

| Usage | ViewBox | Max render size |
|-------|---------|----------------|
| Empty state (large) | 280×200 | 200dp wide |
| Empty state (small) | 160×160 | 120dp wide |
| Onboarding (full) | 300×260 | 280dp wide |
| Error screen | 280×220 | 240dp wide |
| Inline info card | 160×120 | 140dp wide |

---

## 1. Empty State Illustrations

The `EmptyState` component renders:
- Icon circle (80×80dp, `DIVIDER` background `#F0F0F5`)
- **OR** an illustration (if provided)
- Title text
- Subtitle text
- Optional action button

Currently the component uses Ionicons. These illustrations replace/enhance the icon for key empty states.

---

### 1.1 Empty Search Results

| Field | Value |
|-------|-------|
| Asset Name | `empty-search` |
| Purpose | Shown when search query returns 0 results |
| Used In | `app/search-results.tsx`, `app/(tabs)/search.tsx` |
| Dimensions | 280×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/empty-states/empty-search.svg` |

**Concept:** Magnifier looking at empty space or a question mark. Gentle confusion without negativity.

**AI Prompt:**
```
empty search results illustration, flat vector SVG,
large magnifier glass in center with a small question mark
or sad face inside the lens, surrounded by tiny floating dots,
warm light background #FFF0E8, orange accent #FF6B35 on magnifier handle,
muted gray lens, simple geometric shapes,
friendly minimal 2D vector, no text, 280x200 composition,
marketplace app empty state illustration, material design inspired
```

**Negative:**
```
--no photorealism, complex scene, dark colors, text labels, 3D
```

---

### 1.2 Empty Favorites

| Field | Value |
|-------|-------|
| Asset Name | `empty-favorites` |
| Purpose | Shown when user has no saved favorites |
| Used In | `app/favorites.tsx` |
| Dimensions | 280×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/empty-states/empty-favorites.svg` |

**Concept:** Heart outline with small items floating around it, suggesting items waiting to be saved.

**AI Prompt:**
```
empty favorites illustration, flat vector SVG,
large outlined heart in center, light orange tint #FFF0E8 fill,
orange #FF6B35 stroke outline, small floating product shapes
around it (phone, sneaker, box) as tiny silhouettes,
simple minimal composition, warm palette, no text,
280x200 SVG viewBox, friendly marketplace app empty state,
material design flat illustration style
```

**Negative:**
```
--no photorealism, dark palette, complex faces, 3D, text
```

---

### 1.3 Empty Chat / No Messages

| Field | Value |
|-------|-------|
| Asset Name | `empty-chat` |
| Purpose | Shown in chat list when user has no conversations |
| Used In | `app/(tabs)/chat.tsx` |
| Dimensions | 280×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/empty-states/empty-chat.svg` |

**Concept:** Two empty speech bubbles facing each other — conveying silence, readiness to start a conversation.

**AI Prompt:**
```
empty chat illustration, flat vector SVG,
two speech bubbles facing each other, larger bubble left
and smaller bubble right, both empty with dotted outlines,
light teal tint on bubbles, orange accent on bubble tails,
soft light background, floating small dots as decoration,
minimal friendly composition, no text, 280x200 SVG,
marketplace chat empty state, material design style
```

**Negative:**
```
--no photorealism, faces, 3D, shadows, text inside bubbles
```

---

### 1.4 Empty My Listings

| Field | Value |
|-------|-------|
| Asset Name | `empty-listings` |
| Purpose | Shown when user has posted no ads |
| Used In | `app/my-ads.tsx`, `app/seller/[sellerId].tsx` |
| Dimensions | 280×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/empty-states/empty-listings.svg` |

**Concept:** Open empty box or empty shelf — suggesting space waiting to be filled with listings.

**AI Prompt:**
```
empty listings illustration, flat vector SVG,
open cardboard box in center viewed from slight top angle,
empty interior visible, small plus sign or arrow floating above,
orange #FF6B35 box flaps, warm light beige background,
friendly minimal composition, no items inside box,
tiny sparkle decorations around box, no text, 280x200 SVG,
marketplace sell items empty state illustration
```

**Negative:**
```
--no photorealism, dark tones, complex scene, 3D, shadows, text
```

---

### 1.5 Empty Category Results

| Field | Value |
|-------|-------|
| Asset Name | `empty-category` |
| Purpose | Shown when a category has no active listings |
| Used In | `app/category/[categoryId].tsx` |
| Dimensions | 280×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/empty-states/empty-category.svg` |

**Concept:** Simple grid of empty card outlines — suggesting where listings would appear.

**AI Prompt:**
```
empty category results illustration, flat vector SVG,
2x2 grid of empty listing card outlines with dotted borders,
small image placeholder icon and line shapes inside each card,
light gray dashed borders, warm light background #F7F8FA,
orange #FF6B35 accent on one card corner or star,
clean minimal composition, no text, 280x200 SVG,
marketplace browse category empty state
```

**Negative:**
```
--no photorealism, 3D, complex detail, dark colors, text
```

---

### 1.6 Empty Notifications

| Field | Value |
|-------|-------|
| Asset Name | `empty-notifications` |
| Purpose | Shown when user has no notifications |
| Used In | Future notifications screen |
| Dimensions | 200×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/empty-states/empty-notifications.svg` |

**Concept:** Bell with a peaceful "zzz" or checkmark — all quiet, nothing to see here.

**AI Prompt:**
```
empty notifications illustration, flat vector SVG,
large bell icon in center, orange #FF6B35 bell body,
small Z Z floating from top right to suggest silence or sleep,
white or light beige background, simple minimal composition,
friendly calm feeling, no text, 200x200 SVG viewBox,
marketplace app notifications empty state
```

**Negative:**
```
--no photorealism, red alarm colors, urgent feeling, 3D, text
```

---

## 2. Onboarding Illustrations

Used in `OnboardingOverlay.tsx` — 3-step coach mark shown on first app launch.  
Renders at ~160dp wide inside a centered modal card.  
Currently uses Ionicons — these illustrations add visual richness.

---

### 2.1 Onboarding — Search / Discover

| Field | Value |
|-------|-------|
| Asset Name | `onboarding-search` |
| Purpose | Step 1: "Find anything in your city" |
| Used In | `src/components/OnboardingOverlay.tsx` — step index 0 |
| Dimensions | 240×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/onboarding/onboarding-search.svg` |

**Concept:** City skyline (simple shapes) with a search circle floating over it, suggesting local discovery.

**AI Prompt:**
```
onboarding step 1 illustration, discover local marketplace theme,
flat 2D vector SVG, simple city skyline silhouette at bottom
(3-4 rectangular buildings with rounded tops),
large magnifying glass hovering above with orange #FF6B35 handle,
warm light sky background #FFF0E8 gradient to white at top,
small location pin dots on buildings, friendly minimal,
no text, 240x200 SVG viewBox, material design onboarding illustration
```

**Negative:**
```
--no photorealism, complex architecture, dark sky, 3D, text
```

---

### 2.2 Onboarding — Sell / List Item

| Field | Value |
|-------|-------|
| Asset Name | `onboarding-sell` |
| Purpose | Step 2: "Sell something in 60 seconds" |
| Used In | `src/components/OnboardingOverlay.tsx` — step index 1 |
| Dimensions | 240×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/onboarding/onboarding-sell.svg` |

**Concept:** Phone screen with a camera snap gesture and a listing being created — quick and easy.

**AI Prompt:**
```
onboarding step 2 illustration, quick sell listing theme,
flat 2D vector SVG, smartphone in center showing a listing form,
camera snap circle in top-right corner with flash indication,
orange #FF6B35 accent on phone frame and camera shutter,
small coins or tags floating around phone suggesting value,
warm light background, minimal friendly composition,
no text, 240x200 SVG, material design onboarding illustration
```

**Negative:**
```
--no photorealism, complex UI on phone, 3D, dark tones, text
```

---

### 2.3 Onboarding — Chat / Connect

| Field | Value |
|-------|-------|
| Asset Name | `onboarding-chat` |
| Purpose | Step 3: "Chat directly with sellers" |
| Used In | `src/components/OnboardingOverlay.tsx` — step index 2 |
| Dimensions | 240×200px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/onboarding/onboarding-chat.svg` |

**Concept:** Two people (abstract circles/silhouettes) exchanging messages — community and trust.

**AI Prompt:**
```
onboarding step 3 illustration, direct chat messaging theme,
flat 2D vector SVG, two abstract round-head figures on either side,
speech bubbles between them with simple shape content (smile, checkmark),
orange #FF6B35 accent on one figure, teal #4ECDC4 on other,
light warm background, connecting line between figures,
no text labels, minimal friendly composition, 240x200 SVG,
material design onboarding illustration, community feeling
```

**Negative:**
```
--no photorealism, detailed faces, dark colors, 3D, text, complex scene
```

---

## 3. Error Screen Illustrations

Used on error pages and the `ErrorFallback` component.

---

### 3.1 Network Error

| Field | Value |
|-------|-------|
| Asset Name | `error-network` |
| Purpose | Shown when app cannot reach the internet or Firebase |
| Used In | `src/components/ErrorFallback.tsx`, network error handlers |
| Dimensions | 280×220px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/errors/error-network.svg` |

**AI Prompt:**
```
network error illustration, flat 2D vector SVG,
broken WiFi signal icon in center — arc waves with an X or break
in the middle, muted gray color scheme with orange #FF6B35 on the X,
disconnected plug or broken chain link below,
light warm background #FFF0E8, simple minimal composition,
friendly not scary, no text, 280x220 SVG,
mobile app network error empty state
```

**Negative:**
```
--no photorealism, alarming red scene, complex technical symbols, 3D, text
```

---

### 3.2 Page Not Found (404)

| Field | Value |
|-------|-------|
| Asset Name | `error-404` |
| Purpose | Shown on `app/+not-found.tsx` |
| Used In | `app/+not-found.tsx` |
| Dimensions | 280×220px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/errors/error-404.svg` |

**AI Prompt:**
```
404 not found illustration, flat 2D vector SVG,
large question mark shape in center, confused or searching figure
(abstract round head with eyes looking around),
small floating map pins or compass around it suggesting lost direction,
warm muted palette, light orange #FFF0E8 background,
orange #FF6B35 accent on question mark, no text,
280x220 SVG, mobile app 404 page illustration, friendly style
```

**Negative:**
```
--no photorealism, dark tones, scary design, 3D, text labels
```

---

### 3.3 Generic App Error

| Field | Value |
|-------|-------|
| Asset Name | `error-generic` |
| Purpose | Fallback for unknown crashes or error boundaries |
| Used In | `src/components/ErrorBoundary.tsx`, `src/components/ErrorFallback.tsx` |
| Dimensions | 280×220px viewBox |
| Format | SVG |
| File Path | `assets/illustrations/errors/error-generic.svg` |

**AI Prompt:**
```
app error illustration, flat 2D vector SVG,
simple robot or phone character with an X or sad expression,
broken gear or wrench symbol beside it, warm muted palette,
light gray background with orange #FF6B35 accent on the gear,
friendly and reassuring not alarming, small sparkles or hearts
suggesting it will be fixed, no text, 280x220 SVG,
mobile app error state illustration, material design style
```

**Negative:**
```
--no photorealism, alarming red, complex machinery, 3D, text, scary faces
```

---

## Export Checklist

### Empty States
- [ ] `empty-search.svg` — 280×200px
- [ ] `empty-favorites.svg` — 280×200px
- [ ] `empty-chat.svg` — 280×200px
- [ ] `empty-listings.svg` — 280×200px
- [ ] `empty-category.svg` — 280×200px
- [ ] `empty-notifications.svg` — 200×200px

### Onboarding
- [ ] `onboarding-search.svg` — 240×200px
- [ ] `onboarding-sell.svg` — 240×200px
- [ ] `onboarding-chat.svg` — 240×200px

### Errors
- [ ] `error-network.svg` — 280×220px
- [ ] `error-404.svg` — 280×220px
- [ ] `error-generic.svg` — 280×220px

---

## Integration Notes

When adding an illustration to `EmptyState.tsx`, extend the component to accept an `illustration` prop:

```tsx
// Current usage (icon only):
<EmptyState
  icon="search-outline"
  title="No results found"
  subtitle="Try a different search term"
/>

// With illustration:
<EmptyState
  illustration={require('../../assets/illustrations/empty-states/empty-search.svg')}
  title="No results found"
  subtitle="Try a different search term"
/>
```

Use `react-native-svg` with `SvgUri` or `SvgXml` for rendering SVGs in React Native/Expo.
