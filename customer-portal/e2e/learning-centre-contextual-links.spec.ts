import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const learningCentreDir = join(process.cwd(), 'app', 'learning-centre')
const learningCentrePrefix = '/learning-centre/'

function articleSlugs() {
  const collect = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory() || entry.name.startsWith('[')) return []

    const articleDirectory = join(directory, entry.name)
    try {
      const meta = JSON.parse(readFileSync(join(articleDirectory, 'meta.json'), 'utf8')) as { slug?: unknown }
      return typeof meta.slug === 'string' ? [meta.slug] : collect(articleDirectory)
    } catch {
      return collect(articleDirectory)
    }
  })

  return collect(learningCentreDir).sort()
}

function learningCentreHrefs(html: string) {
  return [...html.matchAll(/href="(\/learning-centre\/[^"?#]+)"/g)].map((match) => match[1])
}

test('maps every article from the hub and only serves contextual Learning Centre links to real articles', async ({ request }) => {
  const slugs = articleSlugs()
  const validHrefs = new Set(slugs.map((slug) => `${learningCentrePrefix}${slug}`))
  const allowedContextualHrefs = new Set([...validHrefs, `${learningCentrePrefix}topic-guides`])
  const hub = await request.get('/learning-centre')
  const hubHtml = await hub.text()

  expect(hub.status()).toBe(200)
  expect(new Set(learningCentreHrefs(hubHtml))).toEqual(validHrefs)

  const contextualHrefs = new Set<string>()
  for (const slug of slugs) {
    const response = await request.get(`${learningCentrePrefix}${slug}`)
    expect(response.status()).toBe(200)
    for (const href of learningCentreHrefs(await response.text())) contextualHrefs.add(href)
  }

  expect(contextualHrefs.size).toBeGreaterThan(0)
  expect([...contextualHrefs].every((href) => allowedContextualHrefs.has(href))).toBe(true)
})
