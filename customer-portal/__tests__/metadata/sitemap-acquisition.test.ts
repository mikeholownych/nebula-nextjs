import sitemap from '@/app/sitemap'
import { comparisons } from '@/app/compare/comparisons'
import { getAllVerticalSlugs } from '@/app/for/[vertical]/data'

const origin = 'https://nebulacomponents.com'
const publicPaths = [
  '/repair-sprint', '/repair-sprint/example', '/proof',
  '/research/landing-page-performance-q3-2026', '/score', '/roi-calculator',
  '/funnel-audit', '/paid-traffic-leak-scorecard', '/ads-not-converting-two-percent',
  '/fix-conversion-leak-before-campaign',
  '/mobile-viewport-conversion-rates', '/free-landing-page-audit-tools-startups',
  '/landing-page-performance-analysis', '/status', '/cro-agency-alternative',
  '/landing-page-code-fixes', '/landing-page-mistakes', '/no-retainer-cro-tools', '/audit/compare',
]

describe('acquisition sitemap coverage', () => {
  it('includes all published verticals, comparisons and verified public omissions exactly once', async () => {
    const urls = (await sitemap()).map(({ url }) => url)
    const expected = [
      ...publicPaths,
      ...getAllVerticalSlugs().map((slug) => `/for/${slug}`),
      ...comparisons.map(({ slug }) => `/compare/${slug}`),
    ]
    expect(expected.filter((p) => !urls.includes(`${origin}${p}`))).toEqual([])
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('does not discover private, confirmation, retired or redirect-only pages', async () => {
    const paths = (await sitemap()).map(({ url }) => new URL(url).pathname)
    for (const prefix of ['/api/', '/shared/', '/workspace', '/checkout', '/login', '/dashboard', '/newsletter/confirmed', '/unsubscribe', '/part-before', '/part-after', '/ad-burn-leaderboard', '/leak-index', '/generator']) {
      expect(paths.filter((p) => p.startsWith(prefix))).toEqual([])
    }
  })
})
