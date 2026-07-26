import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

type LighthouseAssertion = [
  'error',
  {
    aggregationMethod: 'median'
    minScore?: number
    maxNumericValue?: number
  },
]

type LighthouseConfig = {
  ci: {
    collect: {
      settings: {
        chromeFlags: string
        preset: string
      }
      numberOfRuns: number
      startServerCommand: string
      startServerReadyPattern: string
      startServerReadyTimeout: number
      url: string[]
    }
    assert: {
      assertions: Record<string, LighthouseAssertion>
    }
    upload: {
      target: string
      outputDir: string
      reportFilenamePattern: string
    }
  }
}

function loadLighthouseConfig(): LighthouseConfig {
  const configPath = path.join(process.cwd(), 'lighthouserc.cjs')
  const script = `process.stdout.write(JSON.stringify(require(${JSON.stringify(configPath)})))`
  return JSON.parse(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }))
}

describe('Lighthouse CI lab performance budgets', () => {
  const expectedUrls = [
    'http://localhost:3102/learning-centre',
    'http://localhost:3102/learning-centre/landing-page-not-converting',
    'http://localhost:3102/resources/citable',
    'http://localhost:3102/resources/citable/jobs/technical-retrieval-audit',
  ]

  it('audits the four representative routes against explicit median lab gates', () => {
    const config = loadLighthouseConfig()

    expect(config.ci.collect.url).toEqual(expectedUrls)
    expect(config.ci.collect.numberOfRuns).toBeGreaterThanOrEqual(3)
    expect(config.ci.collect.startServerCommand).toBe('npm run start -- --port 3102')
    expect(new RegExp(config.ci.collect.startServerReadyPattern, 'i').test('✓ Ready in 250ms'))
      .toBe(true)
    expect(new RegExp(config.ci.collect.startServerReadyPattern, 'i').test('EADDRINUSE: address already in use'))
      .toBe(false)
    expect(config.ci.collect.startServerReadyTimeout).toBeGreaterThanOrEqual(60_000)
    expect(config.ci.collect.settings.chromeFlags.split(/\s+/)).toContain('--no-sandbox')
    expect(config.ci.collect.settings.preset).toBe('desktop')
    expect(config.ci.assert.assertions).toMatchObject({
      'categories:performance': [
        'error',
        { minScore: 0.9, aggregationMethod: 'median' },
      ],
      'largest-contentful-paint': [
        'error',
        { maxNumericValue: 2_500, aggregationMethod: 'median' },
      ],
      'cumulative-layout-shift': [
        'error',
        { maxNumericValue: 0.1, aggregationMethod: 'median' },
      ],
      'total-blocking-time': [
        'error',
        { maxNumericValue: 200, aggregationMethod: 'median' },
      ],
    })
  })

  it('keeps lab reports on the workflow filesystem instead of a public upload target', () => {
    const { upload } = loadLighthouseConfig().ci

    expect(upload.target).toBe('filesystem')
    expect(upload.outputDir).toBe('./lhci-results')
    expect(upload.reportFilenamePattern).toContain('%%PATHNAME%%')
    expect(upload.reportFilenamePattern).toContain('%%EXTENSION%%')
  })

  it('pins the npm-verified Lighthouse CI CLI release exactly', () => {
    const packageManifest = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    )
    const lockfile = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package-lock.json'), 'utf8'),
    )

    expect(packageManifest.devDependencies['@lhci/cli']).toBe('0.15.1')
    expect(lockfile.packages[''].devDependencies['@lhci/cli']).toBe('0.15.1')
    expect(lockfile.packages['node_modules/@lhci/cli'].version).toBe('0.15.1')
  })

  it('builds and audits in a labelled CI lab job, then retains reports even on failure', () => {
    const workflowSource = readFileSync(
      path.join(process.cwd(), '..', '.github', 'workflows', 'ci.yml'),
      'utf8',
    )
    const workflow = YAML.parse(workflowSource) as {
      jobs: Record<string, {
        name?: string
        steps?: Array<{
          name?: string
          run?: string
          uses?: string
          if?: string
          with?: Record<string, unknown>
        }>
      }>
    }
    const job = workflow.jobs.lighthouse
    const steps = job.steps ?? []
    const buildIndex = steps.findIndex(({ run }) => run === 'npm run build')
    const auditIndex = steps.findIndex(({ run }) => run === 'npm run test:performance')
    const artifact = steps.find(({ uses }) => uses === 'actions/upload-artifact@v4')

    expect(job.name).toMatch(/lab performance/i)
    expect(buildIndex).toBeGreaterThan(-1)
    expect(auditIndex).toBeGreaterThan(buildIndex)
    expect(steps[auditIndex].name).toMatch(/lab/i)
    expect(artifact).toMatchObject({
      if: 'always()',
      with: {
        path: 'customer-portal/lhci-results',
      },
    })
    expect(Number(artifact?.with?.['retention-days'])).toBeGreaterThanOrEqual(1)
  })

  it('keeps the audited Citable hero in normal flow despite legacy header styles', () => {
    const shellSource = readFileSync(
      path.join(process.cwd(), 'components', 'citable', 'CitablePageShell.tsx'),
      'utf8',
    )
    const headerClasses = shellSource
      .match(/<header className="([^"]+)"/)?.[1]
      .split(/\s+/)

    expect(headerClasses).toEqual(
      expect.arrayContaining([
        'static',
        'block',
        'bg-transparent',
        'p-0',
        'backdrop-blur-none',
      ]),
    )
  })

  it('does not prefetch every Citable hub destination during the overview audit', () => {
    const overviewSource = readFileSync(
      path.join(process.cwd(), 'app', 'resources', 'citable', 'page.tsx'),
      'utf8',
    )

    expect(overviewSource.match(/prefetch=\{false\}/g)?.length ?? 0)
      .toBeGreaterThanOrEqual(3)
  })

  it('keeps the Learning Centre accordion server-rendered without hydration work', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'app/learning-centre/CategoryAccordion.tsx'),
      'utf8',
    )

    expect(source).not.toContain("'use client'")
    expect(source).not.toContain('useState')
    expect(source).toContain('<details')
    expect(source).toContain('<summary')
  })

  it('keeps the Learning Centre directory free of client Link hydration and prefetch', () => {
    const hub = readFileSync(
      path.join(process.cwd(), 'app/learning-centre/page.tsx'),
      'utf8',
    )
    const directory = readFileSync(
      path.join(process.cwd(), 'app/learning-centre/CategoryAccordion.tsx'),
      'utf8',
    )

    expect(hub).not.toContain("from 'next/link'")
    expect(directory).not.toContain("from 'next/link'")
    expect(hub).not.toContain('<Link')
    expect(directory).not.toContain('<Link')
  })

  it('keeps responsive site navigation native instead of hydrating a toggle', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'components/SiteNav.tsx'),
      'utf8',
    )

    expect(source).not.toContain("'use client'")
    expect(source).not.toContain('useState')
    expect(source).toContain('<details')
    expect(source).toContain('<summary')
  })
})
