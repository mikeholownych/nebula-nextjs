/**
 * Single source of truth for legacy `.html` route handling (D9).
 *
 * History: next.config.ts declared 301s for indexed .html URLs, but proxy.ts
 * (middleware) runs first and blanket-404'd every .html path - so those
 * equity-preserving redirects were dead code and Google saw hard 404s.
 *
 * Both layers now consume this list:
 * - proxy.ts matches it BEFORE the generic .html blocker (301 fires)
 * - next.config.ts spreads it into redirects() so non-middleware contexts
 *   (static export checks, tests) see the same mapping
 *
 * Rule: content pages with a live equivalent -> nearest current route (301).
 * True orphans stay OUT of this list and fall through to the blocker's 404.
 */
export interface LegacyHtmlRoute {
  source: string
  destination: string
}

export const LEGACY_HTML_ROUTES: LegacyHtmlRoute[] = [
  { source: '/blog-trigger-aware-outreach.html', destination: '/learning-centre' },
  { source: '/why-landing-pages-dont-convert.html', destination: '/learning-centre/landing-page-not-converting' },
  { source: '/why-landing-pages-dont-convert', destination: '/learning-centre/landing-page-not-converting' },
  { source: '/cta-optimization.html', destination: '/cta-optimization' },
  { source: '/roas-cliff.html', destination: '/roas-cliff' },
  { source: '/ai-sdr-vs-audit.html', destination: '/ai-sdr-vs-audit' },
  // Live "Details + FAQ" link embedded in every free audit email
  // (deliver_audit.py); served from public/primer.html via rewrite below.
  { source: '/primer.html', destination: '/primer' },
  { source: '/7-systems.html', destination: '/learning-centre' },
  { source: '/audit.html', destination: '/audit' },
  { source: '/checkout.html', destination: '/checkout' },
  { source: '/self-audit.html', destination: '/audit' },
  { source: '/case-studies/self-audit.html', destination: '/case-studies' },
  { source: '/audit_dashboard.html', destination: '/audit' },
  { source: '/agency-partner.html', destination: '/pricing' },
  { source: '/ai-ops-retainer.html', destination: '/pricing' },
  { source: '/beta-tester.html', destination: '/pricing' },
  { source: '/headline-optimization.html', destination: '/headline-optimization' },
  { source: '/mobile-landing-page-optimization.html', destination: '/mobile-landing-page-optimization' },
  { source: '/page-speed-conversion.html', destination: '/page-speed-conversion' },
  { source: '/social-proof-landing-page.html', destination: '/social-proof-landing-page' },
  { source: '/privacy-policy.html', destination: '/privacy-policy' },
]

/**
 * Returns the redirect destination for a legacy .html path, or null when the
 * path is an unrecognized orphan (caller decides: 404/410).
 */
export function findLegacyHtmlRedirect(pathname: string): string | null {
  const match = LEGACY_HTML_ROUTES.find((route) => route.source === pathname)
  return match ? match.destination : null
}
