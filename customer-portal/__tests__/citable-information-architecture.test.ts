import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import sitemap from '@/app/sitemap'
import CitableOverviewPage from '@/app/resources/citable/page'
import CitableQuickStartPage from '@/app/resources/citable/quick-start/page'
import CitableComparisonPage from '@/app/resources/citable/compare/page'
import CitableJobPage, {
  generateMetadata as generateJobMetadata,
  generateStaticParams,
} from '@/app/resources/citable/jobs/[slug]/page'
import CitableReleasesPage from '@/app/resources/citable/releases/page'
import {
  citableJobRoutes,
  citableLicenseFacts,
  citableQuickStartSteps,
  citableReleaseFacts,
  citableRoutes,
  getCitableProofRecords,
  getCitableMetadata,
  getPublishedCitableRoutes,
} from '@/app/resources/citable/content'

const ORIGIN = 'https://nebulacomponents.com'
const root = process.cwd()

const publishedPaths = [
  '/resources/citable',
  '/resources/citable/quick-start',
  '/resources/citable/jobs/technical-retrieval-audit',
  '/resources/citable/jobs/claim-evidence-governance',
  '/resources/citable/jobs/answer-extractability-audit',
  '/resources/citable/jobs/entity-narrative-audit',
  '/resources/citable/jobs/release-deployment-verification',
  '/resources/citable/compare',
  '/resources/citable/releases',
] as const

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

describe('Citable information architecture', () => {
  afterEach(cleanup)

  test('defines the exact bounded route map with compare and releases published atomically', () => {
    expect(citableRoutes.map(({ path }) => path)).toEqual(publishedPaths)
    expect(citableRoutes.filter(({ status }) => status === 'planned')).toEqual([])
    expect(getPublishedCitableRoutes({ includeOverview: true }).map(({ path }) => path))
      .toEqual(publishedPaths)
  })

  test.each([
    ['paths', citableRoutes.map(({ path: value }) => value)],
    ['titles', citableRoutes.map(({ title: value }) => value)],
    ['H1s', citableRoutes.map(({ h1: value }) => value)],
    ['primary questions', citableRoutes.map(({ primaryQuestion: value }) => value)],
  ])('has unique %s', (_label, values) => {
    expect(new Set(values).size).toBe(values.length)
    expect(values.every((value) => value.trim().length > 0)).toBe(true)
  })

  test('publishes exactly five distinct job records with the complete content contract', () => {
    expect(citableJobRoutes).toHaveLength(5)

    for (const job of citableJobRoutes) {
      expect(job.status).toBe('published')
      expect(job.path).toBe(`/resources/citable/jobs/${job.slug}`)
      expect(job.directAnswer.length).toBeGreaterThan(80)
      expect(job.observes.length).toBeGreaterThanOrEqual(3)
      expect(job.artifacts.length).toBeGreaterThanOrEqual(3)
      expect(job.limits.length).toBeGreaterThanOrEqual(3)
      expect(job.nextStep.length).toBeGreaterThan(40)
      expect(job.relatedPaths.length).toBeGreaterThanOrEqual(2)
    }
  })

  test('fails closed for every non-package proof category', () => {
    expect(getCitableProofRecords().map(({ key, status }) => [key, status])).toEqual([
      ['package', 'documented'],
      ['workflow', 'unknown'],
      ['deployment', 'unknown'],
      ['customer', 'not_published'],
      ['benchmark', 'not_published'],
    ])
  })

  test('derives package license display and schema URL from the release projection', () => {
    expect(citableLicenseFacts.identifier).toBe(citableReleaseFacts.license)
    expect(citableLicenseFacts.label).toBe(citableReleaseFacts.license.replace('-', ' '))
    expect(citableLicenseFacts.url).toContain(encodeURIComponent(citableReleaseFacts.license))
  })

  test('derives canonical metadata and version-pinned quick-start commands from the registry', () => {
    for (const route of getPublishedCitableRoutes({ includeOverview: true })) {
      expect(getCitableMetadata(route).alternates?.canonical)
        .toBe(`${ORIGIN}${route.path}`)
    }

    expect(citableQuickStartSteps.map(({ key }) => key)).toEqual([
      'install',
      'audit',
      'inspect',
      'decide',
      'verify',
    ])
    for (const step of citableQuickStartSteps) {
      for (const command of step.commands) {
        expect(command).toMatch(/^npx @nebulacomponents\/citable@\d+\.\d+\.\d+ /)
        expect(command).not.toContain('@latest')
      }
    }
  })

  test('overview renders one H1 and links every published child', () => {
    render(React.createElement(CitableOverviewPage))

    expect(screen.getByRole('heading', { level: 1, name: 'Build Defensible SEO and AI Readiness Evidence with Citable' })).toBeInTheDocument()
    for (const route of getPublishedCitableRoutes()) {
      expect(screen.getAllByRole('link', { name: new RegExp(route.h1, 'i') }).length)
        .toBeGreaterThan(0)
    }
    const softwareSchema = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? '{}'))
      .find((schema) => schema['@type'] === 'SoftwareApplication')
    expect(softwareSchema?.['@id']).toBe(
      'https://nebulacomponents.com/resources/citable#software',
    )
  })

  test('quick start renders the approved five-step flow and explicit proof boundary', () => {
    render(React.createElement(CitableQuickStartPage))

    for (const label of ['Install', 'Audit', 'Inspect evidence', 'Decide', 'Verify']) {
      expect(screen.getByRole('heading', { level: 2, name: label })).toBeInTheDocument()
    }
    expect(screen.getByText(/Customer cases and benchmark outcomes are not published/i))
      .toBeInTheDocument()
    expect(screen.getByText(/Workflow and deployment verification remain unavailable/i))
      .toBeInTheDocument()
    expect(screen.queryByText(/\b0 customer cases\b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\b0 benchmark outcomes\b/i)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('@latest')

    const schemaTypes = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? '{}')['@type'])
    expect(schemaTypes).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']))
  })

  test('static params, canonical metadata, and rendered job content all derive from the jobs registry', async () => {
    expect(generateStaticParams()).toEqual(citableJobRoutes.map(({ slug }) => ({ slug })))

    for (const job of citableJobRoutes) {
      const params = Promise.resolve({ slug: job.slug })
      const metadata = await generateJobMetadata({ params })
      expect(metadata.alternates?.canonical).toBe(`${ORIGIN}${job.path}`)

      const page = await CitableJobPage({ params: Promise.resolve({ slug: job.slug }) })
      const { unmount } = render(page)
      expect(screen.getByRole('heading', { level: 1, name: job.h1 })).toBeInTheDocument()
      expect(screen.getByText(job.directAnswer)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'What Citable observes' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Evidence artifacts' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'What the observation cannot establish' }))
        .toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Act on the bounded result' }))
        .toBeInTheDocument()
      const schemaTypes = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((script) => JSON.parse(script.textContent ?? '{}')['@type'])
      expect(schemaTypes).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']))
      unmount()
    }
  })

  test('missing job metadata and pages fail with a 404 signal', async () => {
    const params = Promise.resolve({ slug: 'not-a-citable-job' })
    await expect(generateJobMetadata({ params })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    })
    await expect(CitableJobPage({ params: Promise.resolve({ slug: 'not-a-citable-job' }) }))
      .rejects.toMatchObject({ digest: expect.stringContaining('404') })
  })

  test('has one registry and the shared rendering units', () => {
    for (const relativePath of [
      'app/resources/citable/content.ts',
      'components/citable/CitablePageShell.tsx',
      'components/citable/CitableProofPanel.tsx',
      'components/citable/CitableJobTemplate.tsx',
      'app/resources/citable/quick-start/page.tsx',
      'app/resources/citable/jobs/[slug]/page.tsx',
    ]) {
      expect(fs.existsSync(path.join(root, relativePath))).toBe(true)
    }
  })

  test('sitemaps every published route', () => {
    const urls = sitemap().map(({ url }) => url)

    for (const routePath of publishedPaths) {
      expect(urls).toContain(`${ORIGIN}${routePath}`)
    }
    expect(read('app/sitemap.ts')).toContain('getPublishedCitableRoutes')
  })

  test('removes runtime status proof, copied release history, and unsupported vendor comparisons', () => {
    const overview = read('app/resources/citable/page.tsx')

    expect(overview).not.toContain('api.github.com')
    expect(overview).not.toContain('getWorkflowStatus')
    expect(overview).not.toContain('getLastRelease')
    expect(overview).not.toMatch(/v1\.(?:0|1|2|3|4|5|6|7|8|9|10|11|12)\.0/)
    expect(overview).not.toMatch(/Profound|Scrunch|Ahrefs|Semrush/)
  })

  test('supporting routes use the existing article and breadcrumb schema helpers', () => {
    for (const relativePath of [
      'app/resources/citable/quick-start/page.tsx',
      'app/resources/citable/jobs/[slug]/page.tsx',
      'app/resources/citable/compare/page.tsx',
      'app/resources/citable/releases/page.tsx',
    ]) {
      const source = read(relativePath)
      expect(source).toContain('createArticleSchema')
      expect(source).toContain('createBreadcrumbSchema')
    }
  })

  test('does not duplicate projected release counts in render files', () => {
    for (const relativePath of [
      'app/resources/page.tsx',
      'app/resources/citable/page.tsx',
      'app/resources/citable/releases/page.tsx',
    ]) {
      const source = read(relativePath)
      expect(source).not.toMatch(/\b123 detectors\b/)
      expect(source).not.toMatch(/\b18 namespaces\b/)
      expect(source).not.toMatch(/\b27 registr(?:y|ies)\b/)
      expect(source).not.toContain('Apache 2.0')
      expect(source).not.toContain('www.apache.org/licenses/LICENSE-2.0')
    }
  })

  test('renders a category and workflow comparison with explicit bounded evidence states', () => {
    render(React.createElement(CitableComparisonPage))

    expect(screen.getByRole('heading', { level: 1, name: 'Discover When to Use Citable for AI Search Verification' }))
      .toBeInTheDocument()
    for (const state of ['Documented', 'Not assessed', 'Requires external source']) {
      expect(screen.getAllByText(state, { exact: true }).length).toBeGreaterThan(0)
    }
    expect(screen.getByText(/crawler is still required/i)).toBeInTheDocument()
    expect(screen.getByText(/rank tracker is still required/i)).toBeInTheDocument()
    expect(screen.getByText(/AI-visibility monitoring platform is still required/i)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Profound|Scrunch|Ahrefs|Semrush/)

    const schemaTypes = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? '{}')['@type'])
    expect(schemaTypes).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']))
  })

  test('renders the current release from the projection with controlled-surface links and unavailable proof disclosure', () => {
    render(React.createElement(CitableReleasesPage))

    expect(screen.getByRole('heading', { level: 1, name: 'Discover Synchronized Citable Releases and Package Facts' }))
      .toBeInTheDocument()
    expect(screen.getByText(`v${citableReleaseFacts.version}`)).toBeInTheDocument()
    expect(screen.getByText(citableReleaseFacts.source)).toBeInTheDocument()
    for (const href of [
      '/resources/citable/resource-data.json',
      '/resources/citable/llms.txt',
      '/resources/citable/README.md',
    ]) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument()
    }
    expect(screen.getAllByText(/deployment verification remains unavailable/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/workflow verification remains unavailable/i).length).toBeGreaterThan(0)

    const schemaTypes = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? '{}')['@type'])
    expect(schemaTypes).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']))
  })
})
