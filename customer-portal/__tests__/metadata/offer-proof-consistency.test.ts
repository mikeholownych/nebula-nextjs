/** @jest-environment jsdom */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import CaseStudiesContent from '../../app/case-studies/CaseStudiesContent'
import {
  getActiveFixPack,
  getPublishedCaseStudies,
  publicFacts,
  type PublishedCaseStudy,
} from '../../app/lib/public-facts'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')

const activeOfferSurfaces = [
  'app/pricing/page.tsx',
  'app/checkout/page.tsx',
  'app/terms/page.tsx',
  'app/ai-sdr-vs-audit/page.tsx',
  'components/WebMCP.tsx',
  'PRODUCT.md',
  'public/llms.txt',
  'public/llms-full.txt',
] as const

describe('offer and proof consistency', () => {
  afterEach(cleanup)

  test('active offer surfaces reject retired price and delivery-window drift', () => {
    const combined = activeOfferSurfaces.map(read).join('\n').toLowerCase()

    expect(combined).not.toContain('$147')
    expect(combined).not.toContain('14700')
    expect(combined).not.toMatch(/\b(?:24|48)[-– ](?:hour|hours)\b/)
    expect(combined).not.toMatch(/\b(?:24|48)\s*hours?\b/)
  })

  test('commercial, legal, machine-readable, and comparison copy preserves the implementation boundary', () => {
    const combined = activeOfferSurfaces.map(read).join('\n').toLowerCase().replace(/\s+/g, ' ')

    for (const promise of [
      /fix pack.{0,80}implements? (?:it|the|your|recommended)/,
      /includes? implementation of recommended fixes/,
      /we (?:will )?implement (?:the|your|recommended) fixes/,
      /completed implementation/,
      /before we begin implementation/,
      /once implementation has begun/,
    ]) {
      expect(combined).not.toMatch(promise)
    }

    for (const relative of [
      'app/pricing/page.tsx',
      'app/checkout/page.tsx',
      'app/terms/page.tsx',
      'app/ai-sdr-vs-audit/page.tsx',
      'components/WebMCP.tsx',
    ]) {
      const source = read(relative).toLowerCase().replace(/\s+/g, ' ')
      expect(source).toContain('getactivefixpack')
      expect(source).toContain('formatusd')
      expect(source).toMatch(/within minutes/)
      expect(source).toMatch(/(?:customer|you|yourself).{0,100}developer|developer.{0,100}(?:customer|you|yourself)/)
      expect(source).toMatch(/(?:no|never|does not|without).{0,50}(?:(?:site|cms|hosting).{0,30}access|access.{0,30}(?:site|cms|hosting))|(?:site|cms|hosting).{0,30}access.{0,30}(?:not|required|never|no)/)
    }

    for (const relative of ['PRODUCT.md', 'public/llms.txt', 'public/llms-full.txt']) {
      const source = read(relative).toLowerCase().replace(/\s+/g, ' ')
      expect(source).toContain('$97')
      expect(source).toMatch(/within minutes/)
      expect(source).toMatch(/(?:customer|you|yourself).{0,100}developer|developer.{0,100}(?:customer|you|yourself)/)
      expect(source).toMatch(/(?:no|never|does not|without).{0,50}(?:(?:site|cms|hosting).{0,30}access|access.{0,30}(?:site|cms|hosting))|(?:site|cms|hosting).{0,30}access.{0,30}(?:not|required|never|no)/)
    }
  })

  test('rejects known unsupported claims on Task 2 surfaces', () => {
    const combined = activeOfferSurfaces.map(read).join('\n').toLowerCase().replace(/\s+/g, ' ')

    for (const unsupported of [
      'leaks 98%',
      'bleeds 98 out of every 100',
      "if it's below 2%",
      'works in hours',
      'stuck at 0.8% conversion',
      '10x solution to a 1x problem',
      'built 50+ landing pages',
      'across 50+ landing pages',
      'pci-compliant by design',
    ]) {
      expect(combined).not.toContain(unsupported)
    }
  })

  test('evaluates expiring offer availability during metadata/render instead of module load', () => {
    for (const relative of [
      'app/pricing/page.tsx',
      'app/checkout/page.tsx',
      'app/terms/page.tsx',
      'app/ai-sdr-vs-audit/page.tsx',
    ]) {
      const source = read(relative)
      expect(source).not.toMatch(/^const fixPack\s*=\s*getActiveFixPack\(\)/m)
      expect(source).toMatch(/export const dynamic\s*=\s*['"]force-dynamic['"]/)
      expect(source).not.toMatch(/export const revalidate\s*=/)
    }
  })

  test('static LLM files bound the expiring price to its validity date', () => {
    for (const relative of ['public/llms.txt', 'public/llms-full.txt']) {
      const source = read(relative)
      expect(source).toContain('$97')
      expect(source).toContain('2026-12-31')
    }
  })

  test('transactional validation and structured offer data derive from the registry', () => {
    const pricing = read('app/pricing/page.tsx')
    const checkout = read('app/checkout/page.tsx')
    const checkoutButton = read('app/checkout/CheckoutCTAButton.tsx')
    const checkoutApi = read('app/api/checkout/route.ts')
    const webhook = read('app/api/webhooks/stripe/route.ts')
    const auditResults = read('app/audit/[id]/results/ResultsClient.tsx')

    expect(pricing).toContain("from '@/app/lib/public-facts'")
    expect(pricing).not.toMatch(/price:\s*['"]97['"]/)
    expect(pricing).not.toMatch(/priceValidUntil:\s*['"]2026-12-31['"]/)

    expect(checkout).toContain("from '@/app/lib/public-facts'")
    expect(checkout).not.toMatch(/const STRIPE_FIX_PACK_LINK\s*=\s*['"]/)
    expect(checkoutButton).toContain("fetch(endpoint")
    expect(checkoutButton).not.toContain('buy.stripe.com')
    expect(checkoutApi).toContain("'metadata[offer_key]'")
    expect(checkoutApi).toContain("'metadata[audit_id]'")
    expect(checkoutApi).toContain("'line_items[0][price_data][unit_amount]'")
    expect(checkoutApi).not.toContain('STRIPE_FIX_PACK_PRICE_ID')
    expect(auditResults).not.toContain('buy.stripe.com')
    expect(auditResults).toContain('/checkout?audit_id=')

    expect(webhook).toContain("from '@/app/lib/public-facts'")
    expect(webhook).not.toMatch(/FIX_PACK_AMOUNT_CENTS\s*=\s*9700/)
  })

  test('published case inventory is empty and every case route derives from the registry', () => {
    expect(publicFacts.caseStudies.status).toBe('none_published')
    expect(getPublishedCaseStudies()).toHaveLength(0)
    expect(existsSync(path.join(process.cwd(), 'app/CaseStudyPage.tsx'))).toBe(false)

    for (const relative of [
      'app/case-studies/page.tsx',
      'app/case-studies/[slug]/page.tsx',
      'app/sitemap.ts',
    ]) {
      expect(read(relative)).toContain("from '@/app/lib/public-facts'")
    }

    const combined = [
      'app/case-studies/page.tsx',
      'app/case-studies/[slug]/page.tsx',
      'PRODUCT.md',
      'public/llms.txt',
      'public/llms-full.txt',
    ].map(read).join('\n').toLowerCase()

    expect(combined).not.toMatch(/\b48x roas\b/)
    expect(combined).not.toMatch(/\b50% cpc\b/)
    expect(combined).not.toMatch(/\btwo documented case studies\b/)
  })

  test('case-study index renders both the honest empty state and evidence-gated entries', () => {
    const { rerender } = render(
      React.createElement(CaseStudiesContent, { studies: [] }),
    )
    expect(screen.getByRole('heading', { name: /we don't have one yet/i })).toBeInTheDocument()

    const study = {
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
      measurementWindow: { startedAt: '2026-06-01', endedAt: '2026-06-30' },
      publicationPermission: { granted: true, grantedAt: '2026-07-01' },
      disclosure: 'Nebula audited the page; the customer implemented the change.',
      publishedAt: '2026-07-15',
      modifiedAt: '2026-07-15',
    }
    rerender(React.createElement(CaseStudiesContent, {
      studies: [study as PublishedCaseStudy],
    }))

    expect(screen.getByRole('heading', { name: /published, evidence-backed case studies/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Supported example' })).toHaveAttribute(
      'href',
      '/case-studies/supported-example',
    )
    expect(screen.getByText('Observed change')).toBeInTheDocument()
    expect(screen.queryByText(/we don't have one yet/i)).not.toBeInTheDocument()
  })
})
