import { fireEvent, render, screen } from '@testing-library/react'
import OfferCardVariant from '@/components/OfferCardVariant'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'

const trackClientFunnelEvent = jest.fn()

jest.mock('@/app/lib/client-funnel', () => ({
  trackClientFunnelEvent: (...args: unknown[]) => trackClientFunnelEvent(...args),
  trackVisibilityExposure: jest.fn(),
}))

describe('OfferCardVariant', () => {
  beforeEach(() => {
    trackClientFunnelEvent.mockClear()
  })

  it('renders the evidence-bounded outcome and canonical offer details', () => {
    render(<OfferCardVariant source="pricing" placement="repair-card" />)

    expect(screen.getByText(/know exactly which one thing to fix and how to fix it/i)).toBeInTheDocument()
    expect(screen.getByText(/one bounded condition for a one-time \$97/i)).toBeInTheDocument()
    expect(screen.getByText(/exact artifact: replacement copy/i)).toBeInTheDocument()
    expect(screen.getByText(/30-day same-scope re-audit/i)).toBeInTheDocument()
    expect(screen.getByText(/does not promise conversion lift/i)).toBeInTheDocument()

    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/guaranteed conversion|increase revenue|best/i)
  })

  it('tracks exposure and click with stable experiment attribution', () => {
    render(<OfferCardVariant source="pricing" placement="repair-card" auditId="audit-123" />)

    const beacon = screen.getByTestId('repair-sprint-offer-variant')
    expect(beacon).toHaveAttribute('data-variant-id', 'repair-sprint-outcome-v1')
    expect(beacon).toHaveAttribute('data-source', 'pricing')
    expect(beacon).toHaveAttribute('data-placement', 'repair-card')

    fireEvent.click(screen.getByRole('link', { name: /get the exact repair/i }))

    expect(trackClientFunnelEvent).toHaveBeenCalledWith(
      'repair_sprint_clicked',
      expect.objectContaining({
        offer_key: REPAIR_SPRINT_OFFER.key,
        placement: 'repair-card',
        variant_id: 'repair-sprint-outcome-v1',
        source: 'pricing',
      }),
      expect.objectContaining({ auditId: 'audit-123' }),
    )
  })
})
