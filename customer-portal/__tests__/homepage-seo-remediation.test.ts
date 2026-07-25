import fs from 'node:fs'
import path from 'node:path'
import { HOMEPAGE_SEO_TITLE, PAID_TRAFFIC_DIAGNOSTIC } from '@/app/lib/homepageContent'

const root = path.resolve(__dirname, '..')

function words(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

describe('homepage SEO report remediations', () => {
  it('keeps the homepage title inside the measured 50-60 character range', () => {
    expect(HOMEPAGE_SEO_TITLE.length).toBeGreaterThanOrEqual(50)
    expect(HOMEPAGE_SEO_TITLE.length).toBeLessThanOrEqual(60)
    expect(HOMEPAGE_SEO_TITLE).toContain('Landing Page Audit')
  })

  it('adds substantive buyer-facing diagnostic content rather than scanner filler', () => {
    const copy = PAID_TRAFFIC_DIAGNOSTIC.map((section) => `${section.heading} ${section.body}`).join(' ')
    expect(words(copy)).toBeGreaterThanOrEqual(450)
    expect(copy).toContain('ad click')
    expect(copy).toContain('evidence')
    expect(copy).toContain('conversion')
  })

  it('uses only standard robots.txt directives', () => {
    const robots = fs.readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8')
    const unsupported = robots
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .filter((line) => !/^(User-Agent|Allow|Disallow|Sitemap):/i.test(line))

    expect(unsupported).toEqual([])
  })
})
