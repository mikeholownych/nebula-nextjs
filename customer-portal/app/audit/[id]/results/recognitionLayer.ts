/**
 * recognitionLayer.ts
 *
 * The "fuck yes" recognition layer for the results page.
 *
 * The audit engine already has every piece of data needed to make a visitor
 * feel seen rather than processed. This module exposes three pure functions
 * that reshape existing data into visitor-first language, plus the REPAIR_BRIDGE
 * and DIMENSION_PLAIN maps that drive them.
 *
 * Nothing here changes what is shown - only the sequence and voice.
 * All evidence-contract language is preserved downstream in ResultsClient.
 */

import type { Finding } from './auditResultSchema'

// ─── DIMENSION_PLAIN ──────────────────────────────────────────────────────────
// Plain-language headline + why sentence per signal key.
// Used in PersonalizedNextStep (existing) and buildOverviewHeadline (new).

export const DIMENSION_PLAIN: Record<string, { headline: string; why: string }> = {
  headline: {
    headline: 'Your headline is describing your product, not your visitor\'s problem.',
    why: 'Cold traffic reads the first line and decides in 3 seconds. If they don\'t see their problem named, they\'re gone before they understand what you offer.',
  },
  cta: {
    headline: 'Your CTA is a label, not a reason to act.',
    why: '"Submit" or "Get Started" asks someone to do something without telling them what changes. Visitors need to see the outcome before they\'ll click.',
  },
  social_proof: {
    headline: 'There\'s nothing on your page a stranger would trust.',
    why: 'Claims without evidence don\'t convert cold traffic. A name, a number, or a real outcome beats any feature list.',
  },
  above_fold: {
    headline: 'The most important elements aren\'t visible without scrolling.',
    why: 'Most visitors leave before they scroll. What they see in the first viewport is your entire pitch.',
  },
  load_speed: {
    headline: 'Your page is slow enough to lose visitors before they read a word.',
    why: 'Every second of delay costs conversions. The ad paid for the click. A slow load throws it away.',
  },
  mobile: {
    headline: 'Your page is broken for more than half your traffic.',
    why: 'Most paid traffic arrives on mobile. If the experience degrades on a phone and you\'re only checking desktop, you\'re running ads to a broken page.',
  },
  seo_foundations: {
    headline: 'Organic search can\'t find you, and paid traffic can\'t verify you.',
    why: 'Missing title tags and meta descriptions mean no SEO signal and no trust preview before the click.',
  },
  ad_signals: {
    headline: 'Your ads are firing into a page that can\'t track what converts.',
    why: 'Without conversion tracking, you can\'t know which campaign is working. You\'re optimizing blind.',
  },
  ai_readiness: {
    headline: 'AI tools can\'t read or cite your page.',
    why: 'Structured data and proper metadata shape which pages ChatGPT, Perplexity, and Google AI cite. Missing signals means competitors get cited instead.',
  },
}

// ─── REPAIR_BRIDGE ────────────────────────────────────────────────────────────
// One sentence per dimension key that tells the visitor exactly what the
// $97 repair delivers for their specific finding - not generic capability copy.

export const REPAIR_BRIDGE: Record<string, string> = {
  headline: 'Your headline needs one rewrite. The repair delivers five tested variants built for cold traffic - each one names the visitor outcome, ready to paste.',
  cta: 'Your CTA label needs one word change. The repair delivers eight CTA variants across three commitment levels - written for your specific offer, ready to paste.',
  above_fold: 'Your above-fold layout needs one structural change. The repair delivers the exact element order, copy, and HTML for your page.',
  social_proof: 'Your page needs one trust element near the decision point. The repair delivers a proof element with placement instructions and copy-paste HTML.',
  load_speed: 'Your page load needs one targeted fix. The repair delivers a prioritised checklist with effort estimates and platform-specific steps.',
  mobile: 'Your mobile layout needs one viewport fix. The repair delivers the viewport meta tag correction and responsive CSS adjustments for your platform.',
  seo_foundations: 'Your title and meta description need one rewrite. The repair delivers the optimised title, meta description, and H1 with exact character counts.',
  ad_signals: 'Your conversion tracking needs one installation. The repair delivers the exact pixel or tag code snippet with installation location and verification steps.',
  ai_readiness: 'Your page needs one structured-data addition. The repair delivers a complete head snippet with JSON-LD, OpenGraph, Twitter card, and canonical URL.',
}

// ─── buildPersonalizedDiagnosis ───────────────────────────────────────────────

export type PersonalizedDiagnosis = {
  /** Plain-language headline from DIMENSION_PLAIN for the worst finding */
  headline: string
  /** The why sentence from DIMENSION_PLAIN */
  why: string
  /**
   * The actual measured value scraped from the visitor's page.
   * Null when evidence is absent - never fabricated.
   */
  measuredLine: string | null
  /** The original finding, for downstream use */
  finding: Finding
} | null

export function buildPersonalizedDiagnosis(findings: Finding[]): PersonalizedDiagnosis {
  if (!findings.length) return null

  const worst = [...findings].sort((a, b) => b.impact - a.impact)[0]
  const plain = DIMENSION_PLAIN[worst.key]
  if (!plain) return null

  return {
    headline: plain.headline,
    why: plain.why,
    measuredLine: worst.evidence?.measured ?? null,
    finding: worst,
  }
}

// ─── buildRepairBridge ────────────────────────────────────────────────────────

export function buildRepairBridge(finding: Finding): string {
  return REPAIR_BRIDGE[finding.key]
    ?? 'The repair delivers a page-specific implementation artifact for this condition.'
}

// ─── buildOverviewHeadline ────────────────────────────────────────────────────

export function buildOverviewHeadline(findings: Finding[], hostname: string): string {
  if (!findings.length) {
    return `${hostname}: no failed conditions returned for this audit.`
  }

  const worst = [...findings].sort((a, b) => b.impact - a.impact)[0]
  const plain = DIMENSION_PLAIN[worst.key]

  if (!plain) {
    return `${hostname}: ${findings.length} condition${findings.length === 1 ? '' : 's'} failed.`
  }

  return `${hostname}: ${plain.headline}`
}
