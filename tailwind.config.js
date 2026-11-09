/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        foreground: '#F4F4F6',
        card: {
          DEFAULT: '#0D0D10',
          foreground: '#F4F4F6',
        },
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#6366F1',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#9D4EDD',
          hover: '#C77DFF',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#58DB91',
          hover: '#88E788',
          accent: '#95CC52',
          foreground: '#09090B',
        },
        accent: {
          cyan: '#22D3EE',
          purple: '#C77DFF',
        },
        studio: {
          base: '#09090B',
          surface: '#0D0D10',
          subsurface: '#131317',
          panel: '#18181E',
          hover: '#22222B',
          border: 'rgba(255, 255, 255, 0.08)',
          divider: 'rgba(255, 255, 255, 0.06)',
          muted: '#8E8E9F',
          text: '#F4F4F6',
        },
        forge: {
          indigo: '#4F46E5',
          'indigo-light': '#6366F1',
          purple: '#9D4EDD',
          'purple-light': '#C77DFF',
          green: '#58DB91',
          'green-soft': '#88E788',
          'green-lime': '#95CC52',
          cyan: '#22D3EE',
        },
      },
      borderRadius: {
        lg: '0.625rem', // 10px - match QRCraft standard
        md: 'calc(0.625rem - 2px)',
        sm: 'calc(0.625rem - 4px)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Geist Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
