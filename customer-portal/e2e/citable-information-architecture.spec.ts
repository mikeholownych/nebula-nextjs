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
  {
    path: '/resources/citable/compare',
    h1: 'Choose the right verification layer',
  },
  {
    path: '/resources/citable/releases',
    h1: 'Inspect the synchronized Citable release',
  },
] as const

for (const route of routes) {
  test(`${route.path} renders one canonical answer-first page`, async ({ page }) => {
    const response = await page.goto(route.path)

    expect(response?.status()).toBe(200)
    const rawHtml = await response?.text()
    expect(rawHtml).toContain('Workflow and deployment verification remain unavailable')
    if (route.path !== '/resources/citable') {
      expect(rawHtml).toContain('Article')
      expect(rawHtml).toContain('BreadcrumbList')
    }
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

test('overview links every published supporting page', async ({ page }) => {
  await page.goto('/resources/citable')

  for (const route of routes.slice(1)) {
    await expect(page.locator(`a[href="${route.path}"]`).first()).toBeVisible()
  }

})

test('comparison and release pages preserve their explicit evidence boundaries', async ({ page }) => {
  await page.goto('/resources/citable/compare')
  for (const state of ['Documented', 'Not assessed', 'Requires external source']) {
    await expect(page.getByText(state, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByText(/crawler is still required/i)).toBeVisible()
  await expect(page.getByText(/rank tracker is still required/i)).toBeVisible()
  await expect(page.getByText(/AI-visibility monitoring platform is still required/i)).toBeVisible()

  await page.goto('/resources/citable/releases')
  await expect(page.getByText(/workflow verification remains unavailable/i).first()).toBeVisible()
  await expect(page.getByText(/deployment verification remains unavailable/i).first()).toBeVisible()
  for (const href of [
    '/resources/citable/resource-data.json',
    '/resources/citable/llms.txt',
    '/resources/citable/README.md',
  ]) {
    await expect(page.locator(`a[href="${href}"]`)).toBeVisible()
  }
})

test('unknown Citable job slugs return 404', async ({ request }) => {
  const response = await request.get('/resources/citable/jobs/not-a-job')
  expect(response.status()).toBe(404)
})
