/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('Phase 5 frontend runtime', () => {
  it('does not statically import funnel third parties from the root layout', () => {
    const layout = read('app/layout.tsx')

    expect(layout).not.toMatch(/from ['"][^'"]*HeyCatch['"]/)
    expect(layout).not.toMatch(/from ['"][^'"]*ExitIntentPopup['"]/)
    expect(layout).not.toContain('searchable-tracker')
    expect(layout).not.toContain('rb2b-event')
    expect(layout).toContain('FunnelChrome')
    expect(layout).toContain('GeoConsent')
    expect(layout).toContain('AnalyticsRuntime')
    expect(layout).toContain('WebMCP')
    expect(layout).toContain('SiteNav')
    expect(layout).toContain('SiteFooter')
  })

  it('loads funnel chrome only on / and /audit* after analytics consent', () => {
    const source = read('app/components/FunnelChrome.tsx')

    expect(source).toContain("pathname === '/'")
    expect(source).toContain("pathname.startsWith('/audit')")
    expect(source).toContain('cookie-consent-update')
    expect(source).toMatch(/level === ['"]all['"]/)
    expect(source).toContain('data-analytics-default')
    expect(source).toContain('accepted')
    expect(source).toContain('HeyCatch')
    expect(source).toContain('ExitIntentPopup')
    expect(source).toContain('searchable-tracker')
    expect(source).toContain('rb2b-event')
  })

  it('records the current RB2B page visit on deferred insert instead of waiting for load', () => {
    const source = read('app/components/FunnelChrome.tsx')
    const rb2bStart = source.indexOf("WEBHOOK_URL = '/api/lead-gen/rb2b-event'")
    expect(rb2bStart).toBeGreaterThan(-1)
    const rb2b = source.slice(rb2bStart)

    // A post-hydration consent mount happens after `load`, so tracking must
    // run immediately (or via readyState complete) rather than load-only.
    expect(rb2b).toMatch(/trackPageVisit\(\)/)
    const loadListener = rb2b.match(/addEventListener\(\s*['"]load['"]\s*,\s*trackPageVisit\s*\)/)
    if (loadListener) {
      const withoutLoadListener = rb2b.replace(loadListener[0], '')
      expect(withoutLoadListener).toMatch(/trackPageVisit\(\)|document\.readyState/)
    }

    // Inline IIFE must execute on client insert the same way Searchable does.
    expect(source).toMatch(/<Script[\s\S]*id=["']rb2b-/)
  })

  it('does not rewrite / to /index.html and keeps other rewrites', () => {
    const config = read('next.config.ts')

    expect(config).not.toMatch(
      /source:\s*['"]\/['"]\s*,\s*\n\s*destination:\s*['"]\/index\.html['"]/,
    )
    expect(config).not.toContain("destination: '/index.html'")
    expect(config).toContain('/ingest/')
    expect(config).toContain('/.well-known/bimi.svg')
    expect(config).toContain('/teardowns/:slug.md')
    expect(config).toContain('/learning-centre/:slug.md')
  })

  it('uses a native GET hero form that works without JavaScript', () => {
    const hero = read('app/components/HeroSection.tsx')

    expect(hero).toContain('action="/audit"')
    expect(hero).toMatch(/method=["']get["']/i)
    expect(hero).toMatch(/\bname=["']url["']/)
    expect(hero).toMatch(/id=["']hero-landing-url["'][\s\S]{0,120}type=["']text["']/)
    expect(hero).not.toMatch(/id=["']hero-landing-url["'][\s\S]{0,80}type=["']url["']/)
    expect(hero).not.toContain('router.push')
    expect(hero).not.toContain('e.preventDefault()')
  })

  it('defers the homepage dashboard mock off the first parse', () => {
    const hero = read('app/components/HeroSection.tsx')

    expect(hero).toContain("from 'next/dynamic'")
    expect(hero).not.toMatch(
      /import\s+\{?\s*ScaledDashboard\s*\}?\s+from\s+['"]\.\/ScaledDashboard['"]/,
    )
    expect(hero).not.toContain("from './DashboardMockup'")
    expect(hero).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/ScaledDashboard['"]\)/)
  })

  it('loads workspace tab views via next/dynamic instead of static imports', () => {
    const source = read('app/workspace/WorkspaceClient.tsx')

    expect(source).toContain("from 'next/dynamic'")
    expect(source).not.toMatch(/import CompareView from ['"]\.\/compareView['"]/)
    expect(source).not.toMatch(/import CompetitorView from ['"]\.\/competitorView['"]/)
    expect(source).not.toMatch(/import AiSearchView from ['"]\.\/aiSearchView['"]/)
    expect(source).not.toMatch(/import RoiCalculatorView from ['"]\.\/roiCalculatorView['"]/)
    expect(source).not.toMatch(/import RecsView from ['"]\.\/recsView['"]/)
    expect(source).not.toMatch(/import PagesView from ['"]\.\/pagesView['"]/)
    expect(source).not.toMatch(/import ExperimentsView from ['"]\.\/experimentsView['"]/)
    expect(source).not.toMatch(/import ExperimentTrackerView from ['"]\.\/experimentTrackerView['"]/)
    expect(source).not.toMatch(/import BillingView from ['"]\.\/billingView['"]/)
    expect(source).not.toMatch(/import MonitoringView from ['"]\.\/monitoringView['"]/)
    expect(source).not.toMatch(/import DiffView from ['"]\.\/diffView['"]/)
    expect(source).not.toMatch(/import TimelineView from ['"]\.\/timelineView['"]/)
    expect(source).not.toMatch(/import ReportView from ['"]\.\/reportView['"]/)
    expect(source).not.toMatch(/import AchievementsView from ['"]\.\/achievementsView['"]/)
    expect(source).not.toMatch(/import AssistantView from ['"]\.\/assistantView['"]/)
    expect(source).not.toMatch(/import TeamView from ['"]\.\/teamView['"]/)
    expect(source).not.toMatch(/import SettingsView from ['"]\.\/settingsView['"]/)
    expect(source).not.toMatch(
      /import\s+\{\s*DashboardView,\s*AuditsView,\s*ProjectsView\s*\}\s+from\s+['"]\.\/views['"]/,
    )
    expect(source).toContain("from './planGate'")
    expect(source).toContain('canAccess')
    expect(source).toContain('TAB_ACCESS_REQUIREMENTS')
    expect(source).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\(/)
  })

  it('fetches unlocked audit results on the server and does not call /audit/run from results', () => {
    const page = read('app/audit/[id]/results/page.tsx')
    const client = read('app/audit/[id]/results/ResultsClient.tsx')

    expect(page).toContain('PLATFORM_API_URL')
    expect(page).toMatch(/\$\{API_BASE\}\/audit\/\$\{id\}/)
    expect(page).toContain('parseAuditResult')
    expect(page).toMatch(/initialResults/)
    expect(page).toMatch(/<ResultsClient[\s\S]*initialResults/)
    expect(page).not.toContain('/audit/run')
    expect(client).not.toMatch(/['"`]\/api\/audit\/run['"`]/)
    expect(client).not.toMatch(/['"`]\/audit\/run['"`]/)
  })
})
