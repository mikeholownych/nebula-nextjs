export type PricingTier = {
  name: string
  price: string
  note: string
}

export type PricingFaq = {
  q: string
  a: string
}

export type PricingGuide = {
  slug: string
  toolName: string
  toolUrl: string
  /** Competitor comparison sibling in /vs (internal cluster link). */
  vsSlug: string
  targetQuery: string
  bluf: string
  /** Category label, e.g. "Landing page builder" */
  category: string
  /** Verified tier pricing - grounded in the /vs comparison data checked
   *  August 2026. Disclosures: prices change; verify at the vendor. */
  tiers: PricingTier[]
  whatYouGet: string
  whenWorthIt: string
  faqs: PricingFaq[]
}

export const PRICING_GUIDES: Record<string, PricingGuide> = {
  'unbounce-pricing': {
    slug: 'unbounce-pricing',
    toolName: 'Unbounce',
    toolUrl: 'https://unbounce.com',
    vsSlug: 'unbounce',
    targetQuery: 'unbounce pricing',
    category: 'Landing page builder',
    bluf: 'Unbounce pricing starts at $29/month and goes up to $249/month - the AI Smart Traffic feature only exists on the top tier, and the 14-day trial requires a credit card. It is a builder, not an auditor: it only optimizes pages built inside its platform. If you already have a landing page on Webflow, Framer, Shopify, or WordPress and want to know why it is not converting, Nebula audits any public URL for free, with a $97 one-time fix kit instead of a subscription.',
    tiers: [
      { name: 'Launch (entry)', price: '$29/mo', note: '14-day trial requires a credit card' },
      { name: 'Optimize (Smart Traffic)', price: '$249/mo', note: 'AI traffic routing only exists on this top tier' },
    ],
    whatYouGet: 'Unbounce is a landing page builder with built-in A/B testing. Pages must be built and hosted inside Unbounce; it does not audit pages on other platforms. Smart Traffic routes visitors between page variants - it does not diagnose why a page is failing. Its value is the builder workflow plus continuous testing for teams willing to move pages into the platform.',
    whenWorthIt: 'Unbounce is worth it if you are starting fresh, want to build and A/B test pages inside one platform, and are comfortable with the lock-in. If your page already lives elsewhere and is not converting, Unbounce cannot help - you would need to rebuild.',
    faqs: [
      { q: 'Is Unbounce free?', a: 'No - Unbounce starts at $29/month (Launch). There is a 14-day trial, but it requires a credit card. Nebula\'s audit is free with no card, and the optional repair sprint is a one-time $97.' },
      { q: 'Does Unbounce require a credit card for the trial?', a: 'Yes - the 14-day trial requires a credit card. Nebula requires no signup and no card for the audit.' },
      { q: 'Is there a cheaper way to improve an existing landing page without rebuilding it?', a: 'Yes - if you do not want to migrate your page into Unbounce, run a conversion audit on the page you already have. Nebula audits any public URL in under 2 minutes for free, then writes the exact copy, code, or config changes as a $97 one-time fix kit - versus a $249/month subscription for Smart Traffic.' },
    ],
  },

  'hotjar-pricing': {
    slug: 'hotjar-pricing',
    toolName: 'Hotjar',
    toolUrl: 'https://hotjar.com',
    vsSlug: 'hotjar',
    targetQuery: 'hotjar pricing',
    category: 'Behavior analytics (heatmaps)',
    bluf: 'Hotjar has a free tier (35 sessions per day) and paid plans from $32/month (Plus) and $80/month (Business). It shows you what visitors do with heatmaps and recordings - but it needs existing traffic, and it does not diagnose why a page fails to convert. If your headline does not match your ad, Hotjar shows people leaving; it does not name the message-match failure. Nebula diagnoses that structure on any URL, free, with no traffic required.',
    tiers: [
      { name: 'Free', price: '$0', note: '35 sessions per day' },
      { name: 'Plus', price: '$32/mo', note: '' },
      { name: 'Business', price: '$80/mo', note: '' },
    ],
    whatYouGet: 'Heatmaps, session recordings, scrollmaps, and on-site surveys. All of it requires real visitor sessions to generate data. Hotjar is excellent post-launch behavior observation - it shows where people click, hesitate, and leave - but it does not score the page\'s conversion structure or explain the cause.',
    whenWorthIt: 'Hotjar is worth it after you have traffic and want qualitative behavior data on top of a conversion diagnosis. For a new or low-traffic page, it produces almost nothing until sessions accumulate.',
    faqs: [
      { q: 'Does Hotjar have a free plan?', a: 'Yes - Hotjar\'s free tier includes 35 sessions per day, which covers very small sites. Paid plans start at $32/month (Plus) and $80/month (Business).' },
      { q: 'How much does Hotjar cost per month?', a: 'Hotjar\'s paid plans are $32/month (Plus) and $80/month (Business), with a free tier capped at 35 sessions per day. Nebula\'s audit is free and needs no subscription.' },
      { q: 'Is Hotjar worth it if my landing page is not converting?', a: 'Hotjar will show you behavior, not the cause. If the page has a message-match failure or a missing trust signal, Hotjar shows visitors leaving - Nebula names the failing signal and the fix, before you pay for heatmap sessions.' },
    ],
  },

  'crazy-egg-pricing': {
    slug: 'crazy-egg-pricing',
    toolName: 'Crazy Egg',
    toolUrl: 'https://crazyegg.com',
    vsSlug: 'crazy-egg',
    targetQuery: 'crazy egg pricing',
    category: 'Visual analytics (heatmaps, A/B testing)',
    bluf: 'Crazy Egg pricing starts at $49/month (Starter), with Plus at $99/month and Pro at $249/month. It provides heatmaps, recordings, and A/B testing - all of which require existing traffic. It visualizes behavior but does not diagnose conversion structure, and it needs visitor volume before it produces anything. Nebula scores the conversion structure of any URL instantly, free, with no traffic required.',
    tiers: [
      { name: 'Starter', price: '$49/mo', note: '14-day free trial available' },
      { name: 'Plus', price: '$99/mo', note: '' },
      { name: 'Pro', price: '$249/mo', note: '' },
    ],
    whatYouGet: 'Heatmaps (click, scroll, move), session recordings, and A/B testing on pages that already have visitors. Like Hotjar, the output is behavioral data - where people click and leave - not a diagnosis of why the page failed structurally.',
    whenWorthIt: 'Crazy Egg is worth it for growth teams with existing traffic who want heatmap and testing capability in one tool. For a single landing page that is not converting, a conversion audit is the higher-leverage first step.',
    faqs: [
      { q: 'How much does Crazy Egg cost?', a: 'Crazy Egg\'s plans are Starter $49/month, Plus $99/month, and Pro $249/month, with a 14-day free trial. Nebula\'s audit is free with no subscription; the optional repair sprint is a one-time $97.' },
      { q: 'Is there a Crazy Egg free trial?', a: 'Yes - a 14-day free trial is available. Nebula\'s audit does not require a trial or a card; it is free and instant.' },
      { q: 'Is Crazy Egg worth it for conversion optimization?', a: 'Crazy Egg shows behavior, not conversion structure. If a headline does not match the ad or a trust signal is missing, Crazy Egg confirms people leave - it does not tell you why. A free conversion audit names the failing signal first, then a behavior tool adds the qualitative layer once you have traffic.' },
    ],
  },

  'semrush-pricing': {
    slug: 'semrush-pricing',
    toolName: 'SEMrush Site Audit',
    toolUrl: 'https://semrush.com/siteaudit',
    vsSlug: 'semrush-site-audit',
    targetQuery: 'semrush pricing',
    category: 'Technical SEO platform',
    bluf: 'SEMrush Pro costs $139.95/month and includes Site Audit as one module inside a full SEO platform. It runs 130+ technical SEO checks across a whole site - crawl errors, broken links, metadata - but it does not check conversion structure. A landing page that is not converting paid traffic will pass a SEMrush crawl while the real problem (headline mismatch, weak CTA, missing trust) stays invisible. Nebula checks the conversion layer for free, with a $97 one-time fix kit.',
    tiers: [
      { name: 'Pro', price: '$139.95/mo', note: 'Site Audit is one module in the platform' },
    ],
    whatYouGet: 'A full SEO platform: site-wide technical audit (130+ checks), keyword research, rank tracking, competitor analysis. The Site Audit module tells you if Google can crawl your site healthily - broken links, redirects, duplicate content - not whether your landing page converts paid traffic.',
    whenWorthIt: 'SEMrush is worth it for SEO teams managing site-wide technical health and organic growth. It is overkill - and priced like it - for a founder diagnosing one landing page\'s conversion problem.',
    faqs: [
      { q: 'How much does SEMrush cost?', a: 'SEMrush Pro is $139.95/month and includes Site Audit as one module. There is no standalone Site Audit subscription. Nebula\'s audit is free; the repair sprint is a one-time $97.' },
      { q: 'Does SEMrush Site Audit check conversions?', a: 'No - Site Audit runs technical SEO checks: crawl errors, broken links, redirects, metadata, Core Web Vitals. It does not check headline message match, CTA clarity, trust evidence, or above-fold structure.' },
      { q: 'Is there a cheaper alternative to SEMrush for landing page conversion?', a: 'Yes - Nebula. Free instant audit with evidence per finding, plus a $97 one-time fix kit for the specific failing signals. SEMrush is $139.95/month for a platform you would only be using for one page.' },
    ],
  },
}

export function getPricingGuide(slug: string): PricingGuide | undefined {
  return PRICING_GUIDES[slug]
}

export const PRICING_GUIDE_SLUGS = Object.keys(PRICING_GUIDES).sort()
