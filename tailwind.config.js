/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          base: '#09090B',
          surface: '#0D0D10',
          subsurface: '#131317',
          panel: '#18181E',
          hover: '#22222B',
          border: 'rgba(255, 255, 255, 0.07)',
          divider: 'rgba(255, 255, 255, 0.05)',
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
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Geist Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
