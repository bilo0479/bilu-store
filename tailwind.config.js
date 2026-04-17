/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './packages/shared/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B35',
          'primary-pressed': '#E4561E',
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
        pro: {
          bg: '#1A1A2E',
          surface: '#21213A',
          accent: '#D4AF37',
          'accent-soft': '#E8C76A',
          'text-primary': '#F5F6FA',
          'text-secondary': '#A5A9BE',
          line: '#2F2F52',
        },
      },
      borderRadius: {
        button: '8px',
        chip: '10px',
        card: '12px',
        sheet: '16px',
        fab: '9999px',
      },
    },
  },
  plugins: [],
};
