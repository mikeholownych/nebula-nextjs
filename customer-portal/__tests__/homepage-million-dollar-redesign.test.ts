import fs from 'node:fs'
import path from 'node:path'

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('homepage bespoke redesign contract', () => {
  const hero = read('app/components/HeroSection.tsx')
  const home = read('app/page.tsx')
  const nav = read('components/SiteNav.tsx')

  it('leads with the paid-click loss moment and one audit action', () => {
    expect(hero).toContain('You paid for the click.')
    expect(hero).toContain('Your page lost the sale.')
    expect(hero).toContain('Find the page failure before you spend another dollar on traffic.')
    expect(hero).not.toContain('The ad worked.')
    expect(hero).not.toContain('explore verified public teardowns')
  })

  it('uses an art-directed diagnostic case file instead of ambient SaaS effects', () => {
    expect(hero).toContain('Case file 0293')
    expect(hero).toContain('data-hero-case-file')
    expect(hero).not.toMatch(/blur-\[(?:100|120)px\]/)
    expect(hero).not.toContain('bg-emerald-')
    expect(hero).not.toContain('rounded-full bg-accent')
  })

  it('keeps evidence truthful and removes fabricated testimonial theater', () => {
    expect(home).toContain('Named pages. Named failures. Real evidence.')
    expect(home).toContain('What the audit can prove')
    expect(home).not.toContain('Beta Customer Feedback')
    expect(home).not.toContain('Alex R.')
    expect(home).not.toContain('Verified Audit')
  })

  it('preserves the customer workspace and bans prohibited punctuation', () => {
    expect(nav).toContain('https://app.nebulacomponents.com')
    expect(nav).toContain('Workspace')
    expect(`${hero}\n${home}\n${nav}`).not.toContain('—')
    expect(`${hero}\n${home}\n${nav}`).not.toContain('&mdash;')
  })

  it('prevents first-viewport layout regressions', () => {
    const dashboard = read('app/components/ScaledDashboard.tsx')
    const consent = read('app/components/CookieConsent.tsx')

    expect(home).not.toContain('bg-bg pt-24')
    expect(dashboard).toContain('height: `${DESIGN_HEIGHT}px`')
    expect(dashboard).not.toContain('containerHeight')
    expect(consent).toContain('sm:w-[520px]')
    expect(consent).toContain('Accept all analytics')
  })
})
