/** @jest-environment node */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  getActiveFixPack,
  getPublishedCaseStudies,
  publicFacts,
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

  test('transactional validation and structured offer data derive from the registry', () => {
    const pricing = read('app/pricing/page.tsx')
    const checkout = read('app/checkout/page.tsx')
    const webhook = read('app/api/webhooks/stripe/route.ts')

    expect(pricing).toContain("from '@/app/lib/public-facts'")
    expect(pricing).not.toMatch(/price:\s*['"]97['"]/)
    expect(pricing).not.toMatch(/priceValidUntil:\s*['"]2026-12-31['"]/)

    expect(checkout).toContain("from '@/app/lib/public-facts'")
    expect(checkout).not.toMatch(/const STRIPE_FIX_PACK_LINK\s*=\s*['"]/)

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
})
