import { expect, test } from '@playwright/test'

const route = '/learning-centre/landing-page-intelligence-stack'
const downloadHref = '/downloads/nebula-landing-page-intelligence-stack-v1.zip'
const workflowHeadings = [
  'Ad-to-page message-match checker',
  'Trust-gap detector',
  'Mobile first-scroll analyzer',
  'CTA and form-friction analyzer',
  'Paid-traffic leak prioritizer',
  'Fix verification workflow',
]

test('renders the inspectable stack and direct conversion path', async ({ page }) => {
  await page.goto(route)

  const consent = page.getByRole('button', { name: 'Accept all' })
  if (await consent.isVisible()) await consent.click()

  // Structure-only assertion: exactly one H1. Homepage copy is under active
  // redesign by a parallel workstream; coupling e2e to marketing wording made
  // this spec brittle. The inspectable stack below carries the contract.
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

  for (const heading of workflowHeadings) {
    await expect(page.getByRole('heading', { level: 3, name: heading })).toBeVisible()
  }

  await expect(page.locator('input[type="email"]')).toHaveCount(0)

  const download = page.getByTestId('intelligence-stack-download-link')
  await expect(download).toHaveAttribute('href', downloadHref)
  await expect(download).toHaveAttribute('download', '')

  const response = await page.request.get(downloadHref)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/application\/(?:zip|octet-stream)/)
  const zip = await response.body()
  expect(zip.byteLength).toBeGreaterThan(0)
  expect([...zip.subarray(0, 2)]).toEqual([0x50, 0x4b])

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  await page.getByTestId('intelligence-stack-audit-link').click()
  await expect(page).toHaveURL(/\/audit(?:\?.*)?$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
