// Design tokens — single source of truth for mobile (NativeWind) and admin web (Tailwind)
// All values match DESIGN.md §2. Never hardcode hex colors; import from here.

export const colors = {
  brand: {
    primary: '#FF6B35',
    primaryPressed: '#E4561E',
  },

  surface: {
    background: '#FFFFFF',
    raised: '#F7F8F9',
    line: '#E6E8EB',
  },

  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
  },

  semantic: {
    success: '#12B76A',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#2563EB',
  },

  overlay: {
    scrim: 'rgba(15,23,42,0.56)',
  },

  pro: {
    background: '#1A1A2E',
    surface: '#21213A',
    accent: '#D4AF37',
    accentSoft: '#E8C76A',
    textPrimary: '#F5F6FA',
    textSecondary: '#A5A9BE',
    line: '#2F2F52',
  },
} as const;

// 8-pt grid — any other value is a bug
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  button: 8,
  chip: 10,
  card: 12,
  sheet: 16,
  fab: 9999,
} as const;

export const typography = {
  display: { size: 28, lineHeight: 34 },
  h1:      { size: 22, lineHeight: 28 },
  h2:      { size: 18, lineHeight: 24 },
  body:    { size: 15, lineHeight: 22 },
  caption: { size: 13, lineHeight: 18 },
  micro:   { size: 11, lineHeight: 16 },
} as const;

export const elevation = {
  1: {
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  2: {
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  proGold: {
    shadowColor: '#D4AF37',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;
