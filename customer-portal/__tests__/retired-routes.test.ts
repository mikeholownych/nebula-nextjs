/**
 * D9 regression guard: retired-route handling must be coherent.
 *
 * Production QA found mixed semantics (some retired routes 301'd, some 404'd,
 * and the next.config .html redirects were entirely dead code because
 * proxy.ts's blanket .html blocker ran first). These tests pin the contract:
 *
 * 1. Every LEGACY_HTML_ROUTES entry redirects (301) to its live equivalent.
 * 2. Unrecognized .html paths are definitive orphans -> 404, noindex.
 * 3. next.config.ts consumes the SAME list (no second divergent copy).
 * 4. Bare-route GSC remediation entries stay unique and target live pages.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { LEGACY_HTML_ROUTES, findLegacyHtmlRedirect } from '@/app/lib/legacy-routes'

function runProxy(pathname: string, host = 'nebulacomponents.com'): Response {
  const request = new NextRequest(`https://${host}${pathname}`)
  const { proxy } = require('@/proxy') as {
    proxy: (request: NextRequest) => Response
  }
  return proxy(request)
}

describe('retired .html route handling (D9)', () => {
  it.each(
    LEGACY_HTML_ROUTES.map((r) => [r.source, r.destination]),
  )('%s -> 301 %s', (source, destination) => {
    expect(findLegacyHtmlRedirect(source)).toBe(destination)

    const res = runProxy(source)
    expect(res.status).toBe(301)
    const location = res.headers.get('location') ?? ''
    expect(location).toBe(`https://nebulacomponents.com${destination}`)
  })

  it.each([
    '/totally-forgotten-page.html',
    '/dashboard.html',
    '/generator.html',
    '/pricing-generator.html',
  ])('orphan %s is a definitive 404 with noindex', (source) => {
    expect(findLegacyHtmlRedirect(source)).toBeNull()

    const res = runProxy(source)
    expect(res.status).toBe(404)
    expect(res.headers.get('X-Robots-Tag')).toContain('noindex')
  })

  it('keeps the legacy list free of true orphans (they must 404, not redirect)', () => {
    const orphans = [
      '/ad-burn-leaderboard.html',
      '/og-card-source.html',
      '/component-showcase.html',
      '/growth-launch.html',
      '/marketing-ops.html',
    ]
    for (const orphan of orphans) {
      expect(
        LEGACY_HTML_ROUTES.find((r) => r.source === orphan),
      ).toBeUndefined()
    }
  })

  it('next.config.ts consumes the shared legacy list instead of a private copy', () => {
    const config = readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')
    expect(config).toContain('LEGACY_HTML_ROUTES.map')
    // No hand-copied .html redirect rows may remain in next.config.
    expect(config).not.toMatch(/\{ source: '[^']*\.html'/)
  })

  it('every legacy destination is a clean app route (no .html targets)', () => {
    for (const route of LEGACY_HTML_ROUTES) {
      expect(route.destination).not.toMatch(/\.html$/)
      expect(route.destination.startsWith('/')).toBe(true)
    }
  })

  it('legacy sources are unique', () => {
    const sources = LEGACY_HTML_ROUTES.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
  })
})

describe('bare-route GSC remediation entries (next.config redirects)', () => {
  it('redirect bare retired routes to live equivalents via /gone or content pages', async () => {
    const configModule = await import('@/next.config')
    const nextConfig =
      (configModule as { default: { redirects?: () => Promise<Array<{ source: string; destination: string }>> } }).default
    const redirects = await nextConfig.redirects!()

    const bareRetired: Array<[string, string]> = [
      ['/dashboard', '/gone'],
      ['/organization', '/gone'],
      ['/audit-dashboard', '/audit'],
      ['/audit/dashboard', '/audit'],
      ['/subscription', '/pricing'],
      ['/beta-tester', '/pricing'],
      ['/ai-ops-retainer', '/pricing'],
      ['/why-evidence', '/editorial-standards'],
      ['/learn-more', '/audit'],
    ]

    for (const [source, destination] of bareRetired) {
      const match = redirects.find((r) => r.source === source)
      if (!match) throw new Error(`missing redirect for ${source}`)
      expect(match.destination).toBe(destination)
    }
  })

  it('never redirects to a route that is itself retired', async () => {
    const configModule = await import('@/next.config')
    const nextConfig =
      (configModule as { default: { redirects?: () => Promise<Array<{ source: string; destination: string }>> } }).default
    const redirects = await nextConfig.redirects!()

    const retiredSources = new Set(redirects.map((r) => r.source))
    for (const r of redirects) {
      const destPath = r.destination.split('?')[0]
      if (retiredSources.has(destPath)) {
        throw new Error(
          `Redirect chain detected: ${r.source} -> ${destPath} (itself retired)`,
        )
      }
    }
  })

  it('emits a NextResponse when redirected through the proxy layer', () => {
    const res = runProxy('/primer.html?utm_source=email')
    expect(res).toBeInstanceOf(NextResponse)
    expect(res.status).toBe(301)
    // Legacy query strings are dropped deliberately (no equity-bearing params).
    expect(res.headers.get('location')).not.toContain('utm_source')
  })
})
