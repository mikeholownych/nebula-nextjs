import citableRelease from '../../data/citable-release.json'
import publicProofProjection from '../../data/public-proof.generated.json'

export type FixPackPublicFact = {
  status: 'active'
  priceCents: number
  currency: 'USD'
  priceValidUntil: string
  fulfillmentReceiptId: string
  checkout: {
    provider: 'stripe'
    mode: 'checkout_session'
    offerKey: string
    pagePath: '/checkout'
    sessionEndpoint: '/api/checkout'
  }
  delivery: {
    artifact: 'tailored_implementation_kit'
    method: 'automated_email'
    timing: 'after_successful_payment'
  }
  implementation: {
    owner: 'customer_or_developer'
    nebulaSiteAccess: 'none'
  }
  reAudit: {
    status: 'included'
    windowDays: number
  }
}

export type FixPackReceiptFact = {
  id: string
  provider: 'stripe'
  amountCents: number
  currency: 'usd'
  offerKey: string
}

export type FixPackFulfillmentFacts = {
  currentReceiptId: string
  receipts: readonly FixPackReceiptFact[]
}

export type PublishedCaseStudy = {
  slug: string
  claimId: string
  evidenceIds: string[]
  title: string
  eyebrow: string
  description: string
  outcome: string
  outcomeLabel: string
  situation: string
  diagnosis: string
  fixes: string[]
  result: string
  methodology: string
  evidenceUrl: string
  measurementWindow: {
    startedAt: string
    endedAt: string
  }
  publicationPermission: {
    granted: true
    grantedAt: string
  }
  review: {
    status: 'approved'
    reviewedAt: string
    expiresAt: string
  }
  validUntil: string
  disclosure: string
  publishedAt: string
  modifiedAt: string
}

export type PublishedBenchmark = {
  slug: string
  claimId: string
  evidenceIds: string[]
  title: string
  description: string
  outcome: string
  outcomeLabel: string
  methodology: string
  evidenceUrl: string
  measurementWindow: {
    startedAt: string
    endedAt: string
  }
  publicationPermission: {
    granted: true
    grantedAt: string
  }
  review: {
    status: 'approved'
    reviewedAt: string
    expiresAt: string
  }
  validUntil: string
  disclosure: string
  publishedAt: string
  modifiedAt: string
}

export type CitablePublicFacts = {
  package: string
  version: string
  releasedAt: string
  detectorCount: number
  namespaceCount: number
  registryCount: number
  nodeRequirement: string
  license: string
  source: string
  workflowCheck: 'unknown'
  deploymentCheck: 'unknown'
}

const currentFixPackReceipt = {
  id: 'fix-pack-usd-97-2026',
  provider: 'stripe',
  amountCents: 9700,
  currency: 'usd',
  offerKey: 'fix-pack',
} as const satisfies FixPackReceiptFact

const fixPackFulfillment = {
  currentReceiptId: currentFixPackReceipt.id,
  // Append-only receipt history. Replacing the public offer must not make a
  // delayed or retried payment for a retired offer impossible to fulfill.
  receipts: [currentFixPackReceipt],
} as const satisfies FixPackFulfillmentFacts

export const publicFacts = {
  // Immutable receipt-matching facts are independent of whether this price
  // may still be advertised. A delayed, already-paid canonical receipt must
  // fulfill deterministically after the public availability window closes.
  fixPackFulfillment,
  fixPack: {
    status: 'active',
    priceCents: currentFixPackReceipt.amountCents,
    currency: 'USD',
    priceValidUntil: '2026-12-31',
    fulfillmentReceiptId: currentFixPackReceipt.id,
    checkout: {
      provider: currentFixPackReceipt.provider,
      mode: 'checkout_session',
      offerKey: currentFixPackReceipt.offerKey,
      pagePath: '/checkout',
      sessionEndpoint: '/api/checkout',
    },
    delivery: {
      artifact: 'tailored_implementation_kit',
      method: 'automated_email',
      timing: 'after_successful_payment',
    },
    implementation: {
      owner: 'customer_or_developer',
      nebulaSiteAccess: 'none',
    },
    reAudit: {
      status: 'included',
      windowDays: 30,
    },
  },
  caseStudies: {
    get status() {
      return getPublishedCaseStudies().length > 0 ? 'published' : 'none_published'
    },
    get entries() {
      return getPublishedCaseStudies()
    },
  },
  benchmarks: {
    get status() {
      return getPublishedBenchmarks().length > 0 ? 'published' : 'none_published'
    },
    get entries() {
      return getPublishedBenchmarks()
    },
  },
  citable: {
    release: citableRelease,
    // A release projection establishes package facts, not the state of a
    // workflow or deployment. These remain unknown until a fresh committed
    // receipt is available and validated.
    workflowCheck: 'unknown',
    deploymentCheck: 'unknown',
  },
} as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

const isIsoDate = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

function isValidFixPack(
  value: unknown,
  currentReceipt: FixPackReceiptFact,
  at: Date,
): value is FixPackPublicFact {
  if (!isRecord(value)) return false
  if (
    value.status !== 'active' ||
    !isPositiveInteger(value.priceCents) ||
    value.currency !== 'USD' ||
    !isIsoDate(value.priceValidUntil) ||
    value.fulfillmentReceiptId !== currentReceipt.id ||
    value.priceCents !== currentReceipt.amountCents
  ) return false

  const validUntil = new Date(`${value.priceValidUntil}T23:59:59.999Z`)
  if (Number.isNaN(at.getTime()) || at.getTime() > validUntil.getTime()) return false

  const checkout = value.checkout
  const delivery = value.delivery
  const implementation = value.implementation
  const reAudit = value.reAudit
  if (
    !isRecord(checkout) ||
    checkout.provider !== 'stripe' ||
    checkout.mode !== 'checkout_session' ||
    checkout.offerKey !== currentReceipt.offerKey ||
    checkout.pagePath !== '/checkout' ||
    checkout.sessionEndpoint !== '/api/checkout'
  ) return false

  return (
    isRecord(delivery) &&
    delivery.artifact === 'tailored_implementation_kit' &&
    delivery.method === 'automated_email' &&
    delivery.timing === 'after_successful_payment' &&
    isRecord(implementation) &&
    implementation.owner === 'customer_or_developer' &&
    implementation.nebulaSiteAccess === 'none' &&
    isRecord(reAudit) &&
    reAudit.status === 'included' &&
    isPositiveInteger(reAudit.windowDays)
  )
}

export function getActiveFixPack(
  source: unknown = publicFacts,
  at: Date = new Date(),
): FixPackPublicFact | undefined {
  if (!isRecord(source)) return undefined
  const fulfillment = getFixPackFulfillmentFacts(source)
  if (!fulfillment) return undefined
  const currentReceipt = fulfillment.receipts.find(
    (receipt) => receipt.id === fulfillment.currentReceiptId,
  )
  if (!currentReceipt) return undefined
  return isValidFixPack(source.fixPack, currentReceipt, at)
    ? source.fixPack
    : undefined
}

function getFixPackFulfillmentFacts(
  source: unknown,
): FixPackFulfillmentFacts | undefined {
  if (
    !isRecord(source) ||
    !isRecord(source.fixPackFulfillment)
  ) return undefined

  const fulfillment = source.fixPackFulfillment
  if (
    !isNonEmptyString(fulfillment.currentReceiptId) ||
    !Array.isArray(fulfillment.receipts) ||
    fulfillment.receipts.length === 0
  ) return undefined

  const ids = new Set<string>()
  const receipts: FixPackReceiptFact[] = []
  for (const value of fulfillment.receipts) {
    if (
      !isRecord(value) ||
      !isNonEmptyString(value.id) ||
      value.provider !== 'stripe' ||
      !isPositiveInteger(value.amountCents) ||
      value.currency !== 'usd' ||
      !isNonEmptyString(value.offerKey) ||
      ids.has(value.id)
    ) return undefined
    ids.add(value.id)
    receipts.push(value as FixPackReceiptFact)
  }
  if (!ids.has(fulfillment.currentReceiptId)) return undefined

  return {
    currentReceiptId: fulfillment.currentReceiptId,
    receipts,
  }
}

export function isCanonicalFixPackReceipt(
  receipt: unknown,
  source: unknown = publicFacts,
): boolean {
  const fulfillment = getFixPackFulfillmentFacts(source)
  if (!fulfillment || !isRecord(receipt) || !isRecord(receipt.metadata)) return false
  const metadata = receipt.metadata
  if (
    receipt.livemode === true &&
    receipt.payment_status === 'paid' &&
    typeof receipt.currency === 'string' &&
    typeof receipt.amount_total === 'number' &&
    typeof metadata.offer_key === 'string'
  ) {
    return fulfillment.receipts.some((fact) => (
      receipt.currency === fact.currency &&
      receipt.amount_total === fact.amountCents &&
      metadata.offer_key === fact.offerKey
    ))
  }
  return false
}

function isPublishedCaseStudy(
  value: unknown,
  evaluationDate: string,
): value is PublishedCaseStudy {
  if (!isRecord(value)) return false
  if (
    !isNonEmptyString(value.slug) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) ||
    !isNonEmptyString(value.claimId) ||
    !Array.isArray(value.evidenceIds) ||
    value.evidenceIds.length === 0 ||
    !value.evidenceIds.every(isNonEmptyString) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.eyebrow) ||
    !isNonEmptyString(value.description) ||
    !isNonEmptyString(value.outcome) ||
    !isNonEmptyString(value.outcomeLabel) ||
    !isNonEmptyString(value.situation) ||
    !isNonEmptyString(value.diagnosis) ||
    !Array.isArray(value.fixes) ||
    value.fixes.length === 0 ||
    !value.fixes.every(isNonEmptyString) ||
    !isNonEmptyString(value.result) ||
    !isNonEmptyString(value.methodology) ||
    !isNonEmptyString(value.evidenceUrl) ||
    !isNonEmptyString(value.disclosure) ||
    !isIsoDate(value.validUntil) ||
    value.validUntil < evaluationDate ||
    !isIsoDate(value.publishedAt) ||
    !isIsoDate(value.modifiedAt)
  ) return false

  const measurementWindow = value.measurementWindow
  const publicationPermission = value.publicationPermission
  const review = value.review
  if (
    !isRecord(measurementWindow) ||
    !isIsoDate(measurementWindow.startedAt) ||
    !isIsoDate(measurementWindow.endedAt) ||
    measurementWindow.startedAt > measurementWindow.endedAt ||
    !isRecord(publicationPermission) ||
    publicationPermission.granted !== true ||
    !isIsoDate(publicationPermission.grantedAt) ||
    !isRecord(review) ||
    review.status !== 'approved' ||
    !isIsoDate(review.reviewedAt) ||
    !isIsoDate(review.expiresAt)
  ) return false

  try {
    return new URL(value.evidenceUrl).protocol === 'https:'
  } catch {
    return false
  }
}

export function getPublishedCaseStudies(
  source: unknown = publicProofProjection,
  at: Date = new Date(),
): PublishedCaseStudy[] {
  if (!isRecord(source) || !Array.isArray(source.cases)) return []
  if (Number.isNaN(at.getTime())) return []
  const evaluationDate = at.toISOString().slice(0, 10)
  return source.cases.filter(
    (value): value is PublishedCaseStudy =>
      isPublishedCaseStudy(value, evaluationDate),
  )
}

function isPublishedBenchmark(
  value: unknown,
  evaluationDate: string,
): value is PublishedBenchmark {
  if (!isRecord(value)) return false
  if (
    !isNonEmptyString(value.slug) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) ||
    !isNonEmptyString(value.claimId) ||
    !Array.isArray(value.evidenceIds) ||
    value.evidenceIds.length === 0 ||
    !value.evidenceIds.every(isNonEmptyString) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.description) ||
    !isNonEmptyString(value.outcome) ||
    !isNonEmptyString(value.outcomeLabel) ||
    !isNonEmptyString(value.methodology) ||
    !isNonEmptyString(value.evidenceUrl) ||
    !isNonEmptyString(value.disclosure) ||
    !isIsoDate(value.validUntil) ||
    value.validUntil < evaluationDate ||
    !isIsoDate(value.publishedAt) ||
    !isIsoDate(value.modifiedAt)
  ) return false

  const measurementWindow = value.measurementWindow
  const publicationPermission = value.publicationPermission
  const review = value.review
  if (
    !isRecord(measurementWindow) ||
    !isIsoDate(measurementWindow.startedAt) ||
    !isIsoDate(measurementWindow.endedAt) ||
    measurementWindow.startedAt > measurementWindow.endedAt ||
    !isRecord(publicationPermission) ||
    publicationPermission.granted !== true ||
    !isIsoDate(publicationPermission.grantedAt) ||
    !isRecord(review) ||
    review.status !== 'approved' ||
    !isIsoDate(review.reviewedAt) ||
    !isIsoDate(review.expiresAt)
  ) return false

  try {
    return new URL(value.evidenceUrl).protocol === 'https:'
  } catch {
    return false
  }
}

export function getPublishedBenchmarks(
  source: unknown = publicProofProjection,
  at: Date = new Date(),
): PublishedBenchmark[] {
  if (!isRecord(source) || !Array.isArray(source.benchmarks)) return []
  if (Number.isNaN(at.getTime())) return []
  const evaluationDate = at.toISOString().slice(0, 10)
  return source.benchmarks.filter(
    (value): value is PublishedBenchmark =>
      isPublishedBenchmark(value, evaluationDate),
  )
}

export function getCitablePublicFacts(
  source: unknown = publicFacts,
): CitablePublicFacts | undefined {
  if (!isRecord(source) || !isRecord(source.citable)) return undefined
  const { citable } = source
  if (
    citable.workflowCheck !== 'unknown' ||
    citable.deploymentCheck !== 'unknown' ||
    !isRecord(citable.release)
  ) return undefined

  const release = citable.release
  if (
    !isNonEmptyString(release.package) ||
    !isNonEmptyString(release.version) ||
    !isIsoDate(release.releasedAt) ||
    !isPositiveInteger(release.detectorCount) ||
    !isPositiveInteger(release.namespaceCount) ||
    !isPositiveInteger(release.registryCount) ||
    !isNonEmptyString(release.nodeRequirement) ||
    !isNonEmptyString(release.license) ||
    !isNonEmptyString(release.source)
  ) return undefined

  return {
    package: release.package,
    version: release.version,
    releasedAt: release.releasedAt,
    detectorCount: release.detectorCount,
    namespaceCount: release.namespaceCount,
    registryCount: release.registryCount,
    nodeRequirement: release.nodeRequirement,
    license: release.license,
    source: release.source,
    workflowCheck: 'unknown',
    deploymentCheck: 'unknown',
  }
}

export function formatUsd(priceCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(priceCents / 100)
}
