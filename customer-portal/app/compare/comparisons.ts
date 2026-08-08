/**
 * Comparisons data — Nebula Components vs adjacent tools.
 *
 * Integrity rules (enforced by the owner):
 * 1. Statements about the OTHER tool must be accurate and current as of the
 *    publish date. These pages are not a "we win" exercise.
 * 2. Nebula's claims come from the live audit dataset only — never invented
 *    lifts or fabricated metrics.
 * 3. Each page includes an honest "use both" section. Nebula is not a builder
 *    or a performance meter; where a tool does a job Nebula doesn't do, that
 *    is stated plainly.
 */

export interface ComparisonRow {
  dimension: string
  tool: string
  nebula: string
}

export interface Comparison {
  slug: string
  toolName: string
  toolUrl: string
  category: string
  shortDescription: string
  intro: string
  whatItDoesWell: string[]
  whereItStops: string[]
  nebulaFit: string[]
  table: ComparisonRow[]
  useBoth: string
  verdict: string
}

export const comparisons: Comparison[] = [
  {
    slug: 'unbounce',
    toolName: 'Unbounce',
    toolUrl: 'https://unbounce.com',
    category: 'Landing page builder',
    shortDescription:
      'A landing page builder for publishing and A/B testing pages without a developer.',
    intro:
      'Unbounce is a landing page builder. You design pages with its editor, publish them on its subdomain or your domain, and run A/B tests between variants. It is a creation tool: it helps you ship landing pages fast and iterate on them.',
    whatItDoesWell: [
      'Drag-and-drop page creation without writing code',
      'Built-in A/B testing between page variants',
      'Popups, sticky bars, and conversion widgets',
      'Templates that get a page published in minutes',
    ],
    whereItStops: [
      'It does not diagnose a page you already have. Paste an existing URL into Unbounce and there is no audit — you rebuild, you do not learn what broke.',
      'It scores nothing. A/B tests tell you which variant won, but not why the losing variant lost.',
      'Its templates are starting points, not pass standards. There is no published component criterion the page is checked against.',
    ],
    nebulaFit: [
      'Nebula audits any live page — including pages built in Unbounce — against observable component checks.',
      'The audit tells you which component is leaking (headline, CTA, proof, above-fold) before you spend build time on a new variant.',
      'Every failing signal ships with measured evidence and a ranked fix queue, so the next Unbounce variant starts from diagnosis, not guesswork.',
    ],
    table: [
      { dimension: 'Job', tool: 'Build and publish landing pages', nebula: 'Diagnose why an existing page is not converting' },
      { dimension: 'Input', tool: 'A design you create in the editor', nebula: 'A live URL — no site access or rebuild required' },
      { dimension: 'Scoring', tool: 'A/B test winner (relative)', nebula: 'Component scores against observable checks' },
      { dimension: 'Evidence', tool: 'Test statistics', nebula: 'Measured page observations, selectors, and deltas per finding' },
      { dimension: 'Evidence', tool: 'Not published', nebula: 'Published on /benchmarks from the live audit dataset' },
      { dimension: 'Price', tool: 'Monthly subscription', nebula: 'Free audit; $97 One-Leak Repair Sprint' },
    ],
    useBoth:
      'The honest workflow: Unbounce builds the page, Nebula audits it. Use Unbounce to ship variants quickly, then run the free audit on the live variant to see which component actually fails its pass standard before you invest in test traffic.',
    verdict:
      'Unbounce and Nebula are complementary — one creates pages, the other diagnoses them. If you are already in Unbounce and pages still do not convert, the bottleneck is usually not page creation; it is diagnosis.',
  },
  {
    slug: 'instapage',
    toolName: 'Instapage',
    toolUrl: 'https://instapage.com',
    category: 'Landing page platform',
    shortDescription:
      'A landing page platform with personalization and conversion intelligence for pages built inside it.',
    intro:
      'Instapage is a landing page platform for building, personalizing, and experimenting with pages inside its editor. Its "Conversion Intelligence" layer scores pages and suggests experiments — for pages that live in Instapage.',
    whatItDoesWell: [
      'Page building and publishing at scale, including team workflows',
      'Personalization by audience segment',
      'A/B and multivariate experimentation',
      'In-platform page score and experiment suggestions',
    ],
    whereItStops: [
      'It audits pages built inside its platform. A page on your own domain or another stack is outside the diagnosis — you must rebuild in Instapage to get its intelligence.',
      'Its score is proprietary and unpublished. There is no public dataset showing how many pages fail which standard.',
      'Experiments tell you what to test next, not what is objectively broken against a published criterion.',
    ],
    nebulaFit: [
      'Nebula audits any page regardless of stack — Instapage pages included — so you can diagnose before committing to a platform migration.',
      'The audit score is anchored to observable checks on /benchmarks, backed by real completed audits.',
      'The ranked fix queue tells you the single highest-leverage repair, which is the difference between an experiment roadmap and a diagnosis.',
    ],
    table: [
      { dimension: 'Job', tool: 'Build, personalize, experiment inside the platform', nebula: 'Diagnose any live page against published standards' },
      { dimension: 'Scope', tool: 'Pages built in Instapage', nebula: 'Any public URL, any builder, any stack' },
      { dimension: 'Scoring', tool: 'Proprietary in-platform score', nebula: 'Composite score + component scores with a published "good from" anchor' },
      { dimension: 'Dataset', tool: 'Not published', nebula: 'Public /benchmarks from real completed audits' },
      { dimension: 'Deliverable', tool: 'Experiments and variants', nebula: 'Ranked fix queue with measured evidence per finding' },
      { dimension: 'Price', tool: 'Monthly subscription', nebula: 'Free audit; $97 One-Leak Repair Sprint' },
    ],
    useBoth:
      'Instapage is a strong platform for pages you control there. Run the Nebula audit on those same pages to get an independent, standard-anchored check before spending experiment budget — then use Instapage to implement the fixes.',
    verdict:
      'Instapage optimizes what you build inside it. Nebula audits what you already have. For a page that is underperforming today, the audit comes first; the platform choice is a separate decision.',
  },
  {
    slug: 'pagespeed-insights',
    toolName: 'PageSpeed Insights',
    toolUrl: 'https://pagespeed.web.dev',
    category: 'Performance measurement',
    shortDescription:
      'Google\u2019s lab-based tool that scores page load performance using Core Web Vitals.',
    intro:
      'PageSpeed Insights (PSI) measures one dimension of a landing page: performance. It returns Core Web Vitals scores (LCP, INP, CLS) and lab diagnostics. It is the right tool for the question "is my page fast?"',
    whatItDoesWell: [
      'Free, fast, lab-based Core Web Vitals measurement',
      'Clear pass/fail thresholds for LCP, INP, and CLS',
      'Actionable performance diagnostics (image sizes, render-blocking resources)',
      'The de facto standard for the speed component',
    ],
    whereItStops: [
      'It measures speed only. A fast page can still convert at zero — speed is one component, not conversion readiness.',
      'It does not look at copy, message match, CTA clarity, proof placement, or trust signals.',
      'It cannot answer "why is nobody buying" — only "is the page slow".',
    ],
    nebulaFit: [
      'Speed is one of the audited components in Nebula, measured against the same pass standard — but it sits alongside headline, CTA, proof, above-fold, mobile, and measurement.',
      'The audit answers the question PSI cannot: given that the page is fast (or slow), which conversion component is the leak?',
      'Published benchmarks show which components fail most often in the real dataset, so the diagnosis is comparative, not just absolute.',
    ],
    table: [
      { dimension: 'Job', tool: 'Measure load performance (Core Web Vitals)', nebula: 'Measure conversion readiness across components' },
      { dimension: 'Components', tool: 'LCP, INP, CLS', nebula: 'Message match, headline, CTA, proof, above-fold, mobile, speed, measurement' },
      { dimension: 'Output', tool: 'Performance score + diagnostics', nebula: 'Composite score, component scores, ranked fix queue' },
      { dimension: 'Pass standard', tool: 'Published (Google thresholds)', nebula: 'Published per component on /benchmarks' },
      { dimension: 'Dataset', tool: 'Single-page lab runs', nebula: 'Cross-page benchmarks from completed audits' },
      { dimension: 'Price', tool: 'Free', nebula: 'Free audit; $97 One-Leak Repair Sprint' },
    ],
    useBoth:
      'Use PSI for the speed dimension — it is excellent at it. Use the Nebula audit for the conversion dimensions PSI does not touch. A page that scores 95 on PSI and converts at zero has a leak PSI cannot see.',
    verdict:
      'PSI answers "is it fast?". Nebula answers "is it converting?". They measure different things; a conversion diagnosis starts where PSI ends.',
  },
  {
    slug: 'leadpages',
    toolName: 'Leadpages',
    toolUrl: 'https://leadpages.com',
    category: 'Landing page builder',
    shortDescription:
      'A budget landing page builder for small businesses publishing pages from templates.',
    intro:
      'Leadpages is a template-driven landing page builder aimed at small businesses and solo founders. You pick a template, edit it, publish. It is a fast, low-cost way to get a page live.',
    whatItDoesWell: [
      'Low cost of entry for simple pages',
      'Large template library for common offers',
      'Quick publishing with built-in hosting and opt-in forms',
      'Integrations with email platforms and payment tools',
    ],
    whereItStops: [
      'Templates are generic starting points — they do not encode a pass standard for your specific ad-to-page message match.',
      'No diagnosis of pages outside the platform. If your traffic lands on an existing URL, Leadpages has nothing to say about it.',
      'No scoring or evidence. You publish and guess.',
    ],
    nebulaFit: [
      'Nebula audits the live page after Leadpages publishes it — template pages routinely fail headline and message-match checks for ad traffic.',
      'The ranked fix queue converts the generic template into a page that meets published component standards.',
      'The free audit costs nothing to run, so you diagnose before paying for more template iterations.',
    ],
    table: [
      { dimension: 'Job', tool: 'Publish pages from templates fast', nebula: 'Diagnose the live page against pass standards' },
      { dimension: 'Diagnosis', tool: 'None', nebula: 'Every component scored with evidence' },
      { dimension: 'Message match', tool: 'Not checked', nebula: 'Ad promise vs headline alignment checked' },
      { dimension: 'Pass standards', tool: 'Not published', nebula: 'Published on /benchmarks' },
      { dimension: 'Price', tool: 'Monthly subscription', nebula: 'Free audit; $97 One-Leak Repair Sprint' },
    ],
    useBoth:
      'Leadpages gets you live in an afternoon; Nebula tells you whether the live page is actually built for conversion. Run the free audit the same day you publish, before you spend on traffic.',
    verdict:
      'Leadpages solves publishing, not conversion. The cheapest fix for a template page that is not converting is usually diagnosis, not another template.',
  },
]

export const getComparison = (slug: string): Comparison | undefined =>
  comparisons.find((c) => c.slug === slug)
