/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060A0C',
        surface: {
          DEFAULT: '#0C1215',
          2: '#111A1E',
        },
        border: {
          DEFAULT: '#1F2A2F',
          strong: '#2B3A40',
        },
        text: '#F3F6F7',
        muted: '#9AA6AB',
        accent: {
          DEFAULT: '#34D399',
          fill: '#10B981',
          'fill-text': '#04130D',
          glow: 'rgba(52,211,153,.25)',
        },
        warn: {
          DEFAULT: '#FBBF24',
          bg: 'rgba(251,191,36,.12)',
        },
        alert: {
          DEFAULT: '#F87171',
          fill: '#DC2626',
          bg: 'rgba(220,38,38,.12)',
        },
        ok: {
          DEFAULT: '#34D399',
          bg: 'rgba(52,211,153,.12)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['clamp(40px, 6vw, 64px)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '3xl': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '2xl': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        xl: ['18px', { lineHeight: '1.4' }],
        base: ['16px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        xs: ['12px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        DEFAULT: '10px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        overlay: '0 12px 32px rgba(0,0,0,.5)',
        glow: '0 0 24px rgba(52,211,153,.25)',
        'glow-warn': '0 0 24px rgba(251,191,36,.25)',
        'glow-alert': '0 0 24px rgba(248,113,113,.25)',
      },
      letterSpacing: {
        heading: '-0.02em',
      },
    },
  },
  plugins: [],
};
