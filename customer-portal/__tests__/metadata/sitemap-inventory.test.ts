import fs from 'fs'
import path from 'path'
import sitemap from '@/app/sitemap'
import { getArticles } from '@/app/learning-centre/lib/getArticles'

const ORIGIN = 'https://nebulacomponents.shop'
const LC_DIR = path.join(process.cwd(), 'app', 'learning-centre')
const SKIP_DIRS = new Set(['lib', 'citable'])

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

  it('has a meta.json for every learning-centre article directory, so none silently drop from the sitemap', () => {
    // Regression guard for the 2026-07-26 incident: founder-second-brain,
    // linkedin-skill-engine, and specialist-ai-agent-library shipped as live
    // pages with no meta.json, so getArticles() silently excluded them from
    // the sitemap the moment it switched from a hand-maintained slug array
    // to a filesystem scan. A missing meta.json should fail CI, not ship quietly.
    const articleDirs = fs
      .readdirSync(LC_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !SKIP_DIRS.has(entry.name) && !entry.name.startsWith('['))
      .map((entry) => entry.name)

    const missingMeta = articleDirs.filter(
      (slug) => !fs.existsSync(path.join(LC_DIR, slug, 'meta.json'))
    )

    expect(missingMeta).toEqual([])
  })
})
