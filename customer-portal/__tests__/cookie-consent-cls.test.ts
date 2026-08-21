import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('cookie banner first-paint CLS', () => {
  it('does not apply a transform on the visible banner, only on the dismissing state', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'app/components/CookieConsent.tsx'),
      'utf8',
    )
    const bannerClass = source.match(/id="cookie-consent-banner"[\s\S]*?className="([^"]+)"/)
    expect(bannerClass?.[1]).toBeTruthy()
    expect(bannerClass?.[1]).not.toMatch(/(^|\s)translate-y-0(\s|$)/)
    expect(source).toMatch(/consent-dismissing.*translate-y-full/)
  })
})
