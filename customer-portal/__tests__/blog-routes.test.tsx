import { render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import BlogIndex from '@/app/blog/page'
import BlogArticlePage, { generateMetadata } from '@/app/blog/[slug]/page'
import sitemap from '@/app/sitemap'
import { listArticles } from '@/app/lib/blog/loader'
import { renderMarkdown, safeMarkdownHref } from '@/app/blog/lib/render-markdown'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

function articleSchemas(): Record<string, unknown>[] {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
  return scripts.flatMap((script) => {
    const parsed = JSON.parse(script.textContent || '')
    return Array.isArray(parsed) ? parsed : [parsed]
  })
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

describe('local two-lane blog routes', () => {
  it('discovers both lanes and links only local articles', async () => {
    render(await BlogIndex())
    expect(screen.getByRole('heading', { name: /the nebula field notes/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Acquisition', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Feature', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /paid traffic not converting/i })).toHaveAttribute('href', '/blog/paid-traffic-not-converting')
    expect(screen.getByRole('link', { name: /what did we get wrong about filter-based targeting/i })).toHaveAttribute('href', '/blog/what-we-got-wrong-about-filter-based-targeting')
    expect(document.body.textContent).not.toMatch(/opinly/i)
  })

  it('renders acquisition content, CTA, metadata, valid schemas, and visible attribution', async () => {
    render(await BlogArticlePage({ params: Promise.resolve({ slug: 'paid-traffic-not-converting' }) }))
    expect(screen.getByRole('heading', { level: 1, name: /why is paid traffic not converting/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /run the free audit/i })).toHaveAttribute('href', '/audit')
    expect(screen.getByRole('banner')).toHaveTextContent('Published: 2026-09-04')
    expect(screen.getByRole('banner')).toHaveTextContent('Updated: 2026-09-04')
    expect(screen.getByRole('link', { name: /mike holownych/i })).toHaveAttribute('href', 'https://nebulacomponents.com/about/team')
    expect(screen.getByText(/founder of nebula components/i)).toBeInTheDocument()
    const schemas = articleSchemas()
    expect(schemas.map((schema) => schema['@type'])).toEqual(expect.arrayContaining(['Article', 'Organization', 'Person', 'FAQPage']))
    expect(schemas.find((schema) => schema['@type'] === 'Article')).toEqual(expect.objectContaining({ datePublished: '2026-09-04', dateModified: '2026-09-04' }))
    expect(schemas.find((schema) => schema['@type'] === 'FAQPage')).toEqual(expect.objectContaining({ mainEntity: expect.any(Array) }))
    expect(screen.queryAllByRole('navigation')).toHaveLength(0)
    expect(screen.queryAllByRole('contentinfo')).toHaveLength(0)
    const paragraphs = screen.getByRole('article').querySelectorAll('p')
    expect(wordCount(paragraphs[2]?.textContent || '')).toBeGreaterThanOrEqual(40)
    expect(wordCount(paragraphs[2]?.textContent || '')).toBeLessThanOrEqual(60)
    expect([...screen.getByRole('article').querySelectorAll('h2')].every((heading) => heading.textContent?.trim().endsWith('?'))).toBe(true)
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'paid-traffic-not-converting' }) })
    expect(metadata.alternates?.canonical).toBe('https://nebulacomponents.com/blog/paid-traffic-not-converting')
    expect(metadata.authors).toEqual([{ name: 'Mike Holownych' }])
    expect(metadata.openGraph?.publishedTime).toBe('2026-09-04')
  })

  it.each([
    'not-a-local-article', '../drafts/not-safe', 'javascript:alert(1)', 'javascript%3Aalert(1)', '..%2Fdrafts%2Fnot-safe', 'foo/..', 'foo\\u0000bar', 'foo\\nbar',
  ])('returns not found rather than throwing for invalid slug %s', async (slug) => {
    await expect(BlogArticlePage({ params: Promise.resolve({ slug }) })).rejects.toThrow(/NEXT_(HTTP_ERROR_FALLBACK;404|NOT_FOUND)/)
  })

  it('excludes the real draft fixture from public article discovery', async () => {
    expect((await listArticles()).map((article) => article.slug)).not.toContain('task-3-draft-fixture')
  })

  it.each([
    'paid-traffic-not-converting', 'what-we-got-wrong-about-filter-based-targeting',
  ])('renders complete valid schema and visible parity for %s', async (slug) => {
    render(await BlogArticlePage({ params: Promise.resolve({ slug }) }))
    const article = screen.getByRole('article')
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent?.trim().endsWith('?')).toBe(true)
    expect([...article.querySelectorAll('h2')].every((heading) => heading.textContent?.trim().endsWith('?'))).toBe(true)
    expect(article).toHaveTextContent('By Mike Holownych')
    expect(article).toHaveTextContent('Published: 2026-09-04')
    expect(article).toHaveTextContent('Updated: 2026-09-04')
    expect(screen.getByRole('link', { name: /mike holownych/i })).toHaveAttribute('href', 'https://nebulacomponents.com/about/team')
    const answer = article.querySelector('.blog-prose p')?.textContent || ''
    expect(wordCount(answer)).toBeGreaterThanOrEqual(40)
    expect(wordCount(answer)).toBeLessThanOrEqual(60)
    const schemas = articleSchemas()
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) expect(() => JSON.parse(script.textContent || '')).not.toThrow()
    expect(schemas.map((schema) => schema['@type'])).toEqual(expect.arrayContaining(['Article', 'Organization', 'Person', 'FAQPage']))
    const articleSchema = schemas.find((schema) => schema['@type'] === 'Article')!
    expect(articleSchema).toEqual(expect.objectContaining({ headline: h1.textContent, datePublished: '2026-09-04', dateModified: '2026-09-04' }))
    expect((articleSchema.author as Record<string, unknown>).name).toBe('Mike Holownych')
    expect((articleSchema.publisher as Record<string, unknown>).name).toBe('Nebula Components')
    const faq = schemas.find((schema) => schema['@type'] === 'FAQPage')!
    const visibleQuestions = [...article.querySelectorAll('h3')].map((heading) => heading.textContent?.trim())
    expect((faq.mainEntity as Array<Record<string, unknown>>).map((question) => question.name)).toEqual(visibleQuestions)
    expect(screen.queryAllByRole('navigation')).toHaveLength(0)
    expect(screen.queryAllByRole('contentinfo')).toHaveLength(0)
  })

  it('renders feature content without a commercial CTA', async () => {
    render(await BlogArticlePage({ params: Promise.resolve({ slug: 'what-we-got-wrong-about-filter-based-targeting' }) }))
    expect(screen.getByText(/filter-based targeting was too blunt/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /run the free audit/i })).not.toBeInTheDocument()
  })

  it('rejects executable markdown destinations and protocol obfuscation', () => {
    const unsafe = ['javascript:alert(1)', 'data:text/html,x', `${String.fromCharCode(0)}javascript:alert(1)`, `java${String.fromCharCode(10)}script:alert(1)`, 'java%0ascript:alert(1)']
    for (const destination of unsafe) expect(safeMarkdownHref(destination)).toBeNull()
    render(renderMarkdown(unsafe.map((destination, index) => `[bad${index}](${destination})`).join(' ') + ' [ok](/audit) [relative](guide/next) [外](https://example.com/path)'))
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'ok' })).toHaveAttribute('href', '/audit')
    expect(screen.getByRole('link', { name: 'relative' })).toHaveAttribute('href', 'guide/next')
    expect(screen.getByRole('link', { name: '外' })).toHaveAttribute('href', 'https://example.com/path')
  })

  it('emits only public local article URLs in the sitemap', async () => {
    const entries = await sitemap()
    const urls = entries.map((entry) => String(entry.url))
    expect(urls).toEqual(expect.arrayContaining([
      'https://nebulacomponents.com/blog/paid-traffic-not-converting',
      'https://nebulacomponents.com/blog/what-we-got-wrong-about-filter-based-targeting',
    ]))
    expect(urls).not.toContain(expect.stringContaining('/blog/draft'))
  })

  it('contains no Opinly delivery in local blog and sitemap sources', () => {
    const root = path.resolve(__dirname, '..')
    const sources = [
      'app/blog/page.tsx',
      'app/blog/[slug]/page.tsx',
      'app/lib/blog/loader.ts',
      'app/sitemap.ts',
    ].map((file) => readFileSync(path.join(root, file), 'utf8')).join('\\n')
    expect(sources).not.toMatch(/opinly/i)
  })

  it('removes the unused Opinly webhook route while retaining analytics pixel', () => {
    expect(existsSync(path.resolve(__dirname, '../app/api/opinly/route.ts'))).toBe(false)
    const layout = readFileSync(path.resolve(__dirname, '../app/layout.tsx'), 'utf8')
    expect(layout).toContain('id="opinly-pixel"')
    expect(layout).toContain('https://static.opinly.ai/p.js')
  })

  it('separates preserved analytics instrumentation from blog-runtime delivery evidence', () => {
    const root = path.resolve(__dirname, '..', '..')
    const report = readFileSync(path.join(root, '.superpowers/sdd/task-6-report.md'), 'utf8')
    const release = readFileSync(path.join(root, 'docs/releases/2026-09-05-local-blog-migration.md'), 'utf8')
    for (const document of [report, release]) {
      expect(document).toContain('analytics_pixel_preserved=true')
      expect(document).toContain('blog_runtime_opinly_delivery=false')
      expect(document).toContain('blog_route_opinly_markers_absent=true')
      expect(document).toContain('blog_api_request_markers_absent=true')
      expect(document).toContain('sitemap_opinly_markers_absent=true')
    }
  })
})
