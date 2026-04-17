# Bilu Store — Icons Specification

> All icons are SVG, 24×24 viewBox unless noted.  
> Inactive state: outline stroke. Active state: filled solid.  
> Stroke width: 1.5px. Corner radius on strokes: round caps & joins.

---

## 1. App Launcher Icon

| Field | Value |
|-------|-------|
| Asset Name | `app-icon` |
| Purpose | Android home screen launcher icon |
| Used In | Android launcher, task switcher, notifications |
| Dimensions | 1024×1024px (source), 192×192px (xxxhdpi), adaptive layers |
| Format | PNG (launcher), SVG (source) |
| File Path | `assets/images/icon.png`, `assets/images/adaptive-icon-fg.png` |
| Android BG Color | `#FF6B35` |

**AI Prompt:**
```
modern marketplace app icon, abstract shopping bag with a location pin
integrated into the handle, orange #fd5e25 background, white foreground
graphic, rounded square shape, flat 2D vector, clean geometric design,
material design icon guidelines, no text, centered composition,
bold but minimal, friendly rounded corners
```

**Negative:**
```
--no photorealism, gradients, shadows, 3D, text labels, complex detail
```

---

## 2. Adaptive Icon — Foreground Layer

| Field | Value |
|-------|-------|
| Asset Name | `adaptive-icon-fg` |
| Purpose | Android 8+ adaptive icon foreground |
| Dimensions | 108×108dp safe zone (icon centered in 72×72dp) |
| Format | PNG (transparent background) |
| File Path | `assets/images/adaptive-icon-fg.png` |

**AI Prompt:**
```
shopping bag with location pin symbol, white vector graphic,
transparent background, centered in frame with generous padding,
flat 2D, no border, material design adaptive icon safe zone compliant,
simple geometric shapes, bold outline
```

---

## 3. Navigation Bar Icons

Navigation tab bar has 5 icons. Renders at 24×24dp. Inactive = `#6A6A7A`, Active = `#FF6B35`.

### 3.1 Home Icon

| Field | Value |
|-------|-------|
| Asset Name | `nav-home` |
| Used In | Bottom tab bar — first tab |
| States | `home-outline.svg` (inactive), `home.svg` (active/filled) |
| File Path | `assets/icons/nav/home.svg`, `assets/icons/nav/home-filled.svg` |

**AI Prompt:**
```
minimal home icon, simple house silhouette with a small chimney,
clean outline vector, 24x24 viewBox, 1.5px stroke weight,
round line caps, no fill (outline variant), single color,
material design navigation icon style, centered composition
```

---

### 3.2 Search Icon

| Field | Value |
|-------|-------|
| Asset Name | `nav-search` |
| Used In | Bottom tab bar — second tab |
| States | `search-outline.svg`, `search-filled.svg` |
| File Path | `assets/icons/nav/search.svg` |

**AI Prompt:**
```
minimal search/magnifier icon, circle with diagonal handle extending
bottom-right, clean outline stroke, 24x24, 1.5px stroke, round caps,
single path, material design style, no fill, centered
```

---

### 3.3 Post / Sell Icon

| Field | Value |
|-------|-------|
| Asset Name | `nav-post` |
| Purpose | Create new listing CTA — center tab (featured/larger) |
| Used In | Bottom tab bar — center tab, rendered in 52×52dp orange circle |
| States | Plus icon inside orange circle background |
| File Path | `assets/icons/nav/post.svg` |

**AI Prompt:**
```
plus / add icon, bold white plus sign, minimal vector,
thick 2.5px stroke, perfectly centered, round line caps,
24x24 viewBox, used inside orange circle button,
clean geometric, no decoration
```

---

### 3.4 Chat Icon

| Field | Value |
|-------|-------|
| Asset Name | `nav-chat` |
| Used In | Bottom tab bar — fourth tab |
| States | `chat-outline.svg`, `chat-filled.svg` |
| File Path | `assets/icons/nav/chat.svg` |

**AI Prompt:**
```
chat bubbles icon, two overlapping speech bubbles, larger bubble
top-left with smaller bubble bottom-right, clean outline vector,
1.5px stroke, round corners on bubbles, 24x24 viewBox,
material design style, no fill (outline variant)
```

---

### 3.5 Profile Icon

| Field | Value |
|-------|-------|
| Asset Name | `nav-profile` |
| Used In | Bottom tab bar — fifth tab |
| States | `profile-outline.svg`, `profile-filled.svg` |
| File Path | `assets/icons/nav/profile.svg` |

**AI Prompt:**
```
user profile icon, circle head shape with rounded shoulders/body arc
below, minimal outline vector, 1.5px stroke, round caps,
24x24 viewBox, single color, clean geometric person silhouette,
no details, material design navigation icon
```

---

## 4. Category Icons

Each category icon renders at 28×28dp inside a 52×52dp colored circle background.  
Colors defined in `src/constants/categories.ts`.

### 4.1 Electronics

| Field | Value |
|-------|-------|
| Asset Name | `cat-electronics` |
| Background Color | `#4ECDC4` (teal) |
| File Path | `assets/icons/categories/electronics.svg` |

**AI Prompt:**
```
electronics category icon, simple smartphone silhouette viewed from front,
rounded rectangle with small speaker slot and home indicator,
flat vector outline, 28x28 viewBox, 1.5px stroke, round line caps,
teal color scheme, no shading, clean minimal design,
marketplace category icon style
```

---

### 4.2 Vehicles

| Field | Value |
|-------|-------|
| Asset Name | `cat-vehicles` |
| Background Color | `#45B7D1` (sky blue) |
| File Path | `assets/icons/categories/vehicles.svg` |

**AI Prompt:**
```
vehicle/car category icon, simple side-view car silhouette,
rounded body with two visible wheels, minimal outline,
flat 2D vector, 28x28 viewBox, 1.5px stroke, round line caps,
sky blue color, no windows detail, clean geometric shape,
marketplace category icon
```

---

### 4.3 Real Estate

| Field | Value |
|-------|-------|
| Asset Name | `cat-real-estate` |
| Background Color | `#96CEB4` (sage green) |
| File Path | `assets/icons/categories/real-estate.svg` |

**AI Prompt:**
```
real estate / home icon, simple house outline with triangular roof,
door in center bottom, minimal flat vector, 28x28 viewBox,
1.5px stroke, round caps, sage green color, no windows,
clean geometric house symbol, marketplace category icon
```

---

### 4.4 Fashion

| Field | Value |
|-------|-------|
| Asset Name | `cat-fashion` |
| Background Color | `#DDA0DD` (plum) |
| File Path | `assets/icons/categories/fashion.svg` |

**AI Prompt:**
```
fashion / clothing icon, simple t-shirt or dress outline,
short sleeves visible, clean geometric silhouette,
flat vector outline, 28x28 viewBox, 1.5px stroke, round caps,
plum/purple color, minimal no detail, marketplace category icon
```

---

### 4.5 Home & Furniture

| Field | Value |
|-------|-------|
| Asset Name | `cat-home-furniture` |
| Background Color | `#FFEAA7` (warm yellow) |
| File Path | `assets/icons/categories/home-furniture.svg` |

**AI Prompt:**
```
furniture / sofa icon, simple side-view couch with two cushions
and armrests, minimal flat vector outline, 28x28 viewBox,
1.5px stroke, round caps, warm yellow color, no details,
clean geometric furniture symbol, marketplace category icon
```

---

### 4.6 Jobs

| Field | Value |
|-------|-------|
| Asset Name | `cat-jobs` |
| Background Color | `#74B9FF` (cornflower blue) |
| File Path | `assets/icons/categories/jobs.svg` |

**AI Prompt:**
```
jobs / briefcase icon, simple rectangle briefcase with handle arc
on top and center clasp line, minimal outline vector,
28x28 viewBox, 1.5px stroke, round caps, cornflower blue color,
professional minimal design, marketplace category icon
```

---

### 4.7 Services

| Field | Value |
|-------|-------|
| Asset Name | `cat-services` |
| Background Color | `#A29BFE` (lavender) |
| File Path | `assets/icons/categories/services.svg` |

**AI Prompt:**
```
services / tools icon, simple wrench or gear symbol,
minimal single-path outline vector, 28x28 viewBox,
1.5px stroke, round caps, lavender purple color,
clean geometric tool shape, marketplace category icon
```

---

### 4.8 Education

| Field | Value |
|-------|-------|
| Asset Name | `cat-education` |
| Background Color | `#FD79A8` (pink) |
| File Path | `assets/icons/categories/education.svg` |

**AI Prompt:**
```
education / school icon, simple graduation cap mortar board symbol,
flat square top with tassel hanging, minimal outline vector,
28x28 viewBox, 1.5px stroke, round caps, hot pink color,
clean geometric academic symbol, marketplace category icon
```

---

### 4.9 Sports

| Field | Value |
|-------|-------|
| Asset Name | `cat-sports` |
| Background Color | `#00B894` (emerald) |
| File Path | `assets/icons/categories/sports.svg` |

**AI Prompt:**
```
sports icon, simple dumbbell or football outline,
bold geometric shape, minimal flat vector, 28x28 viewBox,
1.5px stroke, round caps, emerald green color,
no detail, clean single silhouette, marketplace category icon
```

---

### 4.10 Other / General

| Field | Value |
|-------|-------|
| Asset Name | `cat-other` |
| Background Color | `#B0B0B0` (gray) |
| File Path | `assets/icons/categories/other.svg` |

**AI Prompt:**
```
general / other category icon, simple 3x3 grid of dots or squares,
apps grid symbol, minimal outline vector, 28x28 viewBox,
1.5px stroke, round caps, medium gray color,
clean geometric grid pattern, marketplace category icon
```

---

## 5. Feature & Action Icons

These render at 20–24dp in cards, buttons, and action rows.

| # | Name | Size | File Path | AI Prompt |
|---|------|------|-----------|-----------|
| 1 | Favorite (outline) | 24dp | `assets/icons/features/favorite.svg` | `heart outline icon, clean outline vector, 1.5px stroke, round caps, 24x24 viewBox, single path, no fill` |
| 2 | Favorite (filled) | 24dp | `assets/icons/features/favorite-filled.svg` | `heart filled icon, solid filled heart shape, 24x24 viewBox, error red #F44336, no stroke, flat 2D` |
| 3 | Premium Star | 16dp | `assets/icons/features/premium-star.svg` | `5-point star icon filled, bold solid star, 16x16 viewBox, gold #FFB800, no stroke, perfect symmetry` |
| 4 | Camera | 24dp | `assets/icons/features/camera.svg` | `camera icon outline, rounded rectangle body with lens circle, outline vector, 1.5px stroke, 24x24` |
| 5 | Location Pin | 16dp | `assets/icons/features/location.svg` | `location pin icon, teardrop shape with dot center, outline vector, 1.5px stroke, 16x16 viewBox` |
| 6 | Share | 24dp | `assets/icons/features/share.svg` | `share / export icon, box with arrow pointing up-right, outline vector, 1.5px stroke, 24x24` |
| 7 | Filter | 20dp | `assets/icons/features/filter.svg` | `filter icon, three horizontal lines decreasing in width (funnel style), outline vector, 1.5px stroke, 20x20` |
| 8 | Sort | 20dp | `assets/icons/features/sort.svg` | `sort icon, two arrows one pointing up one down stacked, outline vector, 1.5px stroke, 20x20` |
| 9 | Edit / Pencil | 20dp | `assets/icons/features/edit.svg` | `pencil edit icon, diagonal pencil shape with flat eraser top, outline vector, 1.5px stroke, 20x20` |
| 10 | Delete / Trash | 20dp | `assets/icons/features/delete.svg` | `trash delete icon, bin rectangle with lid arc and three vertical lines inside, outline, 1.5px, 20x20` |
| 11 | Time / Clock | 14dp | `assets/icons/features/time.svg` | `clock icon, circle with hour and minute hands at 3 o'clock, minimal outline, 1.5px stroke, 14x14` |
| 12 | Chevron Right | 16dp | `assets/icons/features/chevron-right.svg` | `chevron right arrow, single right-pointing V stroke, 1.5px stroke, round caps, 16x16 viewBox` |

---

## 6. Status & Feedback Icons

Rendered at 20–24dp inside toast notifications and status badges.

| # | Name | Color | File Path | AI Prompt |
|---|------|-------|-----------|-----------|
| 1 | Success | `#4CAF50` | `assets/icons/status/success.svg` | `checkmark circle icon, circle with bold checkmark inside, filled green, 24x24, flat vector, no outline stroke` |
| 2 | Error | `#F44336` | `assets/icons/status/error.svg` | `alert circle icon, circle with exclamation mark inside, filled red, 24x24, flat vector, bold exclamation` |
| 3 | Warning | `#FF9800` | `assets/icons/status/warning.svg` | `warning triangle icon, equilateral triangle outline with exclamation inside, filled amber, 24x24, flat vector` |
| 4 | Info | `#2196F3` | `assets/icons/status/info.svg` | `info circle icon, circle with lowercase i letter inside, filled blue, 24x24, flat vector, clean geometric` |

---

## Icon Export Specifications

```
SVG export settings:
- ViewBox: matches dp dimensions (e.g., 0 0 24 24)
- Stroke: currentColor (so React Native can tint)
- Fill: none (outline) or currentColor (filled)
- No embedded fonts or images
- No transforms on root element
- Clean path data, optimized with SVGO
```
