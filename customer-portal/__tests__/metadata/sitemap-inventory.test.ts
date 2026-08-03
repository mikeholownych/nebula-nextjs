import fs from 'fs'
import path from 'path'
import sitemap from '@/app/sitemap'
import { getArticles } from '@/app/learning-centre/lib/getArticles'

const ORIGIN = 'https://nebulacomponents.com'
const LC_DIR = path.join(process.cwd(), 'app', 'learning-centre')
const SKIP_DIRS = new Set(['lib', 'citable'])

function getArticleDirectories(): string[] {
  return fs
    .readdirSync(LC_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !SKIP_DIRS.has(entry.name) &&
        !entry.name.startsWith('[') &&
        fs.existsSync(path.join(LC_DIR, entry.name, 'page.tsx'))
    )
    .map((entry) => entry.name)
}

describe('sitemap canonical inventory', () => {
  it('projects every and only learning-centre article metadata record', () => {
    const expected = getArticles()
      .map(({ slug }) => `${ORIGIN}/learning-centre/${slug}`)
      .sort()

    const actual = sitemap()
      .map(({ url }) => url)
      .filter((url) => url.startsWith(`${ORIGIN}/learning-centre/`) && url !== `${ORIGIN}/learning-centre/citable`)
      .sort()

    expect(actual).toEqual(expected)
  })

  it('does not claim build-time freshness for every URL', () => {
    expect(sitemap().every(({ lastModified }) => lastModified === undefined)).toBe(true)
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
