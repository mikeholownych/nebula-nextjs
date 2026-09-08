/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(
  path.join(process.cwd(), 'app/audit/[id]/results/ResultsClient.tsx'),
  'utf8',
)

const plansSource = readFileSync(
  path.join(process.cwd(), 'app/lib/subscription-plans.ts'),
  'utf8',
)

describe('results page MRR visibility (Mimetic finding #2)', () => {
  it('imports the canonical subscription plans into the results page', () => {
    expect(source).toContain("from '@/app/lib/subscription-plans'")
    expect(source).toContain('SUBSCRIPTION_PLANS')
    expect(source).toContain('PAID_PLAN_KEYS')
  })

  it('renders the paid plans by name at the decision point', () => {
    // The results page maps over PAID_PLAN_KEYS and renders plan.name.
    expect(source).toContain('PAID_PLAN_KEYS.map')
    expect(source).toContain('plan.name')
    expect(source).toContain('plan.monthlyUsd')
  })

  it('the canonical plan source carries the recurring prices', () => {
    expect(plansSource).toContain('monthlyUsd: 29')
    expect(plansSource).toContain('monthlyUsd: 79')
    expect(plansSource).toContain('monthlyUsd: 497')
  })

  it('links to the pricing page for the full plan comparison', () => {
    expect(source).toContain('/pricing')
  })

  it('keeps the one-time $97 repair as the primary offer, not replaced by MRR', () => {
    expect(source).toContain('Get the repair: $${REPAIR_SPRINT_OFFER.priceUsd}')
  })

  it('does not promise conversion lift from the monitoring plans', () => {
    expect(source).not.toContain('monitoring guarantees')
    expect(source).not.toContain('monitoring will increase conversions')
  })
})
