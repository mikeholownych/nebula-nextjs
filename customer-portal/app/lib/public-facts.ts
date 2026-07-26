import citableRelease from '../../data/citable-release.json'

export type FixPackPublicFact = {
  status: 'active'
  priceCents: number
  currency: 'USD'
  priceValidUntil: string
  checkout: {
    provider: 'stripe'
    offerKey: 'fix-pack'
    url: string
  }
  delivery: {
    artifact: 'tailored_prompt_pack'
    method: 'automated_email'
    timing: 'within_minutes'
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

export type FixPackFulfillmentFacts = {
  provider: 'stripe'
  amountCents: number
  currency: 'usd'
  offerKey: 'fix-pack'
}

export type PublishedCaseStudy = {
  slug: string
  title: string
  eyebrow: string
  description: string
  outcome: string
  outcomeLabel: string
  situation: string
  diagnosis: string
  fixes: string[]
  result: string
  evidenceUrl: string
  measurementWindow: {
    startedAt: string
    endedAt: string
  }
  publicationPermission: {
    granted: true
    grantedAt: string
  }
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

const fixPackFulfillment = {
  provider: 'stripe',
  amountCents: 9700,
  currency: 'usd',
  offerKey: 'fix-pack',
} as const satisfies FixPackFulfillmentFacts

export const publicFacts = {
  // Immutable receipt-matching facts are independent of whether this price
  // may still be advertised. A delayed, already-paid canonical receipt must
  // fulfill deterministically after the public availability window closes.
  fixPackFulfillment,
  fixPack: {
    status: 'active',
    priceCents: fixPackFulfillment.amountCents,
    currency: 'USD',
    priceValidUntil: '2026-12-31',
    checkout: {
      provider: fixPackFulfillment.provider,
      offerKey: fixPackFulfillment.offerKey,
      url: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
    },
    delivery: {
      artifact: 'tailored_prompt_pack',
      method: 'automated_email',
      timing: 'within_minutes',
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
    status: 'none_published',
    entries: [],
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

function isValidFixPack(value: unknown, at: Date): value is FixPackPublicFact {
  if (!isRecord(value)) return false
  if (
    value.status !== 'active' ||
    !isPositiveInteger(value.priceCents) ||
    value.currency !== 'USD' ||
    !isIsoDate(value.priceValidUntil)
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
    checkout.offerKey !== 'fix-pack' ||
    !isNonEmptyString(checkout.url)
  ) return false

  try {
    const checkoutUrl = new URL(checkout.url)
    if (
      checkoutUrl.protocol !== 'https:' ||
      checkoutUrl.hostname !== 'buy.stripe.com' ||
      checkoutUrl.port !== '' ||
      checkoutUrl.username !== '' ||
      checkoutUrl.password !== ''
    ) return false
  } catch {
    return false
  }

  return (
    isRecord(delivery) &&
    delivery.artifact === 'tailored_prompt_pack' &&
    delivery.method === 'automated_email' &&
    delivery.timing === 'within_minutes' &&
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
  if (!getFixPackFulfillmentFacts(source)) return undefined
  return isValidFixPack(source.fixPack, at) ? source.fixPack : undefined
}

function getFixPackFulfillmentFacts(
  source: unknown,
): FixPackFulfillmentFacts | undefined {
  if (
    !isRecord(source) ||
    !isRecord(source.fixPackFulfillment) ||
    !isRecord(source.fixPack)
  ) return undefined

  const fulfillment = source.fixPackFulfillment
  const fixPack = source.fixPack
  const checkout = fixPack.checkout
  if (!isRecord(checkout)) return undefined

  if (
    fulfillment.provider !== 'stripe' ||
    !isPositiveInteger(fulfillment.amountCents) ||
    fulfillment.currency !== 'usd' ||
    fulfillment.offerKey !== 'fix-pack' ||
    fixPack.priceCents !== fulfillment.amountCents ||
    fixPack.currency !== 'USD' ||
    checkout.provider !== fulfillment.provider ||
    checkout.offerKey !== fulfillment.offerKey
  ) return undefined

  return fulfillment as FixPackFulfillmentFacts
}

export function isCanonicalFixPackReceipt(
  receipt: unknown,
  source: unknown = publicFacts,
): boolean {
  const fulfillment = getFixPackFulfillmentFacts(source)
  if (!fulfillment || !isRecord(receipt) || !isRecord(receipt.metadata)) return false

  return (
    receipt.livemode === true &&
    receipt.payment_status === 'paid' &&
    receipt.currency === fulfillment.currency &&
    receipt.amount_total === fulfillment.amountCents &&
    receipt.metadata.offer_key === fulfillment.offerKey
  )
}

function isPublishedCaseStudy(value: unknown): value is PublishedCaseStudy {
  if (!isRecord(value)) return false
  if (
    !isNonEmptyString(value.slug) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) ||
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
    !isNonEmptyString(value.evidenceUrl) ||
    !isNonEmptyString(value.disclosure) ||
    !isIsoDate(value.publishedAt) ||
    !isIsoDate(value.modifiedAt)
  ) return false

  const measurementWindow = value.measurementWindow
  const publicationPermission = value.publicationPermission
  if (
    !isRecord(measurementWindow) ||
    !isIsoDate(measurementWindow.startedAt) ||
    !isIsoDate(measurementWindow.endedAt) ||
    measurementWindow.startedAt > measurementWindow.endedAt ||
    !isRecord(publicationPermission) ||
    publicationPermission.granted !== true ||
    !isIsoDate(publicationPermission.grantedAt)
  ) return false

  try {
    return new URL(value.evidenceUrl).protocol === 'https:'
  } catch {
    return false
  }
}

export function getPublishedCaseStudies(
  source: unknown = publicFacts,
): PublishedCaseStudy[] {
  if (!isRecord(source) || !isRecord(source.caseStudies)) return []
  if (
    source.caseStudies.status !== 'published' ||
    !Array.isArray(source.caseStudies.entries)
  ) return []
  return source.caseStudies.entries.filter(isPublishedCaseStudy)
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
