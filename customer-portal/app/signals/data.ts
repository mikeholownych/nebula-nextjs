// Canonical source of truth for the Landing Page Diagnostic Spec v1 signal copy.
// The spec page, the /signals/* definition pages, the sitemap, and the published
// JSON all derive their content from this module. Change here, propagate once.

export const SPEC_VERSION = '1.0.0'
export const SPEC_EFFECTIVE = '2026-08-22'
export const SPEC_URL =
  'https://nebulacomponents.com/spec/landing-page-diagnostic-v1'
export const SPEC_JSON_URL = `${SPEC_URL}.json`
export const SIGNALS_HUB_URL = 'https://nebulacomponents.com/signals'
export const ORGANIZATION_ID = 'https://nebulacomponents.com/#organization'

export interface SignalDefinition {
  id: string
  slug: string
  num: string
  label: string
  definition: string
  rule: string
  inspected: string[]
  manualCheck: string[]
  passExample: string
  failExample: string
}

export const SIGNALS: SignalDefinition[] = [
  {
    id: 'message_match',
    slug: 'message-match',
    num: '01',
    label: 'Message Match',
    definition:
      'Does the page promise match the expectation created by the ad or referring source?',
    rule:
      'The primary headline and first supporting line must restate the same offer, audience, and outcome as the ad or referral context that produced the visit. A run flags this signal when the rendered headline contradicts, generalizes away from, or omits the promised offer.',
    inspected: [
      'H1 text',
      'first subheadline',
      'title tag',
      'referring campaign parameters when present',
    ],
    manualCheck: [
      'Open the ad creative or its final URL parameters beside the live page.',
      'Compare the H1 and first subheadline against the ad promise on three axes: offer, audience, outcome.',
      'Any contradiction, broadening, or omission of the promised offer is a match failure.',
    ],
    passExample:
      'Ad promises a free landing page audit. H1 reads "Get a free audit of your landing page" for the same audience. Match.',
    failExample:
      'Ad promises a free audit. Page opens with generic agency branding and no mention of an audit anywhere above the fold. Flagged.',
  },
  {
    id: 'trust',
    slug: 'trust-signals',
    num: '02',
    label: 'Trust Signals',
    definition: 'Does the page support its claims before asking for commitment?',
    rule:
      'At least one verifiable proof element must appear near the conversion ask: named results, sourced review counts, case studies, or identifiable company and author information. A run flags pages that make strong claims with no adjacent, checkable support.',
    inspected: [
      'testimonial and logo blocks',
      'review widgets',
      'case study links',
      'author and company identity markup',
    ],
    manualCheck: [
      'Locate the primary conversion ask on the page.',
      'Within one screen of it, look for checkable proof: named testimonials, sourced review counts, linked case studies, identifiable company details.',
      'Strong claims with no adjacent verifiable support fail the signal.',
    ],
    passExample:
      'A pricing claim sits next to a linked case study naming the customer and the measured result. Support is checkable. Clear.',
    failExample:
      '"Trusted by hundreds" appears with no names, no sources, and no links. Flagged.',
  },
  {
    id: 'mobile_cta',
    slug: 'mobile-cta',
    num: '03',
    label: 'Mobile CTA',
    definition: 'Is the primary action visible and usable on a small viewport?',
    rule:
      'The primary call-to-action must be fully visible inside the initial 390px-wide viewport without scrolling, and must meet minimum tap-target size. A run flags CTAs pushed below the fold, overlapped by other elements, or smaller than usable touch targets at mobile width.',
    inspected: [
      'CTA bounding box position and size at 390px',
      'overlap checks against header, banners, and sticky elements',
      'tap target dimensions',
    ],
    manualCheck: [
      'Open the page at 390px viewport width (DevTools device toolbar).',
      'Confirm the primary CTA sits fully inside the first viewport with no overlap from headers, banners, or sticky bars.',
      'Check the tap target is comfortably large; 44px minimum height is the working floor.',
    ],
    passExample:
      'Primary button renders entirely inside the first mobile viewport with a 48px tap height and nothing covering it. Clear.',
    failExample:
      'At 390px the CTA sits underneath a fixed bottom banner, so the first tap hits the banner instead. Flagged.',
  },
  {
    id: 'load_time',
    slug: 'load-speed',
    num: '04',
    label: 'Load Speed',
    definition:
      'Does the page become useful quickly enough to keep paid visitors from bouncing?',
    rule:
      'Main content must reach usable state fast enough on a constrained connection. A run inspects render-blocking behavior, oversized hero media, and late-loading primary content, then reports measured values against the required threshold for the specific finding.',
    inspected: [
      'render-blocking resource count',
      'hero image weight and format',
      'when primary content becomes visible',
    ],
    manualCheck: [
      'In DevTools, throttle the network to Fast 3G and reload the page.',
      'Note when the main content becomes usable rather than merely painted.',
      'Inspect the Network tab for render-blocking scripts and oversized hero media; both push usable state past threshold.',
    ],
    passExample:
      'Primary content paints early; hero image is sized and compressed for mobile. Within threshold. Clear.',
    failExample:
      'A multi-megabyte autoplay video delays first meaningful content well past the threshold recorded in the finding. Flagged.',
  },
  {
    id: 'cta_clarity',
    slug: 'cta-clarity',
    num: '05',
    label: 'CTA Clarity',
    definition: 'Is the next step obvious and proportionate to visitor intent?',
    rule:
      'One primary action must dominate. A run flags pages offering several competing equal-weight actions, vague action labels, or asks disproportionate to intent (for example demanding account creation before delivering any value).',
    inspected: [
      'button label text',
      'count and relative weight of distinct actions',
      'ask placement relative to value shown',
    ],
    manualCheck: [
      'Count the distinct equal-weight actions visible in the first viewport.',
      'Read each button label aloud: a strong label names the specific outcome ("Run my free audit"), not a category ("Submit").',
      'Several competing asks, vague labels, or an oversized ask relative to delivered value fail the signal.',
    ],
    passExample:
      'Single high-contrast "Run my free audit" button; secondary links are visually subordinate. Clear.',
    failExample:
      'Four equal-weight buttons ("Book a call", "Sign up", "Learn more", "Follow us") compete in the first viewport. Flagged.',
  },
  {
    id: 'above_fold',
    slug: 'above-fold-clarity',
    num: '06',
    label: 'Above-Fold Clarity',
    definition:
      'Can a visitor understand the offer and next action in the first viewport?',
    rule:
      'Within the initial viewport a first-time visitor must be able to answer three questions: what is offered, who it is for, and what to do next. A run flags pages where any of these answers requires scrolling or inference.',
    inspected: [
      'viewport-height slice of rendered DOM',
      'headline, subhead, CTA presence in that slice',
    ],
    manualCheck: [
      'Screenshot the initial viewport on desktop and at 390px mobile width.',
      'Ask whether a stranger could answer three questions from that slice alone: what is offered, who it is for, what to do next.',
      'Any answer that requires scrolling or inference fails the signal.',
    ],
    passExample:
      'Offer, audience, and CTA all legible in the first desktop and mobile viewport. Clear.',
    failExample:
      'First viewport contains only a full-screen illustration and a logo; offer and action require scrolling. Flagged.',
  },
  {
    id: 'ad_signals',
    slug: 'ad-signal-continuity',
    num: '07',
    label: 'Ad Signal Continuity',
    definition: 'Can paid clicks be connected to outcomes without guessing?',
    rule:
      'Paid traffic infrastructure must preserve click identity through to conversion events. A run checks for broken or missing tracking continuity between entry and conversion surfaces and flags gaps that would force attribution guesses.',
    inspected: [
      'tracking parameter handling across navigation',
      'conversion event wiring',
      'attribution break points',
    ],
    manualCheck: [
      'Click through a real ad URL, or reconstruct one carrying its campaign parameters.',
      'Follow the complete path: ad, landing page, any intermediate step, checkout or conversion event.',
      'If click identifiers are dropped at any hop, attribution for that traffic is guesswork and the signal fails.',
    ],
    passExample:
      'Click identifiers survive the redirect into checkout and fire the purchase event with source intact. Clear.',
    failExample:
      'The main CTA links to a separate domain without carrying parameters, severing attribution for every paid click. Flagged.',
  },
  {
    id: 'seo_foundations',
    slug: 'seo-foundations',
    num: '08',
    label: 'SEO Foundations',
    definition: 'Can search systems retrieve and interpret the page foundations?',
    rule:
      'Core retrieval elements must be present, unique, and consistent: crawlable status, canonical URL, title, meta description, heading hierarchy, and indexability directives. A run flags missing, duplicated, or contradictory foundations.',
    inspected: [
      'HTTP status and robots directives',
      'canonical tag',
      'title and meta description',
      'heading structure',
    ],
    manualCheck: [
      'View page source: check title, meta description, canonical tag, and heading hierarchy.',
      'Confirm the page is indexable and the canonical is self-referencing where intended.',
      'Missing elements, duplicates across pages, or contradictions (for example a canonical pointing elsewhere while internal links target this page) fail the signal.',
    ],
    passExample:
      'Self-referencing canonical, unique title and description, single H1, indexable. Clear.',
    failExample:
      'Canonical points to a different URL while an internal link targets this one as the destination. Contradiction flagged.',
  },
  {
    id: 'ai_readiness',
    slug: 'ai-readiness',
    num: '09',
    label: 'AI Readiness',
    definition: 'Can answer engines identify, verify, and cite the page accurately?',
    rule:
      'Machine-facing surfaces must let AI systems resolve who you are, what you offer, and what claims are supportable: structured data matching visible content, explicit factual statements, stable entity references, and crawler policy that permits answer engines you want citing you.',
    inspected: [
      'JSON-LD presence and accuracy',
      'entity consistency',
      'claim specificity',
      'crawler access rules for AI agents',
    ],
    manualCheck: [
      'Validate structured data (Rich Results Test or a JSON-LD parser) against what the visible page actually claims.',
      'Check the company and product are described consistently across pages, schema, and profiles.',
      'Read robots.txt and confirm the answer engines you want citing you are not blocked.',
    ],
    passExample:
      'Product schema matches visible pricing; company identity is stated once, consistently, with same-as links. Clear.',
    failExample:
      'Schema asserts guarantees the visible page never makes, and robots.txt blocks every AI crawler indiscriminately. Flagged.',
  },
]

export function getSignalBySlug(slug: string): SignalDefinition | undefined {
  return SIGNALS.find((s) => s.slug === slug)
}
