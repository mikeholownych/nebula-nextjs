import { readFileSync } from 'fs'
import path from 'path'

const read = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('fastest-growth on-page SEO contract', () => {
  it('puts the ranking query first in the /audit title and H1', () => {
    const page = read('app/audit/page.tsx')
    expect(page).toContain("title: 'Landing Page Audit: Free Conversion Leak Check | Nebula'")
    expect(page).toContain('Landing Page Audit: Check 9 Conversion Signals on Your Live Page')
    expect(page).toContain('This landing page audit reads public HTML')
  })

  it('keeps /what-is-landing-page-audit on a distinct informational title', () => {
    const layout = read('app/what-is-landing-page-audit/layout.tsx')
    expect(layout).toContain("title: 'What Is a Landing Page Audit? | Nebula Components'")
    expect(layout).toContain("canonical: 'https://nebulacomponents.com/what-is-landing-page-audit'")
    expect(layout).not.toContain('Free Landing Page Audit: Find Conversion Friction')
  })

  it('exposes a crawlable /research hub that lists the Q3 report', () => {
    const page = read('app/research/page.tsx')
    expect(page).toContain("canonical: 'https://nebulacomponents.com/research'")
    expect(page).toContain('/research/landing-page-performance-q3-2026')
    expect(page).toContain('Landing page research from the audit engine')
  })

  it('includes /research and /ai-info in sitemap and footer crawl paths', () => {
    const sitemap = read('app/sitemap.ts')
    const liveFooter = read('app/components/SiteFooter.tsx')
    expect(sitemap).toContain("'/research'")
    expect(sitemap).toContain("'/ai-info'")
    expect(liveFooter).toContain('href="/ai-info"')
    expect(liveFooter).toContain('AI info')
  })

  it('routes four Learning Centre articles to the published paid-traffic field note', () => {
    const files = [
      'app/learning-centre/above-fold-landing-page/page.tsx',
      'app/learning-centre/what-is-message-match/page.tsx',
      'app/learning-centre/google-ads-clicks-no-sales/page.tsx',
      'app/learning-centre/b2b-saas-landing-page-not-converting/page.tsx',
    ]
    for (const file of files) {
      expect(read(file)).toContain('/blog/paid-traffic-not-converting')
    }
  })

  it('aligns striking-distance titles with observed GSC query language', () => {
    const aboveFold = read('app/learning-centre/above-fold-landing-page/page.tsx')
    const messageMatch = read('app/learning-centre/what-is-message-match/page.tsx')
    const bounce = read('app/learning-centre/landing-page-bounce-rate-high/page.tsx')
    expect(aboveFold).toContain("title: 'Above the Fold Landing Page: What Paid Traffic Decides First | Nebula'")
    expect(aboveFold).toContain('What should be above the fold on a landing page')
    expect(messageMatch).toContain('message matching')
    expect(bounce).toContain('Homepage bounce causes vs landing page bounce')
  })
})
