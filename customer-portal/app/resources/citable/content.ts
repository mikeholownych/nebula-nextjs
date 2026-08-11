import type { Metadata } from 'next'
import citableRelease from '../../../data/citable-release.json'
import {
  getPublishedBenchmarks,
  getPublishedCaseStudies,
} from '@/app/lib/public-facts'

export const CITABLE_ORIGIN = 'https://nebulacomponents.com'
export const CITABLE_OVERVIEW_PATH = '/resources/citable'
export const CITABLE_SOFTWARE_ID = `${CITABLE_ORIGIN}${CITABLE_OVERVIEW_PATH}#software`

export type CitableRouteStatus = 'published' | 'planned'
export type CitableRouteKind = 'overview' | 'quick-start' | 'job' | 'compare' | 'release'

export interface CitableRoute {
  key: string
  kind: CitableRouteKind
  status: CitableRouteStatus
  path: string
  slug?: string
  title: string
  h1: string
  eyebrow: string
  description: string
  primaryQuestion: string
  directAnswer: string
  relatedPaths: readonly string[]
}

export interface CitableJobRoute extends CitableRoute {
  kind: 'job'
  status: 'published'
  slug: string
  observes: readonly string[]
  artifacts: readonly string[]
  limits: readonly string[]
  nextStep: string
}

export interface CitableReleaseFacts {
  packageName: string
  version: string
  releasedAt: string
  detectorCount: number
  namespaceCount: number
  registryCount: number
  nodeRequirement: string
  license: string
  source: string
  highlights: readonly string[]
}

export const citableReleaseFacts: CitableReleaseFacts = {
  packageName: citableRelease.package,
  version: citableRelease.version,
  releasedAt: citableRelease.releasedAt,
  detectorCount: citableRelease.detectorCount,
  namespaceCount: citableRelease.namespaceCount,
  registryCount: citableRelease.registryCount,
  nodeRequirement: citableRelease.nodeRequirement,
  license: citableRelease.license,
  source: citableRelease.source,
  highlights: citableRelease.highlights,
}

export interface CitableFaqItem {
  question: string
  answer: string
}

export const citableFaqItems: readonly CitableFaqItem[] = [
  {
    question: 'What is Citable?',
    answer:
      'Citable is an open-source evidence and governance package for recording bounded observations about retrieval, answer extractability, claims, entities, and controlled change. It preserves evidence for review without claiming that an external system will rank, cite, recommend, or convert.',
  },
  {
    question: 'Is Citable open source?',
    answer:
      `Yes. The published package ${citableReleaseFacts.packageName} is licensed under ${citableReleaseFacts.license}. The synchronized release projection documents version ${citableReleaseFacts.version}; package facts do not by themselves prove deployment or workflow state.`,
  },
  {
    question: 'What can Citable establish?',
    answer:
      'Citable can establish what a bounded run observed about the selected source, what registered evidence supports a claim under a declared policy, whether controlled entities are consistent, and whether a supplied change or release receipt satisfies its stated checks.',
  },
  {
    question: 'What can Citable not establish?',
    answer:
      'Citable cannot prove future crawling, indexing, search ranking, AI-provider retrieval, citation, recommendation, sentiment, conversion, customer outcomes, or deployment success unless a separate governed observation and receipt establishes that specific outcome.',
  },
  {
    question: 'How does Citable relate to Nebula?',
    answer:
      'Citable is not a second SaaS competing with Nebula. It is the open evidence layer that underpins Nebula: a reusable verification methodology for deciding what can be observed, supported, reproduced, and claimed. Nebula is the commercial application that turns verified evidence into landing-page diagnostics, recommendations, repairs, and follow-up decisions.',
  },
  {
    question: 'When should I use Citable?',
    answer:
      'Use Citable when a decision needs inspectable inputs, explicit limits, registered support, and a preserved evidence package. Use separate crawler, rank-tracking, or AI-visibility monitoring when ongoing external-system behavior is the decision input.',
  },
]

export const citableLicenseFacts = {
  identifier: citableReleaseFacts.license,
  label: citableReleaseFacts.license.replace('-', ' '),
  url: `https://spdx.org/licenses/${encodeURIComponent(citableReleaseFacts.license)}.html`,
} as const

export const citableControlledAssets = [
  {
    label: 'Release projection data',
    href: '/resources/citable/resource-data.json',
    detail: 'Byte-exact controlled resource-data projection served by this site.',
  },
  {
    label: 'Machine-readable release summary',
    href: '/resources/citable/llms.txt',
    detail: 'Byte-exact controlled llms.txt release asset served by this site.',
  },
  {
    label: 'Controlled-surface governance notes',
    href: '/resources/citable/README.md',
    detail: 'The receipt and finalization requirements for the controlled surfaces.',
  },
] as const

export type CitableProofStatus = 'documented' | 'unknown' | 'not_published'

export interface CitableProofRecord {
  key: 'package' | 'workflow' | 'deployment' | 'customer' | 'benchmark'
  label: string
  status: CitableProofStatus
  detail: string
}

export function getCitableProofRecords(): readonly CitableProofRecord[] {
  const publishedCases = getPublishedCaseStudies()
  const publishedBenchmarks = getPublishedBenchmarks()

  return [
    {
      key: 'package',
      label: 'Published package',
      status: 'documented',
      detail: `Version ${citableReleaseFacts.version}, package counts, runtime requirement, and license come from the synchronized ${citableReleaseFacts.source} projection.`,
    },
    {
      key: 'workflow',
      label: 'Workflow state',
      status: 'unknown',
      detail: 'Workflow verification remains unavailable because no fresh committed workflow receipt is projected here.',
    },
    {
      key: 'deployment',
      label: 'Deployment state',
      status: 'unknown',
      detail: 'Deployment verification remains unavailable because no fresh committed receipt proves the current live surfaces.',
    },
    {
      key: 'customer',
      label: 'Customer cases',
      status: publishedCases.length > 0 ? 'documented' : 'not_published',
      detail: publishedCases.length > 0
        ? 'Published customer cases come only from the governed public-proof projection.'
        : 'Customer cases are not published because the governed public projection is empty.',
    },
    {
      key: 'benchmark',
      label: 'Benchmark outcomes',
      status: publishedBenchmarks.length > 0 ? 'documented' : 'not_published',
      detail: publishedBenchmarks.length > 0
        ? 'Published benchmark outcomes come only from the governed public-proof projection.'
        : 'Benchmark outcomes are not published because no governed methodology and result projection is available.',
    },
  ]
}

const quickStartPath = `${CITABLE_OVERVIEW_PATH}/quick-start`
const technicalPath = `${CITABLE_OVERVIEW_PATH}/jobs/technical-retrieval-audit`
const claimsPath = `${CITABLE_OVERVIEW_PATH}/jobs/claim-evidence-governance`
const answersPath = `${CITABLE_OVERVIEW_PATH}/jobs/answer-extractability-audit`
const entitiesPath = `${CITABLE_OVERVIEW_PATH}/jobs/entity-narrative-audit`
const releasesPath = `${CITABLE_OVERVIEW_PATH}/jobs/release-deployment-verification`
const comparePath = `${CITABLE_OVERVIEW_PATH}/compare`
const releaseNotesPath = `${CITABLE_OVERVIEW_PATH}/releases`

export type CitableComparisonStatus = 'documented' | 'not_assessed' | 'requires_external_source'

export interface CitableComparisonRow {
  category: string
  workflow: string
  status: CitableComparisonStatus
  boundary: string
  operationalNeed: string
}

export const citableComparisonStatusLabels: Record<CitableComparisonStatus, string> = {
  documented: 'Documented',
  not_assessed: 'Not assessed',
  requires_external_source: 'Requires external source',
}

export const citableComparisonRows: readonly CitableComparisonRow[] = [
  {
    category: 'Evidence and claim governance',
    workflow: 'Record bounded observations, validate registries, and retain evidence for review.',
    status: 'documented',
    boundary:
      'The synchronized package documentation describes this evidence-governance workflow; it does not establish a customer outcome.',
    operationalNeed: 'Use Citable when the decision needs inspectable inputs, limits, and a preserved evidence package.',
  },
  {
    category: 'Category or vendor feature parity',
    workflow: 'Compare named products, commercial plans, or unverified feature availability.',
    status: 'not_assessed',
    boundary:
      'No named-vendor feature, pricing, coverage, or quality comparison is assessed on this page.',
    operationalNeed: 'Collect dated primary-source material and have the responsible owner evaluate a bounded comparison separately.',
  },
  {
    category: 'Live crawling and index coverage',
    workflow: 'Monitor how external crawlers fetch, index, and revisit a changing live estate.',
    status: 'requires_external_source',
    boundary:
      'A bounded Citable fetch can document its own collection; it cannot establish ongoing crawler behavior or index coverage.',
    operationalNeed: 'A crawler is still required when external crawl, index, or log observations are the decision input.',
  },
  {
    category: 'Search-rank monitoring',
    workflow: 'Measure query positions, market variation, and rank movement over time.',
    status: 'requires_external_source',
    boundary:
      'Citable does not collect or infer search ranking positions from an evidence package.',
    operationalNeed: 'A rank tracker is still required when query, locale, device, or time-series rank evidence is needed.',
  },
  {
    category: 'AI-visibility monitoring',
    workflow: 'Observe provider responses, mentions, citations, and recommendation behavior over time.',
    status: 'requires_external_source',
    boundary:
      'Readable source content and controlled extraction do not prove downstream provider retrieval, citation, or recommendation.',
    operationalNeed: 'An AI-visibility monitoring platform is still required for controlled external-provider observations.',
  },
] as const

const jobRoutes: readonly CitableJobRoute[] = [
  {
    key: 'technical-retrieval-audit',
    kind: 'job',
    status: 'published',
    slug: 'technical-retrieval-audit',
    path: technicalPath,
    title: 'Technical Retrieval Audit with Citable',
    h1: 'Audit technical retrieval eligibility',
    eyebrow: 'Retrieval evidence',
    description:
      'Establish what a bounded Citable run observed about HTTP access, crawler directives, discovery paths, and rendered resources without treating eligibility as indexing or ranking.',
    primaryQuestion: 'Is this site technically retrievable?',
    directAnswer:
      'Citable can record whether the audited targets were technically retrievable during a bounded run. It preserves the responses, directives, discovery paths, and detector findings needed to inspect that observation; it does not prove future crawling, indexing, ranking, or citation.',
    observes: [
      'HTTP status, redirect, header, robots, sitemap, canonical, hreflang, and link-discovery conditions exposed to the selected audit target.',
      'Declared desktop, mobile, JavaScript-disabled, or crawler-specific evidence only when those collectors are explicitly run.',
      'The exact target, configuration, tool version, and collection time attached to the run.',
    ],
    artifacts: [
      'Run manifest and checksums',
      'Captured headers, robots.txt, and sitemap responses',
      'Link graph, findings.json, and report.md',
      'Optional render or crawler observations when their required collectors completed',
    ],
    limits: [
      'A successful fetch does not establish that a search engine or answer engine crawled, indexed, ranked, or cited the resource.',
      'A local build audit does not establish the state of a live deployment.',
      'Missing credentials, browser dependencies, logs, or owner exports leave the corresponding evidence incomplete.',
    ],
    nextStep:
      'Resolve deterministic blockers first, preserve the source run, then repeat the same collection profile so the before-and-after observations remain comparable.',
    relatedPaths: [quickStartPath, answersPath, releasesPath],
  },
  {
    key: 'claim-evidence-governance',
    kind: 'job',
    status: 'published',
    slug: 'claim-evidence-governance',
    path: claimsPath,
    title: 'Claim and Evidence Governance with Citable',
    h1: 'Govern claims against inspectable evidence',
    eyebrow: 'Claim governance',
    description:
      'Use Citable registries and review gates to separate unsupported, supported, expired, and human-reviewed claims before publication.',
    primaryQuestion: 'Can this claim be published and defended?',
    directAnswer:
      'Citable can establish whether a claim has the required registered evidence, freshness, references, and review state under the declared policy. It cannot make the underlying statement true, replace subject-matter review, or turn missing customer evidence into an outcome claim.',
    observes: [
      'Claim status, linked evidence, evidence freshness, source references, and declared review requirements.',
      'Schema validity and referential integrity across claim, evidence, reviewer, review-policy, and exception records.',
      'Whether automated checks must block, downgrade, or queue a claim for human semantic review.',
    ],
    artifacts: [
      'Schema-validated claim and evidence registry records',
      'Finding evidence and required-input states',
      'Review queue items and hash-bound decisions when a review is performed',
      'History-preserving registry changes and governed exception records',
    ],
    limits: [
      'Registry validity does not independently prove factual truth or source authority.',
      'Automation cannot promote a claim to verified without the evidence and human review required by policy.',
      'No customer result, benchmark, endorsement, or causal claim is available when its governed proof record is absent.',
    ],
    nextStep:
      'Add or refresh the missing source evidence, route semantic judgments to an authorized reviewer, and publish only the bounded statement the resulting record supports.',
    relatedPaths: [quickStartPath, answersPath, entitiesPath],
  },
  {
    key: 'answer-extractability-audit',
    kind: 'job',
    status: 'published',
    slug: 'answer-extractability-audit',
    path: answersPath,
    title: 'Answer Extractability Audit with Citable',
    h1: 'Audit answer extractability',
    eyebrow: 'Answer extraction',
    description:
      'Inspect whether a bounded answer and its supporting context can be extracted from the audited source without claiming downstream citation or recommendation.',
    primaryQuestion: 'Can an answer engine reliably extract this answer?',
    directAnswer:
      'Citable can inspect whether the audited source exposes a clear answer passage, supporting context, and machine-readable structure under the selected collection method. It cannot prove that an external answer engine will retrieve, quote, cite, recommend, or rank that answer.',
    observes: [
      'Answer passages, heading relationships, prompt-to-page coverage, structured data, and source context available to the selected collector.',
      'Differences between raw and rendered content when render evidence is explicitly collected.',
      'Whether answer claims link to governed evidence rather than standing as unsupported assertions.',
    ],
    artifacts: [
      'Extracted passage observations with source anchors',
      'ANS, SCHEMA, PAGE, and related findings',
      'Raw or rendered source captures used by the run',
      'Manifest, configuration, report, and checksums',
    ],
    limits: [
      'Extraction is not claim support; a readable passage can still contain an unsupported statement.',
      'Local or controlled extraction is not evidence of external citation, inclusion, sentiment, ranking, or recommendation.',
      'Optional render, prompt, and owner-export inputs remain incomplete when their dependencies are absent.',
    ],
    nextStep:
      'Clarify the direct answer and its support on the source page, rerun the same extraction profile, and use external observation data separately if downstream behavior must be measured.',
    relatedPaths: [quickStartPath, claimsPath, entitiesPath],
  },
  {
    key: 'entity-narrative-audit',
    kind: 'job',
    status: 'published',
    slug: 'entity-narrative-audit',
    path: entitiesPath,
    title: 'Entity and Narrative Audit with Citable',
    h1: 'Audit entity and narrative consistency',
    eyebrow: 'Entity consistency',
    description:
      'Compare declared entity identifiers, relationships, structured data, and narrative claims across controlled sources.',
    primaryQuestion: 'Is the entity represented consistently?',
    directAnswer:
      'Citable can identify whether controlled pages and registries use consistent entity identifiers, relationships, and bounded narrative claims. It cannot prove that an external knowledge graph has accepted the identity or that an answer engine will represent it the same way.',
    observes: [
      'Canonical entity records, stable identifiers, sameAs references, structured data, page ownership, and primary-entity mappings.',
      'Conflicts between controlled narrative statements and registered claims or evidence.',
      'Missing or ambiguous relationships that require an owner or reviewer decision.',
    ],
    artifacts: [
      'Entity and page registry records',
      'ENTITY, GEO, SCHEMA, and claim-governance findings',
      'Captured structured data and source-page evidence',
      'Review items for semantic identity or narrative decisions',
    ],
    limits: [
      'Consistent controlled markup does not establish external knowledge-graph adoption.',
      'sameAs links are declarations, not proof that the referenced profiles are authoritative or controlled.',
      'Citable does not infer reputation, sentiment, endorsement, or customer outcomes from entity consistency.',
    ],
    nextStep:
      'Resolve controlled-source conflicts first, obtain authoritative references for disputed relationships, and separately observe external representations when that evidence is required.',
    relatedPaths: [quickStartPath, claimsPath, answersPath],
  },
  {
    key: 'release-deployment-verification',
    kind: 'job',
    status: 'published',
    slug: 'release-deployment-verification',
    path: releasesPath,
    title: 'Release and Deployment Verification with Citable',
    h1: 'Verify release and deployment evidence',
    eyebrow: 'Release evidence',
    description:
      'Separate a documented package release from workflow execution and live-surface deployment proof.',
    primaryQuestion: 'Did this release reach its controlled surfaces?',
    directAnswer:
      'Citable can establish live-surface delivery only when a release manifest and fresh, schema-valid deployment receipts verify every required controlled surface. This site documents the synchronized package release, but current workflow and deployment verification remain unknown because no fresh committed receipt is projected here.',
    observes: [
      'Release-manifest declarations, expected bytes or checksums, controlled-surface URLs, and receipt validation results.',
      'Per-surface success or failure observations produced by an explicitly run deployment-receipt collector.',
      'The distinction between package publication, workflow execution, and live deployment state.',
    ],
    artifacts: [
      'Synchronized package release projection',
      'Release manifest and controlled-surface declarations',
      'Schema-valid per-surface deployment receipts when collected',
      'Checksums and failure observations retained by the release process',
    ],
    limits: [
      'A package version or changelog entry does not prove workflow success or deployment.',
      'A successful workflow does not prove that every controlled surface serves the expected bytes.',
      'Missing, stale, incomplete, or uncommitted receipts leave deployment state unknown rather than passing.',
    ],
    nextStep:
      'Run the governed receipt collector for the release, commit the fresh validation artifacts, and treat any absent or failed required surface as a release blocker.',
    relatedPaths: [quickStartPath, technicalPath, claimsPath],
  },
] as const

export const citableRoutes: readonly CitableRoute[] = [
  {
    key: 'overview',
    kind: 'overview',
    status: 'published',
    path: CITABLE_OVERVIEW_PATH,
    title: 'Citable - Evidence for Search and AI Readiness',
    h1: 'Citable',
    eyebrow: 'Open-source evidence layer',
    description:
      'Citable is the open evidence layer beneath Nebula: it records what a web property makes technically available, what its content can support, and what external systems have actually been observed doing.',
    primaryQuestion: 'What can Citable establish without promising rankings or citations?',
    directAnswer:
      'Citable is the open evidence layer. It establishes bounded observations about retrieval, extraction, claim support, entity consistency, and controlled change. Nebula is the application that uses those verified observations to answer what is broken, why the team believes it is broken, and what to change next. Citable preserves the evidence while keeping ranking, citation, conversion, workflow, deployment, customer, and benchmark outcomes explicitly separate.',
    relatedPaths: [quickStartPath, ...jobRoutes.map(({ path }) => path)],
  },
  {
    key: 'quick-start',
    kind: 'quick-start',
    status: 'published',
    path: quickStartPath,
    title: 'Citable Quick Start',
    h1: 'Run your first evidence-bounded Citable audit',
    eyebrow: 'Quick start',
    description:
      'Install the projected Citable package, run a bounded audit, inspect its evidence, decide from explicit limits, and verify changes with a comparable follow-up run.',
    primaryQuestion: 'How do I install, audit, inspect evidence, decide, and verify?',
    directAnswer:
      'Use the synchronized package version and preserve each run as evidence: install, initialize and audit, inspect the artifacts, review the generated action plan, then repeat the same collection profile before comparing change.',
    relatedPaths: jobRoutes.map(({ path }) => path),
  },
  ...jobRoutes,
  {
    key: 'compare',
    kind: 'compare',
    status: 'published',
    path: comparePath,
    title: 'When to Use Citable',
    h1: 'Choose the right verification layer',
    eyebrow: 'Category comparison',
    description:
      'Choose Citable for bounded evidence and governance work, while retaining separate crawler, rank-tracking, and AI-visibility observations where they are required.',
    primaryQuestion: 'When is Citable a verification layer rather than a monitoring replacement?',
    directAnswer:
      'Citable is appropriate when the work needs bounded technical, claim, entity, or answer-support evidence that can be inspected and preserved. It is not a substitute for external crawler, ranking, or AI-visibility monitoring when those observations are the decision input.',
    relatedPaths: [quickStartPath, technicalPath, answersPath, releaseNotesPath],
  },
  {
    key: 'releases',
    kind: 'release',
    status: 'published',
    path: releaseNotesPath,
    title: 'Citable Release Evidence',
    h1: 'Inspect the synchronized Citable release',
    eyebrow: 'Current release',
    description:
      'Inspect package facts and release highlights from the synchronized Citable projection without treating them as workflow or deployment proof.',
    primaryQuestion: 'What changed in the synchronized published release?',
    directAnswer:
      'This page projects the current published package facts and highlights from the synchronized release record. It does not publish manual release history or establish workflow execution or live deployment without a fresh committed receipt.',
    relatedPaths: [quickStartPath, releasesPath, comparePath],
  },
] as const

export const citableJobRoutes: readonly CitableJobRoute[] = jobRoutes

export function getPublishedCitableRoutes(options: { includeOverview?: boolean } = {}) {
  return citableRoutes.filter(
    (route) =>
      route.status === 'published' &&
      (options.includeOverview === true || route.kind !== 'overview'),
  )
}

export function getCitableRouteByPath(path: string) {
  return citableRoutes.find((route) => route.path === path)
}

export function getCitableJobBySlug(slug: string) {
  return citableJobRoutes.find((route) => route.slug === slug)
}

export function getCitableMetadata(route: CitableRoute): Metadata {
  const canonical = `${CITABLE_ORIGIN}${route.path}`
  return {
    title: `${route.title} | Nebula Components`,
    description: route.description,
    alternates: { canonical },
    openGraph: {
      title: route.title,
      description: route.description,
      url: canonical,
      siteName: 'Nebula Components',
      type: route.kind === 'overview' ? 'website' : 'article',
    },
  }
}

const packageCommand = `npx ${citableReleaseFacts.packageName}@${citableReleaseFacts.version}`

export const citableQuickStartSteps = [
  {
    key: 'install',
    label: 'Install',
    explanation:
      'Install the version named by the synchronized release projection into the supported coding-agent layout you select.',
    commands: [`${packageCommand} install`],
  },
  {
    key: 'audit',
    label: 'Audit',
    explanation:
      'Initialize the non-destructive project registries, then audit a declared build target and base URL.',
    commands: [
      `${packageCommand} init`,
      `${packageCommand} audit --target ./dist --base-url https://example.com`,
    ],
  },
  {
    key: 'inspect',
    label: 'Inspect evidence',
    explanation:
      'Read the run manifest, findings, report, captured responses, and checksums. Export and verify a portable copy before handing it off.',
    commands: [
      `${packageCommand} artifacts export <run-id> --output ./citable-run`,
      `${packageCommand} artifacts verify --input ./citable-run`,
    ],
  },
  {
    key: 'decide',
    label: 'Decide',
    explanation:
      'Generate the ordered action plan, then have the responsible owner review blockers, evidence limits, and semantic-review gates.',
    commands: [`${packageCommand} action-plan <run-id>`],
  },
  {
    key: 'verify',
    label: 'Verify',
    explanation:
      'Repeat the same audit profile after the controlled change and compare only runs whose target, configuration, observation method, and evidence remain compatible.',
    commands: [
      `${packageCommand} audit --target ./dist --base-url https://example.com`,
      `${packageCommand} monitor <run-a> <run-b>`,
    ],
  },
] as const
