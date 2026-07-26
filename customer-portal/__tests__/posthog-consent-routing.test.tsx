/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CheckoutCTAButton from '@/app/checkout/CheckoutCTAButton'

describe('consented PostHog event routing', () => {
  it('sends a component event through the CDN client initialized after consent', async () => {
    const capture = jest.fn()
    ;(window as Window & { posthog?: unknown }).posthog = { capture }
    global.fetch = jest.fn().mockResolvedValue(
      Response.json({ code: 'CHECKOUT_UNAVAILABLE' }, { status: 503 }),
    )

    render(
      <CheckoutCTAButton
        auditId="123e4567-e89b-12d3-a456-426614174000"
        endpoint="/api/checkout"
        offerKey="fix-pack"
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: /continue to secure stripe checkout/i }),
    )

    await waitFor(() => {
      expect(capture).toHaveBeenCalledWith('checkout_initiated', {
        offer: 'fix-pack',
        destination: '/api/checkout',
      })
    })
  })
})
