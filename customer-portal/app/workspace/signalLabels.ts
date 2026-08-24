/** Friendly labels for the nine audit signal keys, shared by workspace views. */
export const SIGNAL_LABELS: Record<string, string> = {
  headline: 'Headline clarity',
  cta: 'Call to action',
  above_fold: 'Above the fold',
  social_proof: 'Social proof',
  load_speed: 'Load speed',
  mobile: 'Mobile layout',
  ad_signals: 'Ad message match',
  seo_foundations: 'SEO foundations',
  ai_readiness: 'AI readiness',
}

export function signalLabel(key: string): string {
  return SIGNAL_LABELS[key] ?? key
}
