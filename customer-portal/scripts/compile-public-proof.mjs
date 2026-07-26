#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(new URL('..', import.meta.url).pathname)
const argv = process.argv.slice(2)
const check = argv.includes('--check')

function option(name, fallback) {
  const index = argv.indexOf(name)
  if (index < 0) return resolve(root, fallback)
  if (!argv[index + 1] || argv[index + 1].startsWith('--')) {
    throw new Error(`${name} requires a path`)
  }
  return resolve(argv[index + 1])
}

function valueOption(name, fallback) {
  const index = argv.indexOf(name)
  if (index < 0) return fallback
  if (!argv[index + 1] || argv[index + 1].startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return argv[index + 1]
}

const claimsPath = option('--claims', '.citable/claims.yaml')
const evidencePath = option('--evidence', '.citable/evidence.yaml')
const surfacesPath = option('--surfaces', 'data/public-proof-surfaces.json')
const outputPath = option('--output', 'data/public-proof.generated.json')
const evaluationDate = valueOption('--at', new Date().toISOString().slice(0, 10))
const read = (file) => readFileSync(file, 'utf8')
const claims = parse(read(claimsPath))
const evidence = parse(read(evidencePath))
const surfaces = JSON.parse(read(surfacesPath))

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const publishableClaimStatuses = new Set(['verified', 'verified_narrowed'])
const publishableSupportStatuses = new Set(['directly_supported', 'partially_supported'])
const publishableEvidenceStatuses = new Set(['verified', 'reviewed'])
const commonFields = new Set([
  'type',
  'slug',
  'claimId',
  'evidenceIds',
  'title',
  'description',
  'outcome',
  'outcomeLabel',
  'methodology',
  'measurementWindow',
  'sourceArtifactUrl',
  'disclosure',
  'publicationPermission',
  'review',
  'publishedAt',
  'modifiedAt',
])
const caseFields = new Set([
  ...commonFields,
  'eyebrow',
  'situation',
  'diagnosis',
  'fixes',
  'result',
])

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function assertExactKeys(value, allowed, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object`)
  const unknown = Object.keys(value).filter((key) => !allowed.has(key))
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(', ')}`)
}

function validateRegistry(registry) {
  assertExactKeys(registry, new Set(['version', 'asOf', 'entries']), 'Public proof registry')
  if (registry.version !== 1) {
    throw new Error(`Unsupported public proof registry version: ${registry.version}`)
  }
  if (!isIsoDate(registry.asOf)) {
    throw new Error(`Invalid public proof asOf date: ${registry.asOf}`)
  }
  if (!Array.isArray(registry.entries)) {
    throw new Error('Public proof entries must be an array')
  }
}

function indexUnique(entries, idField, label) {
  if (!Array.isArray(entries)) throw new Error(`${label} entries must be an array`)
  const index = new Map()
  for (const entry of entries) {
    const id = entry?.[idField]
    if (!isNonEmptyString(id)) throw new Error(`${label} entry has an invalid ID`)
    if (index.has(id)) throw new Error(`Duplicate ${label.toLowerCase()} ID: ${id}`)
    index.set(id, entry)
  }
  return index
}

validateRegistry(surfaces)
if (!isIsoDate(evaluationDate)) {
  throw new Error(`Invalid public proof evaluation date: ${evaluationDate}`)
}
if (surfaces.asOf > evaluationDate) {
  throw new Error(
    `Public proof registry asOf date ${surfaces.asOf} is after evaluation date ${evaluationDate}`,
  )
}
const claimById = indexUnique(claims?.entries, 'claim_id', 'Claim')
const evidenceById = indexUnique(evidence?.entries, 'evidence_id', 'Evidence')

const seenSlugs = new Set()
for (const entry of surfaces.entries) {
  if (!isRecord(entry) || !isNonEmptyString(entry.slug)) continue
  if (seenSlugs.has(entry.slug)) throw new Error(`Duplicate public proof slug: ${entry.slug}`)
  seenSlugs.add(entry.slug)
}

function expiryDisposition(value, field, clock) {
  if (!Object.prototype.hasOwnProperty.call(value, field)) return 'current'
  if (!isIsoDate(value[field])) return 'invalid'
  return value[field] >= clock ? 'current' : 'expired'
}

function validateText(entry, field, reason, reasons) {
  if (!isNonEmptyString(entry[field])) reasons.push(reason)
}

function compileEntry(entry, index) {
  const reasons = []
  const validityDates = []
  if (!isRecord(entry)) {
    return {
      omission: {
        type: null,
        slug: null,
        reasons: ['entry_not_object'],
      },
    }
  }

  const type = entry.type
  const slug = entry.slug
  const allowedFields = type === 'case' ? caseFields : commonFields
  const unknownFields = Object.keys(entry).filter((key) => !allowedFields.has(key)).sort()
  if (unknownFields.length) reasons.push(`unknown_fields:${unknownFields.join(',')}`)

  if (type !== 'case' && type !== 'benchmark') {
    reasons.push(`invalid_type:${String(type)}`)
  }
  if (!isNonEmptyString(slug) || !slugPattern.test(slug)) {
    reasons.push(`invalid_slug:${String(slug)}`)
  }

  validateText(entry, 'title', 'missing_title', reasons)
  validateText(entry, 'description', 'missing_description', reasons)
  validateText(entry, 'outcome', 'missing_outcome', reasons)
  validateText(entry, 'outcomeLabel', 'missing_outcome_label', reasons)
  validateText(entry, 'methodology', 'missing_methodology', reasons)
  validateText(entry, 'disclosure', 'missing_disclosure', reasons)

  if (type === 'case') {
    validateText(entry, 'eyebrow', 'missing_eyebrow', reasons)
    validateText(entry, 'situation', 'missing_situation', reasons)
    validateText(entry, 'diagnosis', 'missing_diagnosis', reasons)
    validateText(entry, 'result', 'missing_result', reasons)
    if (
      !Array.isArray(entry.fixes) ||
      entry.fixes.length === 0 ||
      !entry.fixes.every(isNonEmptyString)
    ) {
      reasons.push('missing_fixes')
    }
  }

  const claim = isNonEmptyString(entry.claimId) ? claimById.get(entry.claimId) : undefined
  if (!isNonEmptyString(entry.claimId)) {
    reasons.push('missing_claim_id')
  } else if (!claim) {
    reasons.push(`missing_claim:${entry.claimId}`)
  } else {
    if (!publishableClaimStatuses.has(claim.status)) {
      reasons.push(`claim_status:${claim.status ?? 'missing'}`)
    }
    if (!publishableSupportStatuses.has(claim.support_assessment?.status)) {
      reasons.push(`support_status:${claim.support_assessment?.status ?? 'missing'}`)
    }
    const claimExpiry = expiryDisposition(claim, 'expires', evaluationDate)
    if (claimExpiry === 'invalid') reasons.push(`claim_invalid_date:${String(claim.expires)}`)
    if (claimExpiry === 'expired') reasons.push(`claim_expired:${claim.expires}`)
    if (claimExpiry === 'current' && Object.prototype.hasOwnProperty.call(claim, 'expires')) {
      validityDates.push(claim.expires)
    }
  }

  const evidenceIds = Array.isArray(entry.evidenceIds) ? entry.evidenceIds : []
  if (evidenceIds.length === 0) reasons.push('missing_evidence')
  const seenEvidenceIds = new Set()
  for (const evidenceId of evidenceIds) {
    if (!isNonEmptyString(evidenceId)) {
      reasons.push(`invalid_evidence_id:${String(evidenceId)}`)
      continue
    }
    if (seenEvidenceIds.has(evidenceId)) {
      reasons.push(`duplicate_evidence_id:${evidenceId}`)
      continue
    }
    seenEvidenceIds.add(evidenceId)
    const record = evidenceById.get(evidenceId)
    if (!record) {
      reasons.push(`missing_evidence:${evidenceId}`)
      continue
    }
    if (claim && (!Array.isArray(claim.evidence) || !claim.evidence.includes(evidenceId))) {
      reasons.push(`evidence_not_governed_by_claim:${evidenceId}`)
    }
    if (!publishableEvidenceStatuses.has(record.verification_status)) {
      reasons.push(`evidence_status:${evidenceId}:${record.verification_status ?? 'missing'}`)
    }
    const evidenceExpiry = expiryDisposition(record, 'valid_until', evaluationDate)
    if (evidenceExpiry === 'invalid') {
      reasons.push(`evidence_invalid_date:${evidenceId}:${String(record.valid_until)}`)
    }
    if (evidenceExpiry === 'expired') {
      reasons.push(`evidence_expired:${evidenceId}:${record.valid_until}`)
    }
    if (
      evidenceExpiry === 'current' &&
      Object.prototype.hasOwnProperty.call(record, 'valid_until')
    ) {
      validityDates.push(record.valid_until)
    }
  }

  const measurementWindow = entry.measurementWindow
  if (!isRecord(measurementWindow)) {
    reasons.push('missing_measurement_window')
  } else if (
    !isIsoDate(measurementWindow.startedAt) ||
    !isIsoDate(measurementWindow.endedAt)
  ) {
    reasons.push('invalid_measurement_window')
  } else if (measurementWindow.startedAt > measurementWindow.endedAt) {
    reasons.push('measurement_window_out_of_order')
  } else if (measurementWindow.endedAt > evaluationDate) {
    reasons.push(`measurement_window_not_complete:${measurementWindow.endedAt}`)
  }

  if (!isNonEmptyString(entry.sourceArtifactUrl)) {
    reasons.push('missing_source_artifact')
  } else if (!isHttpsUrl(entry.sourceArtifactUrl)) {
    reasons.push('source_artifact_not_https')
  }

  const permission = entry.publicationPermission
  if (!isRecord(permission) || permission.granted !== true) {
    reasons.push('publication_permission_not_granted')
  } else if (!isIsoDate(permission.grantedAt)) {
    reasons.push('publication_permission_invalid_date')
  } else if (permission.grantedAt > evaluationDate) {
    reasons.push(`publication_permission_not_effective:${permission.grantedAt}`)
  }

  const review = entry.review
  if (!isRecord(review) || review.status !== 'approved') {
    reasons.push('review_not_approved')
  } else {
    if (!isIsoDate(review.reviewedAt)) {
      reasons.push('review_invalid_date')
    } else if (review.reviewedAt > evaluationDate) {
      reasons.push(`review_not_effective:${review.reviewedAt}`)
    }
    if (!isIsoDate(review.expiresAt)) {
      reasons.push('review_invalid_expiry')
    } else if (review.expiresAt < evaluationDate) {
      reasons.push(`review_expired:${review.expiresAt}`)
    } else {
      validityDates.push(review.expiresAt)
    }
  }

  if (!isIsoDate(entry.publishedAt)) reasons.push('invalid_published_at')
  if (!isIsoDate(entry.modifiedAt)) reasons.push('invalid_modified_at')
  if (isIsoDate(entry.publishedAt) && entry.publishedAt > evaluationDate) {
    reasons.push(`publication_not_effective:${entry.publishedAt}`)
  }
  if (isIsoDate(entry.modifiedAt) && entry.modifiedAt > evaluationDate) {
    reasons.push(`modification_not_effective:${entry.modifiedAt}`)
  }
  if (
    isIsoDate(entry.publishedAt) &&
    isIsoDate(entry.modifiedAt) &&
    entry.publishedAt > entry.modifiedAt
  ) {
    reasons.push('publication_dates_out_of_order')
  }

  if (reasons.length) {
    return {
      omission: {
        type: typeof type === 'string' ? type : null,
        slug: typeof slug === 'string' ? slug : null,
        reasons,
      },
    }
  }

  const common = {
    slug,
    claimId: entry.claimId,
    evidenceIds: [...seenEvidenceIds].sort(),
    title: entry.title.trim(),
    description: entry.description.trim(),
    outcome: entry.outcome.trim(),
    outcomeLabel: entry.outcomeLabel.trim(),
    methodology: entry.methodology.trim(),
    measurementWindow: {
      startedAt: measurementWindow.startedAt,
      endedAt: measurementWindow.endedAt,
    },
    evidenceUrl: entry.sourceArtifactUrl,
    disclosure: entry.disclosure.trim(),
    publicationPermission: {
      granted: true,
      grantedAt: permission.grantedAt,
    },
    review: {
      status: 'approved',
      reviewedAt: review.reviewedAt,
      expiresAt: review.expiresAt,
    },
    validUntil: validityDates.sort()[0],
    publishedAt: entry.publishedAt,
    modifiedAt: entry.modifiedAt,
  }

  if (type === 'case') {
    return {
      caseStudy: {
        ...common,
        eyebrow: entry.eyebrow.trim(),
        situation: entry.situation.trim(),
        diagnosis: entry.diagnosis.trim(),
        fixes: entry.fixes.map((fix) => fix.trim()),
        result: entry.result.trim(),
      },
    }
  }

  return { benchmark: common }
}

const sortedEntries = surfaces.entries
  .map((entry, index) => ({ entry, index }))
  .sort((left, right) => {
    const leftKey = isRecord(left.entry)
      ? `${String(left.entry.type)}:${String(left.entry.slug)}`
      : `~:${left.index}`
    const rightKey = isRecord(right.entry)
      ? `${String(right.entry.type)}:${String(right.entry.slug)}`
      : `~:${right.index}`
    return compareText(leftKey, rightKey) || left.index - right.index
  })
const compiled = sortedEntries.map(({ entry, index }) => compileEntry(entry, index))
const output = {
  version: surfaces.version,
  asOf: surfaces.asOf,
  cases: compiled.flatMap((item) => item.caseStudy ? [item.caseStudy] : [])
    .sort((left, right) => compareText(left.slug, right.slug)),
  benchmarks: compiled.flatMap((item) => item.benchmark ? [item.benchmark] : [])
    .sort((left, right) => compareText(left.slug, right.slug)),
  omissions: compiled.flatMap((item) => item.omission ? [item.omission] : [])
    .sort((left, right) =>
      compareText(
        `${left.type ?? ''}:${left.slug ?? ''}`,
        `${right.type ?? ''}:${right.slug ?? ''}`,
      )),
}
const serialized = `${JSON.stringify(output, null, 2)}\n`

if (check) {
  let current = ''
  try {
    current = readFileSync(outputPath, 'utf8')
  } catch {
    // A missing generated projection is drift.
  }
  if (current !== serialized) {
    console.error('Public proof projection drift: data/public-proof.generated.json')
    process.exitCode = 1
  } else {
    console.log(
      `Public proof projection current: ${output.cases.length} cases, ${output.benchmarks.length} benchmarks, ${output.omissions.length} omitted`,
    )
  }
} else {
  writeFileSync(outputPath, serialized)
  console.log(
    `Compiled public proof: ${output.cases.length} cases, ${output.benchmarks.length} benchmarks, ${output.omissions.length} omitted`,
  )
}
