/** @jest-environment node */

import citableRelease from '../data/citable-release.json'
import * as publicFactsModule from '../app/lib/public-facts'
import {
  getActiveFixPack,
  getCitablePublicFacts,
  getPublishedCaseStudies,
  publicFacts,
} from '../app/lib/public-facts'

const duringCurrentOffer = new Date('2026-07-26T12:00:00.000Z')

const cloneFacts = (): unknown => JSON.parse(JSON.stringify(publicFacts))

describe('canonical public facts', () => {
  test('exposes the current Fix Pack only while every required fact is valid', () => {
    expect(getActiveFixPack(publicFacts, duringCurrentOffer)).toMatchObject({
      status: 'active',
      priceCents: 9700,
      currency: 'USD',
      priceValidUntil: '2026-12-31',
      checkout: {
        provider: 'stripe',
        offerKey: 'fix-pack',
        url: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
      },
      delivery: {
        artifact: 'tailored_prompt_pack',
        method: 'automated_email',
        timing: 'within_minutes',
      },
      implementation: {
        owner: 'customer_or_developer',
        nebulaSiteAccess: 'none',
      },
      reAudit: {
        status: 'included',
        windowDays: 30,
      },
    })
  })

  test.each([
    ['inactive', (facts: any) => { facts.fixPack.status = 'inactive' }],
    ['invalid price', (facts: any) => { facts.fixPack.priceCents = 0 }],
    ['invalid price-validity date', (facts: any) => { facts.fixPack.priceValidUntil = '2027-02-31' }],
    ['expired', (facts: any) => { facts.fixPack.priceValidUntil = '2026-07-25' }],
    ['unsupported manual delivery', (facts: any) => { facts.fixPack.delivery.method = 'manual' }],
    ['bespoke implementation', (facts: any) => { facts.fixPack.implementation.owner = 'nebula' }],
    ['missing checkout identity', (facts: any) => { delete facts.fixPack.checkout.offerKey }],
    ['non-HTTPS checkout', (facts: any) => { facts.fixPack.checkout.url = 'http://example.com/pay' }],
    ['non-Stripe HTTPS checkout', (facts: any) => { facts.fixPack.checkout.url = 'https://example.com/pay' }],
    ['spoofed Stripe checkout host', (facts: any) => { facts.fixPack.checkout.url = 'https://buy.stripe.com.example.com/pay' }],
    ['unknown re-audit status', (facts: any) => { facts.fixPack.reAudit.status = 'unknown' }],
  ])('omits an %s Fix Pack fact', (_label, mutate) => {
    const facts = cloneFacts() as any
    mutate(facts)

    expect(getActiveFixPack(facts, duringCurrentOffer)).toBeUndefined()
  })

  test('omits the Fix Pack after its price-validity window', () => {
    expect(
      getActiveFixPack(publicFacts, new Date('2027-01-01T00:00:00.000Z')),
    ).toBeUndefined()
  })

  test('publishes no case studies in the current repository state', () => {
    expect(publicFacts.caseStudies.status).toBe('none_published')
    expect(getPublishedCaseStudies()).toEqual([])
  })

  test('omits incomplete case-study records instead of filling evidence gaps', () => {
    const complete = {
      slug: 'supported-example',
      title: 'Supported example',
      eyebrow: 'Evidence-backed case',
      description: 'A fully evidenced result.',
      outcome: 'Observed change',
      outcomeLabel: 'Measured during the stated window',
      situation: 'The starting state.',
      diagnosis: 'The evidenced finding.',
      fixes: ['The documented remediation.'],
      result: 'The observed result, without a causal guarantee.',
      evidenceUrl: 'https://nebulacomponents.shop/evidence/supported-example',
      measurementWindow: {
        startedAt: '2026-06-01',
        endedAt: '2026-06-30',
      },
      publicationPermission: {
        granted: true,
        grantedAt: '2026-07-01',
      },
      disclosure: 'Nebula performed the audit; the customer implemented the change.',
      publishedAt: '2026-07-15',
      modifiedAt: '2026-07-15',
    }

    const facts = cloneFacts() as any
    facts.caseStudies = {
      status: 'published',
      entries: [
        complete,
        { ...complete, slug: 'missing-evidence', evidenceUrl: '' },
        { ...complete, slug: 'missing-window', measurementWindow: undefined },
        {
          ...complete,
          slug: 'missing-permission',
          publicationPermission: { granted: false, grantedAt: '' },
        },
        { ...complete, slug: 'missing-disclosure', disclosure: '' },
        { ...complete, slug: 'missing-publication-date', publishedAt: '' },
      ],
    }

    expect(getPublishedCaseStudies(facts).map((study) => study.slug)).toEqual([
      'supported-example',
    ])

    facts.caseStudies.status = 'none_published'
    expect(getPublishedCaseStudies(facts)).toEqual([])
  })

  test('derives Citable release facts from the committed projection and keeps checks unknown', () => {
    expect(getCitablePublicFacts()).toEqual({
      package: citableRelease.package,
      version: citableRelease.version,
      releasedAt: citableRelease.releasedAt,
      detectorCount: citableRelease.detectorCount,
      namespaceCount: citableRelease.namespaceCount,
      registryCount: citableRelease.registryCount,
      nodeRequirement: citableRelease.nodeRequirement,
      license: citableRelease.license,
      source: citableRelease.source,
      workflowCheck: 'unknown',
      deploymentCheck: 'unknown',
    })
  })

  test('omits incomplete or unsupported Citable release facts', () => {
    const incomplete = cloneFacts() as any
    delete incomplete.citable.release.version
    expect(getCitablePublicFacts(incomplete)).toBeUndefined()

    const unsupported = cloneFacts() as any
    unsupported.citable.workflowCheck = 'passing'
    expect(getCitablePublicFacts(unsupported)).toBeUndefined()
  })

  test('accepts automatic fulfillment only for the immutable canonical paid receipt', () => {
    const module = publicFactsModule as unknown as {
      isCanonicalFixPackReceipt?: (receipt: unknown, source?: unknown) => boolean
    }
    expect(typeof module.isCanonicalFixPackReceipt).toBe('function')
    if (!module.isCanonicalFixPackReceipt) return

    const receipt = {
      livemode: true,
      payment_status: 'paid',
      currency: 'usd',
      amount_total: 9700,
      metadata: { offer_key: publicFacts.fixPack.checkout.offerKey },
    }

    expect(module.isCanonicalFixPackReceipt(receipt)).toBe(true)
    for (const invalid of [
      { ...receipt, livemode: false },
      { ...receipt, payment_status: 'unpaid' },
      { ...receipt, payment_status: undefined },
      { ...receipt, currency: 'eur' },
      { ...receipt, currency: undefined },
      { ...receipt, amount_total: 9699 },
      { ...receipt, amount_total: undefined },
      { ...receipt, metadata: {} },
      { ...receipt, metadata: undefined },
      { ...receipt, metadata: { offer_key: 'unknown-offer' } },
    ]) {
      expect(module.isCanonicalFixPackReceipt(invalid)).toBe(false)
    }
  })

  test('keeps valid paid-receipt fulfillment independent of public offer expiry', () => {
    const module = publicFactsModule as unknown as {
      isCanonicalFixPackReceipt?: (receipt: unknown, source?: unknown) => boolean
    }
    expect(typeof module.isCanonicalFixPackReceipt).toBe('function')
    if (!module.isCanonicalFixPackReceipt) return

    expect(
      getActiveFixPack(publicFacts, new Date('2027-01-01T00:00:00.000Z')),
    ).toBeUndefined()
    expect(module.isCanonicalFixPackReceipt({
      livemode: true,
      payment_status: 'paid',
      currency: 'usd',
      amount_total: publicFacts.fixPack.priceCents,
      metadata: { offer_key: publicFacts.fixPack.checkout.offerKey },
    })).toBe(true)
  })
})
