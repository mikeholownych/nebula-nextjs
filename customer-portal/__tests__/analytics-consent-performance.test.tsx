import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import CookieConsent, {
  CONSENT_RUNTIME,
  getConsentRuntime,
} from '@/app/components/CookieConsent'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('consent-gated analytics loading', () => {
  beforeEach(() => {
    localStorage.clear()
    document.head.querySelectorAll('[data-test-analytics-script], #gtag-src, script[data-nebula-posthog]')
      .forEach((element) => element.remove())
    delete (window as Window & { gtag?: unknown }).gtag
    delete (window as Window & { dataLayer?: unknown }).dataLayer
  })

  afterEach(() => {
    cleanup()
    document.head.querySelectorAll('script[src*="googletagmanager.com"]')
      .forEach((element) => element.remove())
  })

  it('does not ship the Google Analytics network script from the root layout', () => {
    expect(read('app/layout.tsx')).not.toContain(
      'src="https://www.googletagmanager.com/gtag/js',
    )
  })

  it('loads Google Analytics only after the visitor accepts analytics cookies', () => {
    render(<CookieConsent country="DE" />)
    window.eval(getConsentRuntime('DE'))

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /accept all/i }))

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).not.toBeNull()
  })

  it('announces consent and PostHog readiness so the landing page is attributed immediately', () => {
    render(<CookieConsent />)
    window.eval(CONSENT_RUNTIME)
    const consentListener = jest.fn()
    window.addEventListener('cookie-consent-update', consentListener)

    fireEvent.click(screen.getByRole('button', { name: /accept all/i }))

    expect(consentListener).toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('nebula-cookie-consent') || '{}')).toMatchObject({
      level: 'all',
      version: 1,
    })
    expect(CONSENT_RUNTIME).toContain("new CustomEvent('nebula-posthog-ready')")
    window.removeEventListener('cookie-consent-update', consentListener)
  })

  it('blocks the edge-injected Cloudflare beacon from the enforced CSP', () => {
    const config = read('next.config.ts')
    expect(config).toContain("key: 'Content-Security-Policy'")
    expect(config).not.toContain("key: 'Content-Security-Policy-Report-Only'")
    expect(config).not.toContain('https://static.cloudflareinsights.com')
    expect(config).not.toContain('https://cloudflareinsights.com')
  })

  it('does not load Google Analytics when the visitor accepts essential cookies only', () => {
    render(<CookieConsent country="DE" />)
    window.eval(getConsentRuntime('DE'))

    fireEvent.click(screen.getByRole('button', { name: /essential only/i }))

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).toBeNull()
  })

  it('defaults analytics to accepted for non-EU visitors until they decline', () => {
    render(<CookieConsent country="CA" />)
    window.eval(getConsentRuntime('CA'))

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).not.toBeNull()
    expect(document.documentElement.getAttribute('data-analytics-default')).toBe('accepted')
    expect(localStorage.getItem('nebula-cookie-consent')).toBeNull()
  })

  it('honors a non-EU visitor declining the default analytics state', () => {
    render(<CookieConsent country="CA" />)
    window.eval(getConsentRuntime('CA'))

    fireEvent.click(screen.getByRole('button', { name: /essential only/i }))

    expect(JSON.parse(localStorage.getItem('nebula-cookie-consent') || '{}')).toMatchObject({
      level: 'necessary',
      version: 1,
    })
    expect(document.documentElement.getAttribute('data-analytics-default')).toBe('declined')
  })

  it('loads PostHog from the consent runtime instead of a global client entrypoint', () => {
    expect(
      existsSync(path.join(process.cwd(), 'instrumentation-client.ts')),
    ).toBe(false)

    const consent = read('app/components/CookieConsent.tsx')
    expect(consent).not.toContain("from 'posthog-js'")
    expect(consent).not.toContain("import('posthog-js')")
    expect(consent).toContain("script.src = '/ingest/static/array.js'")
    expect(consent).toContain('NEXT_PUBLIC_POSTHOG_KEY')
    expect(consent).toContain('autocapture: false')
    expect(consent).toContain('capture_exceptions: false')
    expect(consent).toContain('capture_pageleave: false')
    expect(consent).toContain('capture_dead_clicks: false')
    expect(consent).toContain('disable_surveys: true')
    expect(consent).toContain('disable_session_recording: true')
    expect(consent).toContain('capture_performance: false')
  })

  it('does not statically import PostHog from the shared audited-route shell', () => {
    for (const sharedModule of [
      'app/layout.tsx',
      'app/components/CookieConsent.tsx',
      'components/SiteNav.tsx',
      'components/Footer.tsx',
      'components/citable/CitablePageShell.tsx',
    ]) {
      expect(read(sharedModule)).not.toMatch(
        /import\s+(?:\w+|\{[^}]+\})\s+from\s+['"]posthog-js['"]/,
      )
    }
  })

  it('renders consent controls without a shared React client boundary', () => {
    const source = read('app/components/CookieConsent.tsx')

    expect(source).not.toContain('"use client"')
    expect(source).not.toContain('useState')
    expect(source).not.toContain('useEffect')
    expect(source).toContain('CONSENT_RUNTIME')
  })

  it('registers WebMCP tools without a shared React client boundary', () => {
    const source = read('components/WebMCP.tsx')

    expect(source).not.toContain("'use client'")
    expect(source).not.toContain('useEffect')
    expect(source).toContain('WEB_MCP_RUNTIME')
    expect(source).toContain('request_audit')
    expect(source).toContain('get_pricing')
    expect(source).toContain('search_learning')
  })

  it('keeps the audited static-route shell free of Next Link client boundaries', () => {
    for (const sharedModule of [
      'components/SiteNav.tsx',
      'components/Footer.tsx',
      'app/learning-centre/page.tsx',
      'app/learning-centre/CategoryAccordion.tsx',
    ]) {
      expect(read(sharedModule)).not.toMatch(/from ['"]next\/link['"]/)
    }
  })

  it('keeps route-wide text paint independent of a downloaded webfont', () => {
    expect(read('app/layout.tsx')).not.toMatch(/from ['"]next\/font\//)
    expect(read('app/globals.css')).not.toContain("'Karla'")
    expect(read('tailwind.config.ts')).not.toContain("'Karla'")
  })
})
