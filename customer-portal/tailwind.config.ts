import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          DEFAULT: '#050505',
          elevated: '#0a0a0a',
          panel: '#111111',
        },
        // Foreground colors
        fg: {
          DEFAULT: '#ffffff',
          muted: '#888888',
          dim: '#666666',
        },
        // Accent colors (emerald)
        accent: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
          dim: 'rgba(16, 185, 129, 0.1)',
        },
        // Semantic colors
        danger: {
          DEFAULT: '#ef4444',
          dim: 'rgba(239, 68, 68, 0.15)',
        },
        warning: '#f59e0b',
        info: '#3b82f6',
        // Border
        border: 'rgba(255, 255, 255, 0.06)',
      },
      fontFamily: {
        sans: ['Karla', '-apple-system', 'system-ui', 'sans-serif'],
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
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
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
        glow: '0 0 40px rgba(16, 185, 129, 0.15)',
        'glow-sm': '0 0 20px rgba(16, 185, 129, 0.1)',
        'glow-lg': '0 0 60px rgba(16, 185, 129, 0.2)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
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
