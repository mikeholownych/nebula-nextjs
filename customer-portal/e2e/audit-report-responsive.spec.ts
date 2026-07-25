import { test, expect } from '@playwright/test'

const auditFixture = {
  audit_id: '00000000-0000-4000-8000-000000000001',
  url: 'https://example.com',
  status: 'completed',
  score: 5.3,
  grade: 'C',
  email: 'anonymous@example.com',
  findings: [
    {
      key: 'ai_readiness',
      label: 'AI Readiness',
      impact: 7,
      effort: 5,
      quadrant: 'major_project',
      issue: 'AI citation needs structured data.',
      fix: 'Add JSON-LD Organization schema and use a very long unbroken/source-like reference growth_system/ai_citation_source_map.md for verification.',
      evidence: {
        measured: 'No JSON-LD observed',
        required: 'Parseable JSON-LD',
        delta: 'Missing structured data',
        selector: 'head',
        timestamp: '2026-07-25T20:41:49Z',
        confidence: 'contextual',
      },
    },
  ],
}

test('audit report contains horizontal navigation and long evidence on mobile', async ({ page }) => {
  await page.route('**/api/audit/00000000-0000-4000-8000-000000000001', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(auditFixture) })
  })

  await page.goto('/audit/00000000-0000-4000-8000-000000000001/results')
  await expect(page.getByRole('heading', { name: 'Landing Page Audit Results' })).toBeVisible()

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))

  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
})
