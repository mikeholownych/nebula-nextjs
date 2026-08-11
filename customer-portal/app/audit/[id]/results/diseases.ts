/**
 * Disease Naming System
 *
 * Maps each audit check key to a memorable clinical name + one-line symptom.
 * The disease name is additive - it appears alongside the technical label, not
 * replacing it. Every name must be understandable without knowing what an H1 is.
 *
 * Rule: sounds manageable to understand, not DIY-fixable without expertise.
 * That balance keeps the $97 One-Leak Repair Sprint relevant after the name lands.
 */

/**
 * Fix complexity - how hard to fix without implementation guidance.
 * This is what collapses the "I'll do it myself" objection.
 * easy   = copy edit, anyone can do it in 15 min
 * copy   = needs careful copywriting, no dev required
 * dev    = requires a developer or CMS access
 */
export type FixComplexity = 'easy' | 'copy' | 'dev'

export interface DiseaseProfile {
  /** Short memorable name - the thing they'll say out loud */
  name: string
  /** One-line plain-English symptom description */
  symptom: string
  /** Severity tier - shapes urgency in the UI */
  tier: 'critical' | 'moderate' | 'minor'
  /** How hard the fix is without implementation support */
  complexity: FixComplexity
  /** One-line description of what a complete repair would deliver */
  promptDelivers: string
}

export const DISEASES: Record<string, DiseaseProfile> = {
  headline: {
    name: 'Title Fever',
    symptom: 'First impression is too vague or cut off - visitors leave before they understand what you offer.',
    tier: 'critical',
    complexity: 'copy',
    promptDelivers: '5 rewritten headline variants with character counts, optimised for your ICP',
  },
  cta: {
    name: 'Silent CTA Syndrome',
    symptom: 'The page never clearly tells the visitor what to do next - so most do nothing.',
    tier: 'critical',
    complexity: 'easy',
    promptDelivers: '8 CTA variants across 3 commitment levels - paste directly into your page',
  },
  above_fold: {
    name: 'Ghost Fold Disorder',
    symptom: 'Nothing compelling appears before the scroll - you lose 40–60% of visitors in the first 5 seconds.',
    tier: 'critical',
    complexity: 'dev',
    promptDelivers: 'Complete above-fold HTML with headline, sub-headline, CTA, and trust signal',
  },
  social_proof: {
    name: 'Claim Without Proof Syndrome',
    symptom: 'The page says it\'s trustworthy but shows no evidence. Visitors read this as a claim, not a fact.',
    tier: 'critical',
    complexity: 'copy',
    promptDelivers: 'Exact proof element with placement instructions and copy-paste HTML',
  },
  load_speed: {
    name: 'Payload Obesity',
    symptom: 'The page sends too much data before showing anything useful - slow load, high bounce rate.',
    tier: 'moderate',
    complexity: 'dev',
    promptDelivers: 'Prioritised fix checklist with effort estimates and platform-specific steps',
  },
  mobile: {
    name: 'Viewport Blindness',
    symptom: 'The page wasn\'t built to render correctly on phones - over half your visitors see a broken layout.',
    tier: 'critical',
    complexity: 'dev',
    promptDelivers: 'Viewport meta tag fix + CSS responsive adjustments for your platform',
  },
  seo_foundations: {
    name: 'Index Anemia',
    symptom: 'Title and headline don\'t align - search engines can\'t tell what the page is about.',
    tier: 'moderate',
    complexity: 'easy',
    promptDelivers: 'Optimised title, meta description, and H1 with exact character counts',
  },
  ad_signals: {
    name: 'Attribution Blackout',
    symptom: 'Ad clicks can\'t be traced to outcomes - you can\'t tell which campaigns are working.',
    tier: 'moderate',
    complexity: 'dev',
    promptDelivers: 'Exact pixel/tag code snippets with installation locations and verification steps',
  },
  ai_readiness: {
    name: 'Invisible to AI',
    symptom: 'The page lacks structured signals that AI engines read - it won\'t surface in AI-powered search results.',
    tier: 'minor',
    complexity: 'easy',
    promptDelivers: 'Complete <head> snippet with JSON-LD, OpenGraph, Twitter card, and canonical URL',
  },
  local_gbp: {
    name: 'Invisible Storefront Syndrome',
    symptom: 'Services aren\'t listed where local buyers look first - Google Business Profile is empty.',
    tier: 'moderate',
    complexity: 'easy',
    promptDelivers: 'Step-by-step GBP product listing setup with suggested service descriptions',
  },
}

/** Returns the disease profile for a finding key, or undefined if unmapped. */
export function getDisease(key: string): DiseaseProfile | undefined {
  return DISEASES[key]
}

/** Returns a tier-appropriate CSS class for the disease badge */
export function diseaseTierClass(tier: DiseaseProfile['tier']): string {
  switch (tier) {
    case 'critical': return 'bg-danger/10 text-danger border-danger/20'
    case 'moderate': return 'bg-fg-muted/10 text-fg-muted border-fg-muted/20'
    case 'minor':    return 'bg-fg-dim/10 text-fg-dim border-fg-dim/20'
  }
}

/** Returns complexity badge config */
export function complexityBadge(complexity: FixComplexity): { label: string; class: string } {
  switch (complexity) {
    case 'easy': return { label: '⚡ 15-min fix', class: 'bg-accent/10 text-accent border-accent/20' }
    case 'copy': return { label: '✍ Needs copy', class: 'bg-fg-muted/10 text-fg-muted border-fg-muted/20' }
    case 'dev':  return { label: '⚙ Needs dev',  class: 'bg-fg-dim/10 text-fg-dim border-fg-dim/20' }
  }
}

/**
 * Extract SERP data from a finding's evidence.measured string.
 * The seo_foundations evidence contains: "title: \"...\", meta desc: N chars, h1: \"...\""
 */
export function extractSerpData(measuredEvidence: string): { title: string; metaDescChars: number } | null {
  try {
    const titleMatch = measuredEvidence.match(/title:\s*"([^"]+)"/)
    const metaMatch = measuredEvidence.match(/meta desc:\s*(\d+)/)
    if (!titleMatch) return null
    return {
      title: titleMatch[1],
      metaDescChars: metaMatch ? parseInt(metaMatch[1], 10) : 0,
    }
  } catch {
    return null
  }
}
