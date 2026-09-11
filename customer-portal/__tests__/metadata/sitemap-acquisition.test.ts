import sitemap from '@/app/sitemap'
import { getAllVerticalSlugs } from '@/app/for/[vertical]/data'
import { COMPARISONS } from '@/app/vs/[slug]/data'

const origin = 'https://nebulacomponents.com'

// These paths are hardcoded in sitemap.ts corePagesByPriority. They are
// checked separately from the canonical sources below because sitemap.ts is
// the artifact under test and cannot be trusted to enumerate itself.
const corePublicPaths = [
  '/repair-sprint', '/repair-sprint/example', '/proof',
  '/research/landing-page-performance-q3-2026', '/score', '/roi-calculator',
  '/funnel-audit', '/paid-traffic-leak-scorecard', '/ads-not-converting-two-percent',
  '/fix-conversion-leak-before-campaign',
  '/mobile-viewport-conversion-rates', '/free-landing-page-audit-tools-startups',
  '/landing-page-performance-analysis', '/status', '/cro-agency-alternative',
  '/landing-page-code-fixes', '/landing-page-mistakes', '/no-retainer-cro-tools', '/audit/compare',
]

describe('acquisition sitemap coverage', () => {
  it('includes every canonical vertical and comparison slug exactly once', async () => {
    const urls = (await sitemap()).map(({ url }) => url)
    // Canonical expectations come from the data sources, not a hand-maintained
    // list. A hand-maintained list here silently decays when new pages ship
    // and the sitemap is regenerated correctly.
    const expected = [
      ...getAllVerticalSlugs().map((slug) => `/for/${slug}`),
      ...Object.keys(COMPARISONS).map((slug) => `/compare/${slug}`),
    ]
    expect(expected.filter((p) => !urls.includes(`${origin}${p}`))).toEqual([])
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('includes the core public acquisition paths hardcoded in sitemap.ts', async () => {
    const urls = (await sitemap()).map(({ url }) => url)
    expect(corePublicPaths.filter((p) => !urls.includes(`${origin}${p}`))).toEqual([])
  })

  it('does not discover private, confirmation, retired or redirect-only pages', async () => {
    const paths = (await sitemap()).map(({ url }) => new URL(url).pathname)
    for (const prefix of ['/api/', '/shared/', '/workspace', '/checkout', '/login', '/dashboard', '/newsletter/confirmed', '/unsubscribe', '/part-before', '/part-after', '/ad-burn-leaderboard', '/leak-index', '/generator']) {
      expect(paths.filter((p) => p.startsWith(prefix))).toEqual([])
    }
  })
})