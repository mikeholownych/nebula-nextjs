import { test, expect } from '@playwright/test'

/**
 * D1 regression: production QA found the checkout button dead because the
 * page's JS chunks 500'd at the CDN - no unit test can see that, and even a
 * rendered-DOM check passes because nothing asserts a real network request.
 *
 * This spec drives a real click against the built app and asserts the
 * checkout API call actually leaves the browser (hydration proof). The
 * request is intercepted, so no Stripe session is created; we assert on the
 * outbound call, not its commercial result.
 */
test('checkout CTA hydrates and issues POST /api/checkout', async ({ page }) => {
  const checkoutCalls: Array<{ url: string; body?: string }> = []

  await page.route('**/api/checkout', async (route) => {
    const request = route.request()
    checkoutCalls.push({ url: request.url(), body: request.postData() ?? undefined })
    // Fulfill with a deterministic error envelope - the assertion is that the
    // request fired, not that a Stripe session was created.
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Checkout unavailable in e2e', code: 'CHECKOUT_UNAVAILABLE' }),
    })
  })

  // The CTA only mounts for an eligible audit (server-side UUID check).
  await page.goto('/checkout?audit_id=123e4567-e89b-12d3-a456-426614174000')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const cta = page.getByRole('button', { name: /continue to secure stripe checkout/i })
  await expect(cta).toBeVisible({ timeout: 15_000 })
  await cta.click()

  // The click must produce exactly one real network call to the checkout API.
  await expect
    .poll(() => checkoutCalls.length, { timeout: 10_000 })
    .toBeGreaterThanOrEqual(1)
  expect(checkoutCalls[0].url).toContain('/api/checkout')

  // The surfaced state must be the API's error message, not a dead button -
  // proves the response path is wired too, not just the request path.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Secure checkout is unavailable' }),
  ).toHaveText('Secure checkout is unavailable right now. Please try again.', {
    timeout: 10_000,
  })
})
