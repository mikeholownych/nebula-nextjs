import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import {
  loadArticle,
  listArticles,
  parseArticle,
  validateSourceRefs,
} from '@/app/lib/blog/loader'

describe('local blog article contract', () => {
  const acquisitionFixture = `---
slug: landing-page-not-converting
status: approved
content_lane: acquisition
post_type: diagnostic-guide
author_id: mike-holownych
category: Landing Page Leaks
primary_query: landing page not converting
supporting_queries:
  - landing page conversion audit
purpose: organic-discovery
commercial_role: audit-entry
evidence_level: first_party
source_refs:
  - audit-pattern-2026-09
published_at: 2026-09-04
updated_at: 2026-09-04
reviewed_by: mike-holownych
---

# Why is my landing page not converting?

A measured answer from Nebula.`

  const featureFixture = acquisitionFixture
    .replace('landing-page-not-converting', 'what-we-got-wrong-about-filter-based-targeting')
    .replace('status: approved', 'status: published')
    .replace('content_lane: acquisition', 'content_lane: feature')
    .replace('post_type: diagnostic-guide', 'post_type: assumption-report')
    .replace('category: Landing Page Leaks', 'category: Assumption Reports')
    .replace('primary_query: landing page not converting\n', '')
    .replace('supporting_queries:\n  - landing page conversion audit\n', '')
    .replace('purpose: organic-discovery', 'purpose: trust')
    .replace('commercial_role: audit-entry', 'commercial_role: assisted-conversion')

  it('parses acquisition and feature fixtures into the same strict model', () => {
    const acquisition = parseArticle(acquisitionFixture, 'fixture-acquisition.md')
    const feature = parseArticle(featureFixture, 'fixture-feature.md')

    expect(acquisition.content_lane).toBe('acquisition')
    expect(feature.content_lane).toBe('feature')
    expect(acquisition.post_type).toBe('diagnostic-guide')
    expect(feature.post_type).toBe('assumption-report')
    expect(acquisition.body).toContain('# Why is my landing page not converting?')
    expect(feature.body).toContain('# Why is my landing page not converting?')
  })

  it.each(['ready', 'live', 'unknown'])('rejects unsupported status %s', (status) => {
    expect(() => parseArticle(acquisitionFixture.replace('approved', status), 'invalid.md')).toThrow(
      'Unsupported article status',
    )
  })

  it('rejects an article with no source references', () => {
    expect(() => parseArticle(acquisitionFixture.replace('source_refs:\n  - audit-pattern-2026-09', 'source_refs: []'), 'missing.md')).toThrow(
      'source_refs',
    )
  })

  it.each([
    ['primary_query', 'primary_query: 42'],
    ['supporting_queries', 'supporting_queries: 42'],
    ['published_at', 'published_at: 42'],
    ['updated_at', 'updated_at: 42'],
    ['reviewed_by', 'reviewed_by: 42'],
  ])('rejects a non-string optional field: %s', (field, replacement) => {
    const source = acquisitionFixture.replace(new RegExp(`^${field}:.*$`, 'm'), replacement)
    expect(() => parseArticle(source, `invalid-${field}.md`)).toThrow(`Invalid article field: ${field}`)
  })

  it('reports source references that are absent from the source index', () => {
    const article = parseArticle(acquisitionFixture, 'fixture.md')
    const result = validateSourceRefs(article, new Set(['other-source']))

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing source reference: audit-pattern-2026-09')
  })

  it('rejects invalid content-lane and post-type combinations', () => {
    expect(() => parseArticle(acquisitionFixture.replace('content_lane: acquisition', 'content_lane: feature'), 'invalid-lane.md')).toThrow(
      'Unsupported post type',
    )
    expect(() => parseArticle(featureFixture.replace('post_type: assumption-report', 'post_type: diagnostic-guide'), 'invalid-post-type.md')).toThrow(
      'Unsupported post type',
    )
  })

  describe('filesystem discovery', () => {
    let contentRoot: string
    let originalCwd: string
    let originalContentRoot: string | undefined
    let reviewFixtureFiles: string[] = []

    // mkdtemp + mkdir + writeFile can exceed the 5000ms default under
    // --runInBand load; a timeout here leaks process.chdir() and poisons every
    // downstream suite that reads files by relative path. Give the hook room.
    beforeAll(async () => {
      originalCwd = process.cwd()
      originalContentRoot = process.env.NEBULA_CONTENT_ROOT
      contentRoot = await mkdtemp(path.join(tmpdir(), 'nebula-blog-loader-'))
      process.env.NEBULA_CONTENT_ROOT = contentRoot
      process.chdir(tmpdir())
      reviewFixtureFiles = [
        path.join(contentRoot, 'published', 'landing-page-not-converting.md'),
        path.join(contentRoot, 'published', 'what-we-got-wrong-about-filter-based-targeting.md'),
        path.join(contentRoot, 'drafts', 'draft-review-article.md'),
      ]
      await Promise.all([
        mkdir(path.join(contentRoot, 'published'), { recursive: true }),
        mkdir(path.join(contentRoot, 'drafts'), { recursive: true }),
      ])
      await Promise.all([
        writeFile(reviewFixtureFiles[0], acquisitionFixture, 'utf8'),
        writeFile(reviewFixtureFiles[1], featureFixture, 'utf8'),
        writeFile(reviewFixtureFiles[2], acquisitionFixture
          .replace('slug: landing-page-not-converting', 'slug: draft-review-article')
          .replace('status: approved', 'status: drafted'), 'utf8'),
      ])
    }, 30000)

    afterAll(async () => {
      // Defensive: if beforeAll timed out, reviewFixtureFiles is still [] and
      // contentRoot is undefined. Always restore cwd and env so a partial
      // setup can never leak process.chdir() into downstream suites.
      if (reviewFixtureFiles.length) {
        await Promise.all(reviewFixtureFiles.map((file) => rm(file, { force: true })))
      }
      if (contentRoot) {
        await rm(contentRoot, { recursive: true, force: true })
      }
      process.chdir(originalCwd)
      if (originalContentRoot === undefined) delete process.env.NEBULA_CONTENT_ROOT
      else process.env.NEBULA_CONTENT_ROOT = originalContentRoot
    }, 30000)

    it('loads and discovers articles outside the customer-portal working directory', async () => {
      await expect(loadArticle('landing-page-not-converting')).resolves.toEqual(
        expect.objectContaining({ slug: 'landing-page-not-converting' }),
      )
      await expect(listArticles()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ slug: 'landing-page-not-converting' }),
        expect.objectContaining({ slug: 'what-we-got-wrong-about-filter-based-targeting' }),
      ]))
    })

    it('loads a public article from a real content file', async () => {
      await expect(loadArticle('landing-page-not-converting')).resolves.toEqual(
        expect.objectContaining({ slug: 'landing-page-not-converting', status: 'approved' }),
      )
    })

    it('filters real articles by lane and public status while excluding drafts', async () => {
      await expect(listArticles({ lane: 'acquisition', status: 'approved' })).resolves.toEqual([
        expect.objectContaining({ slug: 'landing-page-not-converting', content_lane: 'acquisition', status: 'approved' }),
      ])
      await expect(listArticles({ lane: 'feature', status: 'published' })).resolves.toEqual([
        expect.objectContaining({ slug: 'what-we-got-wrong-about-filter-based-targeting', content_lane: 'feature', status: 'published' }),
      ])
      const articles = await listArticles()
      expect(articles.map((article) => article.slug)).toEqual(expect.arrayContaining([
        'landing-page-not-converting',
        'what-we-got-wrong-about-filter-based-targeting',
      ]))
      expect(articles).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ slug: 'draft-review-article' }),
      ]))
    })
  })

  it('rejects path traversal in article lookups', async () => {
    await expect(loadArticle('../drafts/not-safe')).rejects.toThrow('Invalid article slug')
  })
})
