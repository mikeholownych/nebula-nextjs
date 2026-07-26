import { expect, test } from '@playwright/test'

const routes = [
  {
    path: '/resources/citable',
    h1: 'Citable',
  },
  {
    path: '/resources/citable/quick-start',
    h1: 'Run your first evidence-bounded Citable audit',
  },
  {
    path: '/resources/citable/jobs/technical-retrieval-audit',
    h1: 'Audit technical retrieval eligibility',
  },
  {
    path: '/resources/citable/jobs/claim-evidence-governance',
    h1: 'Govern claims against inspectable evidence',
  },
  {
    path: '/resources/citable/jobs/answer-extractability-audit',
    h1: 'Audit answer extractability',
  },
  {
    path: '/resources/citable/jobs/entity-narrative-audit',
    h1: 'Audit entity and narrative consistency',
  },
  {
    path: '/resources/citable/jobs/release-deployment-verification',
    h1: 'Verify release and deployment evidence',
  },
] as const

for (const route of routes) {
  test(`${route.path} renders one canonical answer-first page`, async ({ page }) => {
    const response = await page.goto(route.path)

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: route.h1 })).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://nebulacomponents.shop${route.path}`,
    )
    await expect(page.getByText(/Customer cases and benchmark outcomes are not published/i)).toBeVisible()
    await expect(page.getByText(/Workflow and deployment verification remain unavailable/i)).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('overview links every published supporting page and no planned page', async ({ page }) => {
  await page.goto('/resources/citable')

  for (const route of routes.slice(1)) {
    await expect(page.locator(`a[href="${route.path}"]`).first()).toBeVisible()
  }

  await expect(page.locator('a[href="/resources/citable/compare"]')).toHaveCount(0)
  await expect(page.locator('a[href="/resources/citable/releases"]')).toHaveCount(0)
})

test('unknown Citable job slugs return 404', async ({ request }) => {
  const response = await request.get('/resources/citable/jobs/not-a-job')
  expect(response.status()).toBe(404)
})
