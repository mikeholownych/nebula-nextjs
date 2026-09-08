/** @jest-environment node */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const LC_DIR = path.join(process.cwd(), 'app/learning-centre')

// Directories that are not standalone articles (shared code, nested routes).
const NON_ARTICLE_DIRS = new Set(['lib', 'topic-guides'])

function articleDirs(): string[] {
  return readdirSync(LC_DIR).filter((name) => {
    const full = path.join(LC_DIR, name)
    if (!statSync(full).isDirectory()) return false
    if (NON_ARTICLE_DIRS.has(name)) return false
    // Must contain a page.tsx to be a real article route.
    return statSync(path.join(full, 'page.tsx'), { throwIfNoEntry: false })?.isFile() ?? false
  })
}

function pageSource(slug: string): string {
  return readFileSync(path.join(LC_DIR, slug, 'page.tsx'), 'utf8')
}

describe('learning-centre FAQ coverage (Neogenio AEO finding)', () => {
  it('every learning-centre article carries a FAQPage schema', () => {
    const missing: string[] = []
    for (const slug of articleDirs()) {
      const src = pageSource(slug)
      const hasFaq =
        src.includes('FAQPage') ||
        src.includes('ArticleFaq') ||
        src.includes('createFAQPageSchema')
      if (!hasFaq) missing.push(slug)
    }
    expect(missing).toEqual([])
  })

  it('every learning-centre article renders a visible FAQ section', () => {
    const missing: string[] = []
    for (const slug of articleDirs()) {
      const src = pageSource(slug)
      const hasVisibleFaq =
        /frequently asked questions/i.test(src) ||
        src.includes('<ArticleFaq')
      if (!hasVisibleFaq) missing.push(slug)
    }
    expect(missing).toEqual([])
  })

  it('the ArticleFaq component emits both schema and visible section', () => {
    const src = readFileSync(path.join(LC_DIR, 'ArticleFaq.tsx'), 'utf8')
    expect(src).toContain('FAQPage')
    expect(src).toContain('Frequently asked questions')
    expect(src).toContain('application/ld+json')
  })
})
