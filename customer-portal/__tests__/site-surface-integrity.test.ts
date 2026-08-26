import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from '@jest/globals'

const repo = path.resolve(__dirname, '..')
const EM_DASH = '\u2014'

function walk(dir: string, exts: Set<string>, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'coverage') continue
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, exts, acc)
    else if (exts.has(path.extname(entry))) acc.push(full)
  }
  return acc
}

describe('site surface integrity', () => {
  it('bans em dashes from live app and component source', () => {
    const files = [
      ...walk(path.join(repo, 'app'), new Set(['.ts', '.tsx', '.css'])),
      ...walk(path.join(repo, 'components'), new Set(['.ts', '.tsx'])),
    ]
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      if (text.includes(EM_DASH)) {
        const rel = path.relative(repo, file)
        const lines = text
          .split('\n')
          .map((line, i) => (line.includes(EM_DASH) ? `${rel}:${i + 1}` : ''))
          .filter(Boolean)
        offenders.push(...lines)
      }
    }
    expect(offenders).toEqual([])
  })

  it('exposes Client Workspace in the live nav and footer', () => {
    const nav = readFileSync(path.join(repo, 'components/SiteNav.tsx'), 'utf8')
    const footer = readFileSync(path.join(repo, 'app/components/SiteFooter.tsx'), 'utf8')
    expect(nav).toContain('href="https://app.nebulacomponents.com"')
    expect(nav).toMatch(/Client Workspace|Workspace/)
    expect(footer).toContain('href="https://app.nebulacomponents.com"')
    expect(footer).toMatch(/Client Workspace/)
  })

  it('does not assign retired teal as a live accent token', () => {
    const styles = readFileSync(path.join(repo, 'app/styles.css'), 'utf8')
    const publicDs = readFileSync(path.join(repo, 'public/styles/nebula-design-system.css'), 'utf8')
    expect(styles).not.toMatch(/--accent:\s*#00c2a0/)
    expect(publicDs).not.toMatch(/--accent:\s*#00c2a0/)
    expect(publicDs).not.toContain('.glow-orb')
    expect(styles).toMatch(/--accent:\s*#c7ff2f/)
    expect(publicDs).toMatch(/--accent:\s*#c7ff2f/)
  })

  it('keeps the homepage compressed to the instrument sequence', () => {
    const home = readFileSync(path.join(repo, 'app/page.tsx'), 'utf8')
    expect(home).toContain('HeroSection')
    expect(home).toContain('What Nebula checks')
    expect(home).toContain('See the Repair Sprint')
    expect(home).toContain('What the audit can prove')
    expect(home).not.toContain('ROICalculator')
    expect(home).not.toContain('WithWithout')
    expect(home).not.toContain('StackTaxComparison')
    expect(home).not.toContain('HowItWorksAnimated')
    expect(home).not.toContain('The cost of inaction')
    expect(home).not.toContain('Not a sales call in disguise')
  })

  it('keeps the hero instrument off the mobile first screen', () => {
    const hero = readFileSync(path.join(repo, 'app/components/HeroSection.tsx'), 'utf8')
    const horizon = readFileSync(path.join(repo, 'app/components/SignalHorizon.tsx'), 'utf8')
    expect(hero).toContain('hidden w-full overflow-hidden md:-mb-20 md:block')
    expect(hero).toContain('hidden h-[450px] w-[900px]')
    expect(horizon).toContain('hidden w-full')
    expect(horizon).toContain('md:flex')
    expect(horizon).not.toContain('animate-ping')
  })

  it('instruments homepage hero CTA exposure and click without changing the offer', () => {
    const hero = readFileSync(path.join(repo, 'app/components/HeroSection.tsx'), 'utf8')
    expect(hero).toContain('eventName="audit_cta_exposed"')
    expect(hero).toContain("trackClientFunnelEvent('audit_cta_clicked'")
    expect(hero).toContain("cta_location: 'homepage_hero'")
    expect(hero).toContain('beaconId="homepage_hero_audit_cta"')
  })

  it('bans the stale causal signal-phrase family from current pages', () => {
    const files = walk(path.join(repo, 'app'), new Set(['.ts', '.tsx']))
    const stale = 'signals that determine whether paid traffic converts'
    const outcome = 'consistently convert below 1.5%'
    const adsJob = 'The ads did their job'
    const anyUrl = 'If it has a URL, Nebula reads it'
    const coldProof = 'converts more cold traffic than any feature list'
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      if (
        text.includes(stale) ||
        text.includes(outcome) ||
        text.includes(adsJob) ||
        text.includes(anyUrl) ||
        text.includes(coldProof)
      ) {
        offenders.push(path.relative(repo, file))
      }
    }
    expect(offenders).toEqual([])
  })

  it('does not link to the missing /billing page', () => {
    const files = [
      ...walk(path.join(repo, 'app'), new Set(['.ts', '.tsx'])),
      ...walk(path.join(repo, 'components'), new Set(['.ts', '.tsx'])),
    ]
    const offenders = files.filter((file) => {
      const text = readFileSync(file, 'utf8')
      return /href=["']\/billing["']/.test(text)
    }).map((file) => path.relative(repo, file))
    expect(offenders).toEqual([])
  })
})
