import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import CookieConsent from '@/app/components/CookieConsent'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('consent-gated analytics loading', () => {
  beforeEach(() => {
    localStorage.clear()
    document.head.querySelectorAll('[data-test-analytics-script]')
      .forEach((element) => element.remove())
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
    render(<CookieConsent />)

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /accept all/i }))

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).not.toBeNull()
  })

  it('does not load Google Analytics when the visitor accepts essential cookies only', () => {
    render(<CookieConsent />)

    fireEvent.click(screen.getByRole('button', { name: /essential only/i }))

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    ).toBeNull()
  })

  it('keeps PostHog out of the initial bundle and initializes it only through a consent path', () => {
    const instrumentation = read('instrumentation-client.ts')

    expect(instrumentation).not.toMatch(
      /^import\s+posthog\s+from\s+['"]posthog-js['"]/m,
    )
    expect(instrumentation).toContain("import('posthog-js')")
    expect(instrumentation).toContain('nebula-cookie-consent')
    expect(instrumentation).toContain('cookie-consent-update')
  })
})
