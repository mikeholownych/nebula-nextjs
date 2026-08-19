/**
 * Canonical signal registry - single source of truth for all signal metadata.
 *
 * Every public-facing projection of signal names, count, descriptions,
 * and ordering MUST derive from this registry.
 */

export interface Signal {
  key: string
  label: string
  description: string
  passDescription: string
  category: 'conversion' | 'technical' | 'discovery'
}

export interface SignalRegistry {
  version: string
  signals: Signal[]
}

export const SIGNAL_REGISTRY: SignalRegistry = {
  version: '2.0.0',
  signals: [
    {
      key: 'message_match',
      label: 'Message match',
      description: 'Ad promise vs. page headline alignment',
      passDescription: 'Ad headline matches page headline and names the buyer outcome',
      category: 'conversion',
    },
    {
      key: 'cta',
      label: 'CTA clarity',
      description: 'One clear primary action with action + outcome copy',
      passDescription: 'Primary CTA uses action + outcome copy, visible in initial viewport',
      category: 'conversion',
    },
    {
      key: 'above_fold',
      label: 'Above-fold clarity',
      description: 'Primary CTA, headline, and proof visible before scroll',
      passDescription: 'Primary CTA, ICP-specific headline, and trust signal all visible above fold',
      category: 'conversion',
    },
    {
      key: 'social_proof',
      label: 'Trust signals',
      description: 'Proof visible near the first CTA',
      passDescription: 'Named testimonial, review count, or customer logo visible near primary CTA',
      category: 'conversion',
    },
    {
      key: 'load_time',
      label: 'Load speed',
      description: 'Page does not leak visitors while loading',
      passDescription: 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile',
      category: 'technical',
    },
    {
      key: 'mobile',
      label: 'Mobile viewport',
      description: 'Page renders correctly on mobile',
      passDescription: 'Primary CTA visible and usable on 375px viewport without zoom',
      category: 'technical',
    },
    {
      key: 'ad_signals',
      label: 'Ad tracking',
      description: 'Recognized ad-tracking artifact present',
      passDescription: 'Facebook Pixel, GA4 ID, or UTM-bearing link present in static HTML',
      category: 'discovery',
    },
    {
      key: 'seo_foundations',
      label: 'SEO foundations',
      description: 'Title tag, meta description, and descriptive H1',
      passDescription: 'Title tag, meta description, and single descriptive H1 all present',
      category: 'discovery',
    },
    {
      key: 'ai_readiness',
      label: 'AI readiness',
      description: 'Structured signals support machine-readable interpretation',
      passDescription: 'JSON-LD, OG tags, and clean DOM hierarchy present for AI citation',
      category: 'discovery',
    },
  ],
}

export const SIGNAL_COUNT = SIGNAL_REGISTRY.signals.length
export const SIGNAL_KEYS = SIGNAL_REGISTRY.signals.map(s => s.key)
export const SIGNAL_LABELS = SIGNAL_REGISTRY.signals.map(s => s.label)

export const RETIRED_SIGNALS = [
  'form friction',
  'mobile layout',
  'proof',
  'social proof',
  'offer clarity',
  'objection coverage',
] as const
