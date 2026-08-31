import type { Config } from 'tailwindcss'

// ── Nebula Design System v2 - Editorial Precision ────────────────────────────
//
// Selected direction: chartreuse accent on near-black, NebulaMark as system
// device, editorial type discipline, structural borders only.
//
// Key change from v1: accent #00c2a0 (generic teal) → #c7ff2f (Nebula Chartreuse)
// This is the single most impactful visual change. Every other token is refined,
// not replaced. Semantic discipline is preserved and extended.

const ACCENT = '#c7ff2f'
const ACCENT_DIM = 'rgba(199, 255, 47, 0.10)'
const ACCENT_MID = 'rgba(199, 255, 47, 0.20)'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds - four tones for depth layering ──────────────
        bg: {
          DEFAULT: '#050505',    // near-black foundation
          elevated: '#0a0a0a',   // section contrast
          muted: '#0a0a0a',      // alias used by interior pages
          panel: '#111111',      // component panels
          surface: '#151515',    // lifted diagnostic surfaces
        },
        // ── Foreground ───────────────────────────────────────────────
        fg: {
          DEFAULT: '#e8ebe7',    // warm off-white, not pure #fff - reduces eye strain
          muted: '#a0aaa2',      // >=7.17:1 on surface - WCAG AAA (D11)
          dim: '#9fa99f',        // >=7.08:1 on surface - WCAG AAA (D11)
        },
        // ── Accent - Nebula Chartreuse ────────────────────────────────
        // Single chromatic accent. Use only on: CTAs, active states,
        // pass indicators, key data values, mark in brand contexts.
        // Never decorative.
        accent: {
          DEFAULT: ACCENT,
          dim: ACCENT_DIM,
          mid: ACCENT_MID,
        },
        // ── Semantic ─────────────────────────────────────────────────
        danger: {
          DEFAULT: '#f58a8a',   // softened red - >=7.27:1 on surface, WCAG AAA (D11)
          dim: 'rgba(240, 107, 107, 0.12)',
        },
        // info: blue - used for neutral/informational UI states
        info: '#7babff',      // >=7.45:1 on surface - WCAG AAA (D11)
        // signal.fail: RESERVED. Amber only for "conversion signal failed".
        // Do not use for warning states, grades, or any other UI meaning.
        signal: {
          fail: '#f59e0b',
        },
        // ── Structural ───────────────────────────────────────────────
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.07)',
          strong: 'rgba(255, 255, 255, 0.13)',
          accent: `rgba(199, 255, 47, 0.25)`,
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // ── Metadata / labels ────────────────────────────────────────
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],  // 11px - eyebrows, tags
        xs:   ['0.75rem',   { lineHeight: '1.125rem' }],   // 12px
        sm:   ['0.875rem',  { lineHeight: '1.375rem' }],   // 14px
        // ── Body ─────────────────────────────────────────────────────
        base: ['1rem',      { lineHeight: '1.75rem' }],    // 16px body
        // ── Section headings ─────────────────────────────────────────
        lg:   ['1.125rem',  { lineHeight: '1.625rem' }],
        xl:   ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',    { lineHeight: '2rem' }],
        '3xl':['1.875rem',  { lineHeight: '2.375rem' }],
        '4xl':['2.25rem',   { lineHeight: '2.625rem' }],
        '5xl':['3rem',      { lineHeight: '1.15' }],
        '6xl':['3.75rem',   { lineHeight: '1.1' }],
        '7xl':['4.5rem',    { lineHeight: '1.06' }],      // display - hero
      },
      letterSpacing: {
        tightest: '-0.05em',   // display / hero only
        tighter:  '-0.035em',  // large headings
        tight:    '-0.02em',   // h2-level
        normal:    '0em',
        label:    '0.08em',    // small-caps eyebrows
        wide:     '0.12em',    // rarely used
      },
      lineHeight: {
        editorial: '1.72',   // body prose
        tight:     '1.15',   // display
        snug:      '1.3',    // headings
      },
      // ── Spacing - systematic scale ───────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '88':  '22rem',
        '104': '26rem',
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        // Content column widths
        'reading': '68ch',    // prose max
        'content': '780px',   // single-column content
        'wide':    '1100px',  // standard page container
        'full':    '1280px',  // max page width
      },
      // ── Border radius - deliberate, not default ──────────────────
      // Diagnostic surfaces: sharp or very slightly rounded
      // UI controls: small radius
      // Cards/panels: small - no rounding monoculture
      borderRadius: {
        none:   '0px',
        sm:     '3px',    // default for diagnostic/data surfaces
        DEFAULT:'6px',    // UI controls, inputs
        md:     '8px',    // cards, panels
        lg:     '12px',   // larger containers
        xl:     '16px',   // sections/heroes
        full:   '9999px', // pills - used sparingly
      },
      // ── Box shadow - structural only ─────────────────────────────
      boxShadow: {
        // No glow effects. Shadows for elevation only.
        sm:  '0 1px 3px rgba(0,0,0,0.3)',
        md:  '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        lg:  '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        // Accent ring - for focused/active interactive elements only
        'ring-accent': `0 0 0 2px ${ACCENT}`,
      },
      // ── Animation ───────────────────────────────────────────────
      animation: {
        'fade-in':    'fade-in 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':   'slide-up 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'mark-reveal':'mark-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast:   '140ms',
        base:   '200ms',
        slow:   '300ms',
        slower: '500ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        enter:    'cubic-bezier(0.16, 1, 0.3, 1)',
        exit:     'cubic-bezier(0.4, 0, 1, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        'mark-reveal': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
