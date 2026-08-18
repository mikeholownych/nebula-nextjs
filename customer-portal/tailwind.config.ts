import type { Config } from 'tailwindcss'

const NEBULA_ACCENT = '#00c2a0'
const NEBULA_ACCENT_LIGHT = '#33d4b8'
const NEBULA_ACCENT_DARK = '#009980'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors - four tones for depth layering
        bg: {
          DEFAULT: '#050505',
          elevated: '#0a0a0a',
          panel: '#111111',
          surface: '#0d1110',  // warm-tinted elevated surface for lifted cards
        },
        // Foreground colors
        fg: {
          DEFAULT: '#ffffff',
          muted: '#9e9e9e',
          dim: '#7c7c7c',
        },
        // Accent - surgical teal, distinct from Tailwind default emerald
        accent: {
          DEFAULT: NEBULA_ACCENT,
          light: NEBULA_ACCENT_LIGHT,
          dark: NEBULA_ACCENT_DARK,
          dim: 'rgba(0, 194, 160, 0.1)',
        },
        // Information semantic for lower-hierarchy informational states
        secondary: {
          DEFAULT: '#3b82f6',
          dim: 'rgba(59, 130, 246, 0.1)',
        },
        // Semantic colors
        danger: {
          DEFAULT: '#f37979',
          dim: 'rgba(239, 68, 68, 0.15)',
        },
        info: '#3b82f6',
        // Reserved exclusively for "this conversion signal failed its
        // threshold" - see FailSignal in ResultsClient.tsx. Do not use for
        // grade tiers, evidence confidence, or any other UI state; its
        // whole value is that seeing this color anywhere means one specific
        // thing. (Old bare `warning` token removed on purpose - any stray
        // `bg-warning`/`text-warning` usage now resolves to nothing rather
        // than silently drifting back into a general-purpose caution color.)
        signal: {
          fail: '#f59e0b',
        },
        // Border
        border: 'rgba(255, 255, 255, 0.06)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.6rem' }],
        '5xl': ['3rem', { lineHeight: '1.18' }],
        '6xl': ['3.75rem', { lineHeight: '1.12' }],
      },
      letterSpacing: {
        // Section-head tracking — neutral, not positive (positive on large type is amateur)
        section: '-0.01em',
        // Display tracking — tighter at large sizes, more refined
        display: '-0.04em',
        tight: '-0.02em',
        wide: '0.12em',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        DEFAULT: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        // Updated to match new accent teal
        glow: `0 0 40px color-mix(in srgb, ${NEBULA_ACCENT} 15%, transparent)`,
        'glow-sm': `0 0 20px color-mix(in srgb, ${NEBULA_ACCENT} 10%, transparent)`,
        'glow-lg': `0 0 60px color-mix(in srgb, ${NEBULA_ACCENT} 20%, transparent)`,
        // Lifted card shadow for surface-elevated panels
        lifted: '0 2px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      transitionDuration: {
        fast: '160ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
