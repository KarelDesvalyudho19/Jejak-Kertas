/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kertas: { DEFAULT: '#F4F1EA', terang: '#FBFAF6', gelap: '#E9E4D8' },
        tinta: { DEFAULT: '#161513', abu: '#6B675F', pudar: '#A39E93' },
        revisi: { DEFAULT: '#D33A2C', tua: '#B02E22', muda: '#F6DAD5' },
        kraft: { DEFAULT: '#C49A6C', muda: '#EADBC8', tua: '#8E6A43' },
        sukses: { DEFAULT: '#2F5D50', muda: '#D7E3DE' },
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        struk: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { rapat: '-0.025em' },
      boxShadow: {
        kertas: '0 1px 0 rgba(22,21,19,0.06), 0 8px 24px -12px rgba(22,21,19,0.18)',
        tumpuk: '3px 3px 0 #E9E4D8, 6px 6px 0 rgba(22,21,19,0.08)',
      },
    },
  },
  plugins: [],
};
