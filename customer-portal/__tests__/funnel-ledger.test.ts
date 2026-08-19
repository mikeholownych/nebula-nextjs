/** @jest-environment node */

import {
  recordFunnelEvent,
  queryCanonicalFunnel,
  queryFurthestMeaningfulState,
  queryDataQualitySLOs,
  queryIntegrityViolations,
} from '@/app/lib/funnel-ledger'
import { pool } from '@/app/lib/db'

jest.mock('@/app/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}))

describe('Internal Funnel Event Ledger & Analytics Query Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('records funnel event with defaults and returns success', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: '11111111-2222-3333-4444-555555555555' }],
    })

    const result = await recordFunnelEvent({
      eventName: 'landing_page_view',
      sourceSystem: 'client_browser',
      landingPath: '/audit',
      utmSource: 'google',
    })

    expect(result.success).toBe(true)
    expect(result.id).toBe('11111111-2222-3333-4444-555555555555')
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  it('handles deduplication collision safely', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    })

    const result = await recordFunnelEvent({
      eventName: 'checkout_started',
      sourceSystem: 'server_api',
      checkoutSessionId: 'cs_test_123',
      dedupKey: 'checkout_cs_test_123',
      properties: {
        offer_key: 'fix_pack',
        price_cents: 9700,
        currency: 'USD',
      },
    })

    expect(result.success).toBe(true)
    expect(result.duplicate).toBe(true)
  })

  it('computes canonical funnel steps with accurate journey-denominated conversion and operational multiplicity', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { event_name: 'landing_page_view', stage: 'acquisition', reaching_journeys: '1000', operational_entities: '1000', total_events: '1200' },
        { event_name: 'audit_cta_clicked', stage: 'engagement', reaching_journeys: '500', operational_entities: '500', total_events: '550' },
        { event_name: 'audit_completed', stage: 'audit_execution', reaching_journeys: '250', operational_entities: '300', total_events: '320' },
        { event_name: 'purchase_completed', stage: 'purchase', reaching_journeys: '25', operational_entities: '25', total_events: '25' },
      ],
    })

    const funnel = await queryCanonicalFunnel([
      'landing_page_view',
      'audit_cta_clicked',
      'audit_completed',
      'purchase_completed',
    ])

    expect(funnel.totalInitialJourneys).toBe(1000)
    expect(funnel.steps).toHaveLength(4)

    // Step 1: Landing
    expect(funnel.steps[0].journeysReached).toBe(1000)
    expect(funnel.steps[0].countingEntity).toBe('session')
    expect(funnel.steps[0].stepConversionRate).toBe(100)
    expect(funnel.steps[0].abandonmentRate).toBe(0)
    expect(funnel.steps[0].entityMultiplicityRatio).toBe(1.0)

    // Step 2: CTA clicked
    expect(funnel.steps[1].journeysReached).toBe(500)
    expect(funnel.steps[1].countingEntity).toBe('session')
    expect(funnel.steps[1].stepConversionRate).toBe(50)
    expect(funnel.steps[1].abandonmentCount).toBe(500)
    expect(funnel.steps[1].abandonmentRate).toBe(50)

    // Step 3: Audit completed (multiplicity 300 / 250 = 1.2x)
    expect(funnel.steps[2].journeysReached).toBe(250)
    expect(funnel.steps[2].countingEntity).toBe('audit')
    expect(funnel.steps[2].stepConversionRate).toBe(50)
    expect(funnel.steps[2].abandonmentCount).toBe(250)
    expect(funnel.steps[2].entityMultiplicityRatio).toBe(1.2)

    // Step 4: Purchase completed
    expect(funnel.steps[3].journeysReached).toBe(25)
    expect(funnel.steps[3].countingEntity).toBe('transaction')
    expect(funnel.steps[3].stepConversionRate).toBe(10)
    expect(funnel.steps[3].funnelConversionRate).toBe(2.5)
  })

  it('runs Furthest Meaningful State query and assigns semantic categories correctly', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { state_name: 'landing_only', category: 'USER_EXIT', journey_count: '600', percentage: '60.0' },
        { state_name: 'audit_submitted', category: 'IN_FLIGHT', journey_count: '250', percentage: '25.0' },
        { state_name: 'result_viewed', category: 'USER_EXIT', journey_count: '100', percentage: '10.0' },
        { state_name: 'purchase_completed', category: 'TERMINAL_SUCCESS', journey_count: '50', percentage: '5.0' },
      ],
    })

    const report = await queryFurthestMeaningfulState()
    expect(report.totalJourneys).toBe(1000)
    expect(report.distribution).toHaveLength(4)
    expect(report.distribution[0].state).toBe('landing_only')
    expect(report.distribution[0].category).toBe('USER_EXIT')
    expect(report.distribution[0].journeyCount).toBe(600)
    expect(report.abandonmentDistribution).toHaveLength(2) // excludes TERMINAL_SUCCESS and IN_FLIGHT
  })

  it('evaluates Data Quality SLOs and completeness metrics', async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // orphan audit
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // orphan result
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // dup tx
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // orphan purchase
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // unknown events
      .mockResolvedValueOnce({ rows: [{ total_audits: '100', attributed_audits: '98' }] })
      .mockResolvedValueOnce({ rows: [{ total_checkouts: '20', linked_checkouts: '19' }] })
      .mockResolvedValueOnce({ rows: [{ total_purchases: '5', linked_purchases: '5' }] })

    const sloReport = await queryDataQualitySLOs()
    expect(sloReport.status).toBe('HEALTHY')
    expect(sloReport.slos.duplicateLiveTransactions).toBe(0)
    expect(sloReport.completeness.auditsWithAttributionPct).toBe(98)
    expect(sloReport.completeness.purchasesLinkedToCheckoutPct).toBe(100)
  })

  it('detects integrity violations (orphan purchases, duplicate transactions)', async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({
        // orphan purchases
        rows: [{ id: 'p1', transaction_id: 'tx_orphan_1', occurred_at: '2026-08-19T00:00:00Z', properties: {} }],
      })
      .mockResolvedValueOnce({
        // orphan result views
        rows: [{ id: 'r1', audit_id: 'a_orphan_1', occurred_at: '2026-08-19T00:00:00Z', properties: {} }],
      })
      .mockResolvedValueOnce({
        // duplicate purchases
        rows: [{ transaction_id: 'tx_dup_1', count: '2' }],
      })

    const violations = await queryIntegrityViolations()
    expect(violations.length).toBe(3)
    expect(violations[0].violationType).toBe('ORPHAN_PURCHASE')
    expect(violations[1].violationType).toBe('ORPHAN_RESULT_VIEW')
    expect(violations[2].violationType).toBe('DUPLICATE_PURCHASE')
  })
})
