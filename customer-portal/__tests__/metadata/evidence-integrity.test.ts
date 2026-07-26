import { readFileSync } from 'fs'
import path from 'path'

const read = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('learning-centre evidence integrity', () => {
  it.each([
    'app/learning-centre/message-match-checklist/page.tsx',
    'app/learning-centre/proof-before-cta/page.tsx',
  ])('does not emit FAQ schema without a shared visible FAQ projection: %s', (relative) => {
    expect(read(relative)).not.toContain("'@type': 'FAQPage'")
  })

  it('does not publish unsupported numeric outcome examples as factual-looking proof', () => {
    const combined = [
      'app/learning-centre/proof-before-cta/page.tsx',
      'app/learning-centre/cta-below-fold-mobile/page.tsx',
      'app/learning-centre/agency-handoff-debt/page.tsx',
      'app/learning-centre/message-match-checklist/page.tsx',
      'app/learning-centre/ad-says-one-thing-page-says-another/page.tsx',
      'app/learning-centre/tiktok-landing-page-scroll-speed-gap/page.tsx',
    ].map(read).join('\n')

    for (const unsupported of [
      '63% of Phones',
      '63% of phones',
      '1.8× to 4.1× across 23 accounts',
      'Used by 340+ operators',
      'convert at 2.1× the category average',
      'outperforms "Submit" by 30–40%',
      'first 200 milliseconds',
      'fixes 80% of the gap',
      '0.8-second',
    ]) {
      expect(combined).not.toContain(unsupported)
    }
  })

  it('does not publish unsupported comparative superlatives', () => {
    const files = [
      'app/learning-centre/agency-handoff-debt/page.tsx',
      'app/learning-centre/ghost-variant-ab-test/page.tsx',
      'app/learning-centre/landing-page-not-converting/page.tsx',
      'app/learning-centre/mobile-landing-page-leaks/page.tsx',
      'app/learning-centre/cta-not-working/page.tsx',
      'app/learning-centre/before-you-raise-ad-budget/page.tsx',
      'app/learning-centre/landing-page-conversion-rate-benchmark/page.tsx',
    ]

    for (const file of files) {
      expect(read(file).toLowerCase()).not.toMatch(/\bthe (?:fastest|top(?!\s+(?:three|five|ten)\b))\b/)
    }
  })
})
