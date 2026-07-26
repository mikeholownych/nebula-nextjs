import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const learningCentreDir = join(process.cwd(), 'app', 'learning-centre')
const learningCentrePrefix = '/learning-centre/'

function articleSlugs() {
  return readdirSync(learningCentreDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('['))
    .flatMap((entry) => {
      try {
        const meta = JSON.parse(readFileSync(join(learningCentreDir, entry.name, 'meta.json'), 'utf8')) as { slug?: unknown }
        return typeof meta.slug === 'string' ? [meta.slug] : []
      } catch {
        return []
      }
    })
    .sort()
}

function learningCentreHrefs(html: string) {
  return [...html.matchAll(/href="(\/learning-centre\/[^"?#]+)"/g)].map((match) => match[1])
}

test('maps every article from the hub and only serves contextual Learning Centre links to real articles', async ({ request }) => {
  const slugs = articleSlugs()
  const validHrefs = new Set(slugs.map((slug) => `${learningCentrePrefix}${slug}`))
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
  expect([...contextualHrefs].every((href) => validHrefs.has(href))).toBe(true)
})
