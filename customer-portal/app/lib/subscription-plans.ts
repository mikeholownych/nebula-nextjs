// Canonical subscription plan definitions for Nebula memberships.
// Stripe product/price IDs are created by scripts and mirrored here.
// Source of truth for features, quotas, and gating.

export type PlanKey = 'free' | 'pro' | 'growth' | 'agency'
export type BillingInterval = 'monthly' | 'annual'

export interface SubscriptionPlan {
  key: PlanKey
  name: string
  tagline: string
  monthlyUsd: number | null
  annualUsd: number | null
  stripe: {
    product: string | null
    monthlyPrice: string | null
    annualPrice: string | null
  }
  auditQuotaPerMonth: number | 'unlimited'
  monitoredUrls: number | 'unlimited'
  competitorSlots: number
  funnelRunsPerMonth: number | null
  funnelUrlsPerRun: number
  analyticsDepth: 'none' | 'percentile' | 'segment'
  teamSeats: number | 'unlimited'
  clientWorkspaces: number
  features: string[]
  highlighted?: boolean
}

export const SUBSCRIPTION_PLANS: Record<PlanKey, SubscriptionPlan> = {
  free: {
    key: 'free',
    name: 'Free',
    tagline: 'See what is leaking',
    monthlyUsd: null,
    annualUsd: null,
    stripe: { product: null, monthlyPrice: null, annualPrice: null },
    auditQuotaPerMonth: 1,
    monitoredUrls: 0,
    competitorSlots: 0,
    funnelRunsPerMonth: 0,
    funnelUrlsPerRun: 0,
    analyticsDepth: 'none',
    teamSeats: 1,
    clientWorkspaces: 0,
    features: [
      '1 audit per month',
      '9-signal score and grade',
      'Top findings summary',
      'Email unlock for full report',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    tagline: 'Ongoing conversion visibility',
    monthlyUsd: 29,
    annualUsd: 290,
    stripe: {
      product: 'prod_V0miNSuuHWjJIm',
      monthlyPrice: 'price_1U0l9AEINR1kU9chtiA64BKd',
      annualPrice: 'price_1U0l9BEINR1kU9chItjep7v9',
    },
    auditQuotaPerMonth: 20,
    monitoredUrls: 3,
    competitorSlots: 2,
    funnelRunsPerMonth: 3,
    funnelUrlsPerRun: 10,
    analyticsDepth: 'percentile',
    teamSeats: 1,
    clientWorkspaces: 0,
    features: [
      'Unlimited audits (fair use 20/mo)',
      'Full signal reports with evidence',
      'Weekly page monitoring and score-drop alerts',
      'Historical score tracking',
      'Before/after re-audit comparisons',
      'PDF report export',
      'Priority audit queue',
      'Email support',
    ],
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    tagline: 'Multi-page teams',
    monthlyUsd: 79,
    annualUsd: 790,
    stripe: {
      product: 'prod_V0mijugkOqkcDJ',
      monthlyPrice: 'price_1U0l9BEINR1kU9chHMT77i8i',
      annualPrice: 'price_1U0l9BEINR1kU9chdxMOIkr6',
    },
    auditQuotaPerMonth: 'unlimited',
    monitoredUrls: 10,
    competitorSlots: 5,
    funnelRunsPerMonth: 10,
    funnelUrlsPerRun: 25,
    analyticsDepth: 'segment',
    teamSeats: 5,
    clientWorkspaces: 0,
    highlighted: true,
    features: [
      'Everything in Pro',
      'Multi-page audits (10 URLs)',
      '5 team seats',
      'White-label PDF reports',
      'API access',
      'Competitor page monitoring (3 URLs)',
      'Custom scoring weights',
      'Bulk CSV import/export',
      'Priority support',
    ],
  },
  agency: {
    key: 'agency',
    name: 'Agency',
    tagline: 'Client work at scale',
    monthlyUsd: 497,
    annualUsd: null,
    stripe: {
      product: 'prod_V0miqtrSEnPtiC',
      monthlyPrice: 'price_1U7eY8EINR1kU9chLslsSug3',
      annualPrice: null,
    },
    auditQuotaPerMonth: 'unlimited',
    monitoredUrls: 'unlimited',
    competitorSlots: 10,
    funnelRunsPerMonth: null,
    funnelUrlsPerRun: 100,
    analyticsDepth: 'segment',
    teamSeats: 'unlimited',
    clientWorkspaces: 25,
    features: [
      'Everything in Growth',
      '25 isolated client workspaces',
      'Unlimited monitored URLs',
      'Unlimited team seats',
      'Full white-label with custom report domain',
      'Client-facing branded dashboards',
      'Kit reseller margin',
      'Dedicated onboarding call',
      'Same-day support',
    ],
  },
} as const

export const PAID_PLAN_KEYS = ['pro', 'growth', 'agency'] as const

/** Resolve a Stripe price ID back to plan + interval. Used by webhooks. */
export function planFromStripePrice(
  priceId: string,
): { plan: PlanKey; interval: BillingInterval } | null {
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    if (plan.stripe.monthlyPrice === priceId) return { plan: plan.key, interval: 'monthly' }
    if (plan.stripe.annualPrice === priceId) return { plan: plan.key, interval: 'annual' }
  }
  return null
}

/** Audit quota for a plan key; free fallback for unknown/lapsed. */
export function auditQuotaFor(plan: string | null | undefined): number | 'unlimited' {
  const p = SUBSCRIPTION_PLANS[(plan ?? 'free') as PlanKey]
  return p ? p.auditQuotaPerMonth : SUBSCRIPTION_PLANS.free.auditQuotaPerMonth
}
