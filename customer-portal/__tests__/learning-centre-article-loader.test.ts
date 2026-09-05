import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getArticles } from '@/app/learning-centre/lib/getArticles'

const nestedSlugs = [
  'landing-page-conversion-leaks',
  'conversion-rate-optimization-tools',
  'ad-spend-roi-improvement',
  'ai-traffic-optimization-vs-landing-page-builders',
]

function writeArticleFixture(root: string, slug: string) {
  const directory = path.join(root, ...slug.split('/'))
  mkdirSync(directory, { recursive: true })
  writeFileSync(path.join(directory, 'page.tsx'), 'export default function Page() { return null }\n')
  writeFileSync(
    path.join(directory, 'meta.json'),
    JSON.stringify({
      slug: path.basename(directory),
      title: slug,
      category: 'Conversion',
      description: `Description for ${slug}`,
    }),
  )
}

describe('Learning Centre article loader', () => {
  it('discovers nested articles, excludes a metadata-bearing hub, and preserves direct articles', () => {
    const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'learning-centre-loader-'))

    try {
      writeArticleFixture(fixtureRoot, 'topic-guides')
      for (const slug of nestedSlugs) writeArticleFixture(fixtureRoot, `topic-guides/${slug}`)

      const fixtureSlugs = new Set(getArticles(fixtureRoot).map((article) => article.slug))
      expect(fixtureSlugs).toEqual(
        new Set(nestedSlugs.map((slug) => `topic-guides/${slug}`)),
      )
      expect(fixtureSlugs).not.toContain('topic-guides')

      const realSlugs = new Set(getArticles().map((article) => article.slug))
      expect(realSlugs).toContain('landing-page-not-converting')
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true })
    }
  })
})
