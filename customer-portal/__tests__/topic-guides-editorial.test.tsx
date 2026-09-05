import { cleanup, render, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const topicArticles = [
  'landing-page-conversion-leaks',
  'conversion-rate-optimization-tools',
  'ad-spend-roi-improvement',
  'ai-traffic-optimization-vs-landing-page-builders',
] as const

type TopicArticleSlug = (typeof topicArticles)[number]
type TopicMetadata = {
  slug?: unknown
  title?: unknown
  description?: unknown
}

const topicGuideRoot = path.join(process.cwd(), 'app', 'learning-centre', 'topic-guides')
const unsupportedOutcomeLanguage = /\b(?:guarantees?|will increase|consistently outperforms?)\b/i

function requiredFile(filePath: string, description: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${description}: expected ${filePath}`)
  }

  return readFileSync(filePath, 'utf8')
}

function metadataFor(slug: TopicArticleSlug): TopicMetadata {
  const metadataPath = path.join(topicGuideRoot, slug, 'meta.json')
  const raw = requiredFile(metadataPath, `Topic Guide metadata sidecar for ${slug}`)

  try {
    return JSON.parse(raw) as TopicMetadata
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : ''
    throw new Error(`Invalid JSON in Topic Guide metadata sidecar for ${slug}${detail}`)
  }
}

function metadataIsValid(slug: TopicArticleSlug) {
  const metadata = metadataFor(slug)

  expect(metadata.slug).toBe(slug)
  expect(typeof metadata.title).toBe('string')
  expect(String(metadata.title).trim()).not.toBe('')
  expect(typeof metadata.description).toBe('string')
  expect(String(metadata.description).trim()).not.toBe('')
}

describe('topic guide editorial contract', () => {
  afterEach(cleanup)

  it('exposes the governed topic guide hub and every planned article route', async () => {
    const mod = await import('@/app/learning-centre/topic-guides/page')
    const { container } = render(<mod.default />)
    const main = container.querySelector('main')

    expect(main).not.toBeNull()
    const answer = main!.querySelector<HTMLElement>('section[data-editorial="answer-first"]')
    expect(answer).not.toBeNull()
    expect(main!.querySelector('h1')).toHaveTextContent(/landing page topic guides/i)
    expect(within(answer!).getByRole('heading', { name: /direct answer/i })).toBeInTheDocument()
    expect(within(answer!).getByRole('note', { name: /evidence boundary/i })).toBeInTheDocument()

    const guideSection = main!.querySelector<HTMLElement>('section[aria-labelledby="guide-list-heading"]')
    expect(guideSection).not.toBeNull()
    expect(answer!.compareDocumentPosition(guideSection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

    const guideCards = topicArticles.map((slug) =>
      guideSection!.querySelector<HTMLAnchorElement>(`a[href="/learning-centre/topic-guides/${slug}"]`),
    )
    expect(guideCards).toHaveLength(4)
    expect(guideCards.every(Boolean)).toBe(true)
    expect(guideSection!.querySelectorAll('a[href^="/learning-centre/topic-guides/"]').length).toBe(4)
    for (const [index, card] of guideCards.entries()) {
      expect(card).not.toBeNull()
      expect(card!).toHaveTextContent(new RegExp(topicArticles[index].replaceAll('-', ' '), 'i'))
      expect(card!.textContent?.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4)
      expect(card!.textContent).not.toMatch(/^(?:click here|here|learn more|read more|more)$/i)
    }

    expect(main!.querySelector('a[href="/best-landing-page-audit-tools"]')).toHaveTextContent(
      /compare landing page audit tools/i,
    )
    const auditCta = main!.querySelector<HTMLAnchorElement>(
      'a[href="/audit?utm_source=topic-guides&utm_medium=organic-content"]',
    )
    expect(auditCta).not.toBeNull()
    expect(auditCta).toHaveAccessibleName('Run the free landing page audit')

    const collectionSchema = Array.from(
      main!.parentElement!.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
    ).some((script) => {
      try {
        const schema = JSON.parse(script.textContent ?? '{}') as Record<string, unknown>
        const entity = schema.mainEntity as Record<string, unknown> | undefined
        const items = entity?.itemListElement as Array<Record<string, unknown>> | undefined
        const schemaUrls = items?.map((item) => item.url)
        return schema['@type'] === 'CollectionPage' &&
          entity?.['@type'] === 'ItemList' &&
          entity.numberOfItems === 4 &&
          JSON.stringify(schemaUrls) === JSON.stringify(
            topicArticles.map((slug) => `https://nebulacomponents.com/learning-centre/topic-guides/${slug}`),
          )
      } catch {
        return false
      }
    })
    expect(collectionSchema).toBe(true)
  })

  it.skip.each(topicArticles)('publishes metadata for the planned route: %s', (slug) => {
    metadataIsValid(slug)
  })

  it.skip.each(topicArticles)('has governed answer-first coverage: %s', async (slug) => {
    const mod = await import(`@/app/learning-centre/topic-guides/${slug}/page`)
    const { container } = render(<mod.default />)
    const main = container.querySelector('main')
    const answer = container.querySelector<HTMLElement>(
      'section[data-editorial="answer-first"]',
    )
    const articleSchema = Array.from(
      container.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
    ).some((script) => {
      try {
        const schema = JSON.parse(script.textContent ?? '{}') as Record<string, unknown>
        return schema['@type'] === 'Article'
      } catch {
        return false
      }
    })

    expect(main).not.toBeNull()
    expect(articleSchema).toBe(true)
    expect(answer).not.toBeNull()
    expect(within(answer!).getByRole('heading', { name: /direct answer/i })).toBeInTheDocument()
    expect(within(answer!).getByRole('note', { name: /evidence boundary/i })).toBeInTheDocument()
    expect(main!.innerHTML).toContain('/learning-centre/topic-guides')
    expect(main!.innerHTML).toMatch(
      new RegExp(`/audit\\?utm_source=topic-guide-${slug}[^"']*utm_medium=organic-content`),
    )

    const clusterLinks = Array.from(
      answer!.querySelectorAll<HTMLAnchorElement>('a[href^="/learning-centre/topic-guides/"]'),
    )
    expect(clusterLinks.length).toBeGreaterThanOrEqual(2)
    for (const link of clusterLinks) {
      const href = link.getAttribute('href') ?? ''
      const match = href.match(/^\/learning-centre\/topic-guides\/([^/?#]+)$/)
      expect(match).not.toBeNull()

      const relatedSlug = match?.[1] as TopicArticleSlug | undefined
      expect(topicArticles).toContain(relatedSlug)
      expect(relatedSlug).not.toBe(slug)
      if (!relatedSlug || relatedSlug === slug || !topicArticles.includes(relatedSlug)) continue

      requiredFile(
        path.join(topicGuideRoot, relatedSlug, 'page.tsx'),
        `related Topic Guide page source for ${relatedSlug} linked from ${slug}`,
      )
      metadataIsValid(relatedSlug)

      const label = link.textContent?.trim() ?? ''
      expect(label.split(/\s+/).length).toBeGreaterThanOrEqual(4)
      expect(label).not.toMatch(/^(?:click here|here|learn more|read more|more)$/i)
    }
  })

  it('rejects em dashes and unsupported outcome language across governed files', () => {
    const governedFiles = [
      path.join(topicGuideRoot, 'page.tsx'),
      ...topicArticles.flatMap((slug) => [
        path.join(topicGuideRoot, slug, 'page.tsx'),
        path.join(topicGuideRoot, slug, 'meta.json'),
      ]),
    ]

    for (const filePath of governedFiles) {
      if (!existsSync(filePath)) continue

      const source = readFileSync(filePath, 'utf8')
      expect(source).not.toContain('\u2014')
      expect(source).not.toMatch(unsupportedOutcomeLanguage)
    }
  })
})
