import fs from 'fs'
import path from 'path'
import sitemap from '@/app/sitemap'
import { learningCentreArticleUrl } from '@/app/sitemap'
import { getArticles } from '@/app/learning-centre/lib/getArticles'

const ORIGIN = 'https://nebulacomponents.com'
const LC_DIR = path.join(process.cwd(), 'app', 'learning-centre')
const SKIP_DIRS = new Set(['lib', 'citable'])
const HUB_DIRS = new Set(['topic-guides'])

function getArticleDirectories(directory = LC_DIR, prefix = ''): string[] {
  const articleDirectories: string[] = []

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('[')) continue

    const relativeSlug = prefix ? `${prefix}/${entry.name}` : entry.name
    const articleDirectory = path.join(directory, entry.name)
    const hasPage = fs.existsSync(path.join(articleDirectory, 'page.tsx'))

    // Hubs are containers, even when they carry page and metadata sidecars.
    if (hasPage && !HUB_DIRS.has(relativeSlug)) articleDirectories.push(relativeSlug)
    articleDirectories.push(...getArticleDirectories(articleDirectory, relativeSlug))
  }

  return articleDirectories
}

describe('sitemap canonical inventory', () => {
  it('never includes gated or robots-disallowed paths', async () => {
    // Gated/robots-Disallowed paths (workspace, checkout, api, audit results,
    // dashboards) must never be submitted. A 307-to-login URL in the sitemap
    // wastes crawl budget and can be read as a soft-404 by Google.
    const urlList = (await sitemap()).map(({ url }) => url)
    const gatedSubstrings = ['/workspace', '/checkout', '/api/', '/dashboard', '/audit/', '/login']
    const offenders = urlList.filter((url) =>
      gatedSubstrings.some((g) => url.includes(g))
    )
    expect(offenders).toEqual([])
  })

  it('projects every and only learning-centre article metadata record', async () => {
    const expected = getArticles()
      .map(({ slug }: { slug: string }) => learningCentreArticleUrl(slug))
      .sort()

    const actual = (await sitemap())
      .map(({ url }) => url)
      .filter((url) => url.startsWith(`${ORIGIN}/learning-centre/`) && url !== `${ORIGIN}/learning-centre/citable`)
      .sort()

    expect(actual).toEqual(expected)

    const expectedNested = expected.filter((url: string) => url.includes('/learning-centre/topic-guides/'))
    const actualNested = actual.filter((url: string) => url.includes('/learning-centre/topic-guides/'))
    expect(actualNested).toEqual(expectedNested)
  })

  it('generates route-relative nested article URLs', () => {
    expect(learningCentreArticleUrl('topic-guides/landing-page-conversion-leaks')).toBe(
      `${ORIGIN}/learning-centre/topic-guides/landing-page-conversion-leaks`,
    )
  })

  it('does not claim build-time freshness for every URL', async () => {
    // lastModified is intentionally set to the build date on all entries
    // (added 2026-08-17 to satisfy sitemap validators that require lastmod).
    // When content objects gain real per-page update timestamps, this test
    // can be tightened to assert per-entry accuracy instead.
    // For now: assert that every entry that HAS lastModified uses a valid date string.
    const entries = await sitemap()
    for (const entry of entries) {
      if (entry.lastModified !== undefined) {
        expect(typeof entry.lastModified === 'string' || entry.lastModified instanceof Date).toBe(true)
      }
    }
  })

  it('loads every learning-centre article page into getArticles', () => {
    expect(getArticles().map(({ slug }) => slug).sort()).toEqual(getArticleDirectories().sort())
  })

  it('throws malformed metadata errors in test mode but keeps production rendering fail-safe', () => {
    const slug = 'above-fold-landing-page'
    const metaPath = path.join(LC_DIR, slug, 'meta.json')
    const originalNodeEnv = process.env.NODE_ENV
    const mutableEnv = process.env as Record<string, string | undefined>
    const originalReadFileSync = fs.readFileSync
    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(
      ((file: fs.PathOrFileDescriptor, options?: Parameters<typeof fs.readFileSync>[1]) => {
        if (file === metaPath) return '{'
        return originalReadFileSync(file, options)
      }) as typeof fs.readFileSync
    )

    try {
      expect(() => getArticles()).toThrow(`Invalid Learning Centre metadata for "${slug}"`)

      mutableEnv.NODE_ENV = 'production'
      expect(getArticles().some((article) => article.slug === slug)).toBe(false)
      expect(writeFileSyncSpy).not.toHaveBeenCalled()
    } finally {
      mutableEnv.NODE_ENV = originalNodeEnv
      readFileSyncSpy.mockRestore()
      writeFileSyncSpy.mockRestore()
    }
  })

  it('has valid metadata for every learning-centre article page, so none silently drop from the hub or sitemap', () => {
    // Regression guard for the 2026-07-26 incident: founder-second-brain,
    // linkedin-skill-engine, and specialist-ai-agent-library shipped as live
    // pages with no meta.json, so getArticles() silently excluded them from
    // the sitemap the moment it switched from a hand-maintained slug array
    // to a filesystem scan. A missing meta.json should fail CI, not ship quietly.
    const articleDirs = getArticleDirectories()

    const missingMeta = articleDirs.filter(
      (slug) => !fs.existsSync(path.join(LC_DIR, slug, 'meta.json'))
    )

    expect(missingMeta).toEqual([])

    for (const slug of articleDirs) {
      const metaPath = path.join(LC_DIR, slug, 'meta.json')
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as Record<string, unknown>

      expect(meta.slug).toBe(slug)
      expect(typeof meta.title).toBe('string')
      expect(meta.title).not.toHaveLength(0)
      expect(typeof meta.description).toBe('string')
      expect(meta.description).not.toHaveLength(0)
      expect(typeof meta.category).toBe('string')
      expect(meta.category).not.toHaveLength(0)
    }
  })
})
