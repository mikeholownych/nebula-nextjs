/**
 * Canonical product facts, signal registry, priority models, and audit datasets.
 * Governed single source of truth for Nebula Components.
 */

export interface Signal {
  key: string;
  label: string;
  description: string;
  passDescription: string;
  category: 'conversion' | 'technical' | 'discovery';
  passing: boolean;
}

export interface EvidenceAtomData {
  observation: string;
  selector: string;
  metrics: { label: string; value: string }[];
  rule: string;
  interpretation: string;
  limitation: string;
}

export interface Finding {
  id: string;
  priorityScore: number;
  status: 'FAIL' | 'REVIEW' | 'PASS';
  title: string;
  summary: string;
  category: string;
  evidence: EvidenceAtomData;
}

export const SIGNAL_REGISTRY_VERSION = '2.0.0';
export const PRIORITY_MODEL_VERSION = 'v3.1';

export const SIGNALS: Signal[] = [
  {
    key: 'message_match',
    label: 'Message match',
    description: 'Ad promise vs. page headline alignment',
    passDescription: 'Ad headline matches page headline and names the buyer outcome',
    category: 'conversion',
    passing: true,
  },
  {
    key: 'cta',
    label: 'CTA clarity',
    description: 'One clear primary action with action + outcome copy',
    passDescription: 'Primary CTA uses action + outcome copy, visible in initial viewport',
    category: 'conversion',
    passing: false,
  },
  {
    key: 'above_fold',
    label: 'Above-fold clarity',
    description: 'Primary CTA, headline, and proof visible before scroll',
    passDescription: 'Primary CTA, ICP-specific headline, and trust signal all visible above fold',
    category: 'conversion',
    passing: true,
  },
  {
    key: 'social_proof',
    label: 'Trust signals',
    description: 'Proof visible near the first CTA',
    passDescription: 'Named testimonial, review count, or customer logo visible near primary CTA',
    category: 'conversion',
    passing: false,
  },
  {
    key: 'load_time',
    label: 'Load speed',
    description: 'Page does not leak visitors while loading',
    passDescription: 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile',
    category: 'technical',
    passing: true,
  },
  {
    key: 'mobile',
    label: 'Mobile viewport',
    description: 'Page renders correctly on mobile',
    passDescription: 'Primary CTA visible and usable on 375px viewport without zoom',
    category: 'technical',
    passing: true,
  },
  {
    key: 'ad_signals',
    label: 'Ad tracking',
    description: 'Recognized ad-tracking artifact present',
    passDescription: 'Facebook Pixel, GA4 ID, or UTM-bearing link present in static HTML',
    category: 'discovery',
    passing: true,
  },
  {
    key: 'seo_foundations',
    label: 'SEO foundations',
    description: 'Title tag, meta description, and descriptive H1',
    passDescription: 'Title tag, meta description, and single descriptive H1 all present',
    category: 'discovery',
    passing: true,
  },
  {
    key: 'ai_readiness',
    label: 'AI readiness',
    description: 'Structured signals support machine-readable interpretation',
    passDescription: 'JSON-LD, OG tags, and clean DOM hierarchy present for AI citation',
    category: 'discovery',
    passing: false,
  },
];

export const SIGNAL_COUNT = SIGNALS.length;

export const PRIORITY_SCORE_META = {
  name: 'Priority Score',
  scale: '1–10',
  definition:
    'A rule-derived ordering heuristic based on journey position, severity, and reproducibility. Not a measure of revenue impact or predicted conversion lift.',
  tooltip:
    'Rule-derived heuristic for fix order (journey position, severity, reproducibility). Not predicted conversion lift.',
};

export const REPAIR_SPRINT_OFFER = {
  name: 'One-Leak Repair Sprint',
  price: '$97',
  delivery: 'Tailored implementation artifact for the highest-priority finding.',
  reAudit: 'Same-scope 30-day re-audit included.',
  disclaimer: 'Customer-implemented. Same-scope re-audit included.',
};

export const SAMPLE_AUDIT_DATA = {
  url: 'launchcrate.io/pricing',
  status: 'Audit complete',
  score: 68,
  scoreScale: 100,
  grade: 'C+',
  signalsPassing: 6,
  signalsTotal: 9,
  findingsCount: 3,
  highestPriority: 7.2,
  registryVersion: 'Signal Registry v2.0',
  priorityModel: 'Priority Model v3.1',
  findings: [
    {
      id: 'cta-viewport',
      priorityScore: 7.2,
      status: 'FAIL' as const,
      category: 'CTA Clarity',
      title: 'Primary CTA not visible in the initial mobile viewport',
      summary: 'Primary CTA starts 914px from top on 375×812 viewport. Requires 1.2 viewport scrolls to encounter.',
      evidence: {
        observation: 'Primary CTA starts below initial mobile viewport fold.',
        selector: 'button[data-primary-cta]',
        metrics: [
          { label: 'CTA top offset', value: '914 px' },
          { label: 'Tested viewport', value: '375 × 812 px' },
          { label: 'Viewport coverage', value: '0% in initial frame' },
        ],
        rule: 'CTA_INITIAL_VIEWPORT_V3',
        interpretation: 'The primary conversion action requires scrolling before it becomes observable to incoming mobile visitors.',
        limitation: 'This observation measures visual geometry. It does not establish conversion causality or revenue loss.',
      },
    },
    {
      id: 'headline-outcome',
      priorityScore: 5.4,
      status: 'REVIEW' as const,
      category: 'Message Match',
      title: 'Primary heading does not identify the intended outcome',
      summary: 'H1 uses abstract slogan text rather than concrete customer payoff.',
      evidence: {
        observation: 'Heading 1 does not specify an actionable product outcome or target audience.',
        selector: 'h1.hero-headline',
        metrics: [
          { label: 'Detected H1 text', value: '“The smarter way forward”' },
          { label: 'Outcome token match', value: '0 / 4 category keywords' },
          { label: 'DOM position', value: 'Row 1, Column 1' },
        ],
        rule: 'MESSAGE_MATCH_OUTCOME_V2',
        interpretation: 'Visitors arriving from outcome-specific campaigns encounter generic copy that does not immediately validate their click intent.',
        limitation: 'Heuristic assessment. Does not evaluate brand awareness or secondary brand lift.',
      },
    },
    {
      id: 'ai-schema',
      priorityScore: 3.1,
      status: 'FAIL' as const,
      category: 'AI Readiness',
      title: 'Structured schema data missing',
      summary: 'No JSON-LD structured data blocks detected in document head or body.',
      evidence: {
        observation: 'Zero JSON-LD structured data blocks detected in the DOM.',
        selector: 'script[type="application/ld+json"]',
        metrics: [
          { label: 'JSON-LD scripts', value: '0 blocks found' },
          { label: 'OpenGraph metadata', value: 'Partial (missing og:description)' },
          { label: 'Semantic markup', value: 'HTML5 semantic elements present' },
        ],
        rule: 'AI_READINESS_SCHEMA_V1',
        interpretation: 'Search engine crawlers and AI answer engines must infer page ontology without canonical structured markers.',
        limitation: 'Absence of schema does not impair human browser rendering or direct navigation.',
      },
    },
  ] as Finding[],
};
