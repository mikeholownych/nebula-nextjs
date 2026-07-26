import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const learningCentreDir = join(process.cwd(), 'app', 'learning-centre')

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

test('serves every Learning Centre article link in the hub response before client JavaScript', async ({ request }) => {
  const response = await request.get('/learning-centre')
  expect(response.status()).toBe(200)

  const html = await response.text()
  const slugs = articleSlugs()

  expect(slugs).toHaveLength(45)
  for (const slug of slugs) {
    expect(html).toContain(`href="/learning-centre/${slug}"`)
  }
})
