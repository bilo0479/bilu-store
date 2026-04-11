import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#FF6B35',
          light: '#FFF0E8',
          dark: '#E55A2B',
        },
        bg: {
          screen: '#F7F8FA',
          card: '#FFFFFF',
          disabled: '#EBEBEB',
        },
        text: {
          dark: '#1A1A2E',
          muted: '#6A6A7A',
          'on-accent': '#FFFFFF',
        },
        status: {
          success: '#4CAF50',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
        },
        premium: {
          gold: '#FFB800',
        },
        star: {
          gold: '#FFC107',
          gray: '#E0E0E0',
        },
        border: {
          DEFAULT: '#E0E0E8',
        },
        divider: '#F0F0F5',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
