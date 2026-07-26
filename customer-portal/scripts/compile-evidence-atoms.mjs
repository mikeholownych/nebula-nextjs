#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(new URL('..', import.meta.url).pathname)
const argv = process.argv.slice(2)
const args = new Set(argv)
const check = args.has('--check')

function option(name, fallback) {
  const index = argv.indexOf(name)
  return index >= 0 ? resolve(argv[index + 1]) : resolve(root, fallback)
}

const claimsPath = option('--claims', '.citable/claims.yaml')
const evidencePath = option('--evidence', '.citable/evidence.yaml')
const surfacesPath = option('--surfaces', 'data/evidence-surfaces.json')
const outputPath = option('--output', 'data/evidence-atoms.generated.json')
const read = (file) => readFileSync(file, 'utf8')
const claims = parse(read(claimsPath))
const evidence = parse(read(evidencePath))
const surfaces = JSON.parse(read(surfacesPath))

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

function assertExactKeys(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const unknown = Object.keys(value).filter((key) => !allowed.has(key))
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(', ')}`)
}

function validateSurfaceRegistry(registry) {
  assertExactKeys(registry, new Set(['version', 'asOf', 'entries']), 'Evidence surface registry')
  if (registry.version !== 1) throw new Error(`Unsupported evidence surface version: ${registry.version}`)
  if (!Array.isArray(registry.entries)) throw new Error('Evidence surface entries must be an array')
  if (!isIsoDate(registry.asOf)) throw new Error(`Invalid evidence surface asOf date: ${registry.asOf}`)

  const allowed = new Set(['claimId', 'route', 'slot', 'projectionType', 'failClosedAction'])
  for (const [index, surface] of registry.entries.entries()) {
    const label = `Evidence surface entry ${index}`
    assertExactKeys(surface, allowed, label)
    if (typeof surface.claimId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(surface.claimId)) {
      throw new Error(`${label} has an invalid claimId`)
    }
    if (typeof surface.route !== 'string' || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(surface.route)) {
      throw new Error(`${label} has an invalid route`)
    }
    if (typeof surface.slot !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(surface.slot)) {
      throw new Error(`${label} has an invalid slot`)
    }
    if (surface.projectionType !== 'visible_text') throw new Error(`${label} has an unsupported projectionType`)
    if (surface.failClosedAction !== 'omit') throw new Error(`${label} has an unsupported failClosedAction`)
  }
}

validateSurfaceRegistry(surfaces)

function indexUnique(entries, idField, label) {
  if (!Array.isArray(entries)) throw new Error(`${label} entries must be an array`)
  const index = new Map()
  for (const entry of entries) {
    const id = entry?.[idField]
    if (typeof id !== 'string' || !id) throw new Error(`${label} entry has an invalid ID`)
    if (index.has(id)) throw new Error(`Duplicate ${label.toLowerCase()} ID: ${id}`)
    index.set(id, entry)
  }
  return index
}

const claimById = indexUnique(claims.entries, 'claim_id', 'Claim')
const evidenceById = indexUnique(evidence.entries, 'evidence_id', 'Evidence')
const publishableClaimStatuses = new Set(['verified', 'verified_narrowed'])
const publishableSupportStatuses = new Set(['directly_supported', 'partially_supported'])
const publishableEvidenceStatuses = new Set(['verified', 'reviewed'])

function dateDisposition(record, field) {
  if (!Object.prototype.hasOwnProperty.call(record, field)) return 'current'
  const date = record[field]
  if (!isIsoDate(date)) return 'invalid'
  return date >= surfaces.asOf ? 'current' : 'expired'
}

function compileSurface(surface) {
  const claim = claimById.get(surface.claimId)
  if (!claim) return { omission: { ...surface, reasons: ['missing_claim'] } }

  const reasons = []
  if (!publishableClaimStatuses.has(claim.status)) reasons.push(`claim_status:${claim.status}`)
  if (!publishableSupportStatuses.has(claim.support_assessment?.status)) {
    reasons.push(`support_status:${claim.support_assessment?.status ?? 'missing'}`)
  }
  const claimDate = dateDisposition(claim, 'expires')
  if (claimDate === 'invalid') reasons.push(`claim_invalid_date:${claim.expires}`)
  if (claimDate === 'expired') reasons.push(`claim_expired:${claim.expires}`)

  const evidenceIds = claim.evidence ?? []
  if (!evidenceIds.length) reasons.push('missing_evidence')
  for (const evidenceId of evidenceIds) {
    const record = evidenceById.get(evidenceId)
    if (!record) {
      reasons.push(`missing_evidence:${evidenceId}`)
      continue
    }
    if (!publishableEvidenceStatuses.has(record.verification_status)) {
      reasons.push(`evidence_status:${evidenceId}:${record.verification_status}`)
    }
    const evidenceDate = dateDisposition(record, 'valid_until')
    if (evidenceDate === 'invalid') reasons.push(`evidence_invalid_date:${evidenceId}:${record.valid_until}`)
    if (evidenceDate === 'expired') reasons.push(`evidence_expired:${evidenceId}:${record.valid_until}`)
  }

  if (reasons.length) return { omission: { ...surface, reasons } }
  return {
    atom: {
      claimId: claim.claim_id,
      text: claim.claim.trim().replace(/\s+/g, ' '),
      route: surface.route,
      slot: surface.slot,
      projectionType: surface.projectionType,
      evidenceIds,
      supportStatus: claim.support_assessment.status,
    },
  }
}

const seenSurfaces = new Set()
for (const surface of surfaces.entries ?? []) {
  const key = `${surface.route}#${surface.slot}`
  if (seenSurfaces.has(key)) throw new Error(`Duplicate evidence surface: ${key}`)
  seenSurfaces.add(key)
}

const compiled = (surfaces.entries ?? []).map(compileSurface)
const output = {
  version: surfaces.version,
  asOf: surfaces.asOf,
  entries: compiled.flatMap((item) => item.atom ? [item.atom] : []),
  omissions: compiled.flatMap((item) => item.omission ? [item.omission] : []),
}
const serialized = `${JSON.stringify(output, null, 2)}\n`
if (check) {
  let current = ''
  try { current = readFileSync(outputPath, 'utf8') } catch { /* missing generated file */ }
  if (current !== serialized) {
    console.error('Evidence atom projection drift: data/evidence-atoms.generated.json')
    process.exitCode = 1
  } else {
    console.log(`Evidence atom projection current: ${output.entries.length} published, ${output.omissions.length} omitted`)
  }
} else {
  writeFileSync(outputPath, serialized)
  console.log(`Compiled evidence atoms: ${output.entries.length} published, ${output.omissions.length} omitted`)
}
