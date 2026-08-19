/**
 * Canonical brand configuration for Nebula Components (Brand Version 2).
 * Source of truth for color tokens, typography, surfaces, and branding assets.
 */

export const BRAND_VERSION = 2;

export const brand = {
  version: BRAND_VERSION,
  name: 'Nebula Components',
  shortName: 'Nebula',
  domain: 'nebulacomponents.com',
  url: 'https://nebulacomponents.com',
  tagline: 'Find the page-side conditions worth fixing before you blame the traffic.',

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
    dangerDim: 'rgba(240, 107, 107, 0.12)',
    info: '#3b82f6',
    signalFail: '#f59e0b',
    border: 'rgba(255, 255, 255, 0.07)',
    borderStrong: 'rgba(255, 255, 255, 0.13)',
    borderAccent: 'rgba(199, 255, 47, 0.25)',
  },

  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    mono: "'ui-monospace', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
  },
} as const;

export type Brand = typeof brand;
