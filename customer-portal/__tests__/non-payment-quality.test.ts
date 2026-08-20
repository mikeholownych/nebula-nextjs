import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('non-payment public quality invariants', () => {
  const reportedRoutes = [
    'app/ai-sdr-vs-audit/page.tsx',
    'app/social-proof-landing-page/page.tsx',
    'app/editorial-standards/page.tsx',
    'app/roas-cliff/page.tsx',
    'app/privacy-policy/page.tsx',
    'app/data-rights/page.tsx',
  ]

  test.each(reportedRoutes)('%s has one main landmark and no nested contentinfo landmark', (file) => {
    const source = read(file)
    expect((source.match(/<main\b/g) || []).length).toBe(1)
    expect((source.match(/<footer\b|role=["']contentinfo["']/g) || []).length).toBe(0)
  })

  test('known article links point at existing routes', () => {
    expect(read('app/ai-sdr-vs-audit/page.tsx')).toContain('/learning-centre/landing-page-not-converting')
    expect(read('app/social-proof-landing-page/page.tsx')).toContain('/learning-centre/landing-page-not-converting')
  })

  test('cookie consent retains its persistence key and mobile obstruction guard', () => {
    const source = read('app/components/CookieConsent.tsx')
    expect(source).toContain("'nebula-cookie-consent'")
    expect(source).toContain('max-h-[42vh]')
    expect(source).toContain('overflow-y-auto')
  })

  test('favicon metadata uses current brand asset paths', () => {
    const source = read('app/layout.tsx')
    expect(source).toContain('brand.assets.faviconSvg')
    expect(source).toContain('brand.assets.appleTouchIcon')
    expect(source).not.toContain('favicon.svg?v=')
  })
})
