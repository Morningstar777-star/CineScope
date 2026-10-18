/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cine: {
          obsidian: '#06080c',
          bg: '#080b11',
          card: '#0e131f',
          surface: '#131927',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(244, 63, 94, 0.4)',
          accent: '#e11d48',
          accentHover: '#be123c',
          crimson: '#f43f5e',
          cyan: '#06b6d4',
          gold: '#f59e0b',
          emerald: '#10b981',
          muted: '#94a3b8',
          subtle: '#64748b',
          highlight: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-33.333%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
        float: 'float 5s ease-in-out infinite',
        pulseSlow: 'pulseSlow 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite linear',
      }
    },
  },
  plugins: [],
}
