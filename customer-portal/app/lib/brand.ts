/**
 * Canonical brand registry - single source of truth for Nebula visual identity.
 * All brand projections (favicon, OG, schema, manifest, press) resolve from here.
 */

export const BRAND_VERSION = 2

export const brand = {
  version: BRAND_VERSION,
  name: 'Nebula Components',
  shortName: 'Nebula',
  domain: 'nebulacomponents.com',
  url: 'https://nebulacomponents.com',

  colors: {
    background: '#080909',
    surface: '#0d0f0e',
    panel: '#131615',
    card: '#191c1a',
    foreground: '#e8ebe7',
    muted: '#7a8078',
    dim: '#525750',
    accent: '#c7ff2f',
    accentDim: 'rgba(199, 255, 47, 0.10)',
    accentMid: 'rgba(199, 255, 47, 0.20)',
    danger: '#f06b6b',
    info: '#3b82f6',
    signalFail: '#f59e0b',
    border: 'rgba(255, 255, 255, 0.07)',
    borderStrong: 'rgba(255, 255, 255, 0.13)',
    borderAccent: 'rgba(199, 255, 47, 0.25)',
    accentOnLight: '#3d5c00',
  },

  assets: {
    faviconSvg: '/favicon.svg',
    faviconIco: '/favicon.ico',
    favicon16: '/brand/v2/favicon-16.png',
    favicon32: '/brand/v2/favicon-32.png',
    appleTouchIcon: '/brand/v2/apple-touch-icon.png',
    pwaIcon192: '/brand/v2/icon-192.png',
    pwaIcon512: '/brand/v2/icon-512.png',
    markDark: '/brand/mark-dark.svg',
    markLight: '/brand/mark-light.svg',
    markMono: '/brand/mark-mono.svg',
    markAccent: '/brand/mark-accent.svg',
    wordmarkDark: '/brand/wordmark-dark.svg',
    wordmarkLight: '/brand/wordmark-light.svg',
    ogDefault: '/brand/v2/og-default.png',
    organizationLogo: '/brand/v2/mark-256.png',
    bimi: '/.well-known/bimi.svg',
  },

  metadata: {
    themeColor: '#080909',
    colorScheme: 'dark' as const,
  },

  // Deprecated v1 assets - governance checks flag current-page references.
  // Historical copies live under /brand/archive/v1/.
  deprecated: {
    colors: ['#00c2a0', '#00a88a', '#33d4b8', '#009980'],
    assets: [
      '/logo-dark.png',
      '/brand/mark-emerald.svg',
      '/og-card.png',
      '/brand/mark-emerald-64.png',
      '/brand/mark-emerald-128.png',
      '/brand/mark-emerald-256.png',
    ],
  },
} as const

export type Brand = typeof brand

export function brandAbsolute(path: string): string {
  if (path.startsWith('http')) return path
  return `${brand.url}${path}`
}
