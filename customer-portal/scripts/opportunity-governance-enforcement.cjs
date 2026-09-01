const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const VALID_EVIDENCE = new Set(['verified', 'reviewed'])
const REQUIRED_DETERMINATIONS = [
  'c1_phenomenon', 'c2_pain', 'c3_addressability', 'c4_roi',
  'c5_demand', 'c6_economics', 'c7_strategic_coherence',
]

function validDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function tableRows(markdown, section) {
  const start = markdown.indexOf(`### ${section}`)
  const end = markdown.indexOf('\n### ', start + 5)
  const block = markdown.slice(start, end < 0 ? markdown.length : end)
  const lines = block.split('\n').filter((line) => line.trim().startsWith('|'))
  if (lines.length < 2) return []
  const headers = lines[0].split('|').slice(1, -1).map((v) => v.trim())
  return lines.slice(2).map((line) => {
    const cells = line.split('|').slice(1, -1).map((v) => v.trim())
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  })
}

function validateClaimRegister(markdown, asOf) {
  const failures = []
  if (!validDate(asOf)) failures.push(`evaluation date invalid: ${asOf}`)
  const activeSection = markdown.split('## Excluded Claims')[0]
  const rows = [...tableRows(markdown, 'Product Claims'), ...tableRows(markdown, 'Service Claims')]
  if (rows.length === 0 && /### (Product|Service) Claims[\s\S]*\|/.test(activeSection)) {
    failures.push('CLAIM_REGISTER.md: active claim discovery returned zero rows; remediation: repair parser or register format')
  }
  for (const claim of rows) {
    const id = claim['Claim ID'] || '<missing-id>'
    const claimClass = claim.Class
    if (!id || id === '<missing-id>') failures.push(`claim ID missing: ${id}`)
    if (!claimClass) failures.push(`${id}: claim class missing`)
    const governed = ['commercial', 'empirical'].includes(claimClass)
    if (!governed) continue
    for (const field of ['Expiry', 'Review Due', 'Evidence State', 'Dependency']) {
      if (!claim[field] || claim[field] === '-') failures.push(`${id}: required ${field} metadata missing; remediation: add governed metadata`)
    }
    for (const field of ['Expiry', 'Review Due']) {
      if (claim[field] && claim[field] !== '-' && !validDate(claim[field])) failures.push(`${id}: ${field} invalid (${claim[field]}); remediation: use YYYY-MM-DD`)
      else if (claim[field] && claim[field] !== '-' && claim[field] < asOf) failures.push(`${id}: ${field} overdue (${claim[field]}); remediation: revalidate or remove claim`)
    }
    if (claim['Evidence State'] && !VALID_EVIDENCE.has(claim['Evidence State'])) failures.push(`${id}: evidence state regression (${claim['Evidence State']}); remediation: downgrade/remove active claim or restore supporting evidence`)
    if (claim.Dependency && claim.Dependency !== '-' && !/^[a-z0-9_-]+:[A-Za-z0-9._-]+$/.test(claim.Dependency)) failures.push(`${id}: methodology/version dependency invalid (${claim.Dependency}); remediation: record a valid dependency`)
    if (claim.Observatory && !['none', 'pending', 'published', 'adverse_disclosed'].includes(claim.Observatory)) failures.push(`${id}: Observatory status invalid (${claim.Observatory}); remediation: use a governed status`)
    if (claim.Observatory === 'published' && claim['Evidence State'] !== 'verified') failures.push(`${id}: published Observatory claim lacks verified evidence; remediation: remove publication or restore evidence`)
  }
  return failures
}

function validateObservatoryReferences(references, evidenceEntries, claimEntries = []) {
  const failures = []
  const evidence = new Map((evidenceEntries ?? []).map((entry) => [entry.evidence_id, entry]))
  const claims = new Map((claimEntries ?? []).map((entry) => [entry.claim_id, entry]))
  for (const reference of references ?? []) {
    const surface = reference.surface ?? '<unknown-surface>'
    const id = reference.evidence_id
    const entry = evidence.get(id)
    if (!entry) { failures.push(`${surface}: evidence ID ${id} does not resolve; remediation: remove reference or add the evidence entry`); continue }
    if (entry.observatory_status !== 'publishing_authorized') failures.push(`${surface}: evidence ID ${id} has status ${entry.observatory_status ?? '<missing>'}; violated invariant: Observatory references require publishing_authorized`)
    if (!VALID_EVIDENCE.has(entry.verification_status)) failures.push(`${surface}: evidence ID ${id} has invalid evidence state ${entry.verification_status}; violated invariant: observatory_status cannot bypass proof integrity`)
    if (reference.claim_id) {
      const claim = claims.get(reference.claim_id)
      if (!claim) failures.push(`${surface}: claim ID ${reference.claim_id} does not resolve; violated invariant: claim reference must resolve`)
      else if (!['verified', 'verified_narrowed'].includes(claim.status)) failures.push(`${surface}: claim ID ${reference.claim_id} has state ${claim.status}; violated invariant: unsupported claim cannot be published`)
    }
  }
  return failures
}

function extractOfferKeys(source) {
  return [...source.matchAll(/offerKey\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

function extractOfferDefinitions(source) {
  const definitions = new Map()
  for (const match of source.matchAll(/offerKey\s*:\s*['"]([^'"]+)['"]/g)) {
    const context = source.slice(Math.max(0, match.index - 350), match.index + 350)
    definitions.set(match[1], context.replace(/\s+/g, ' '))
  }
  return definitions
}

function validateObservatorySourceBinding({ pageSource, datasetsSource, repoRoot }) {
  const failures = []
  if (!pageSource.includes("from '@/app/lib/datasets'") || !pageSource.includes('OBSERVATORY_SOURCES')) failures.push('app/observatory/page.tsx: real Observatory source binding is missing')
  if (!pageSource.includes('OBSERVATORY_SOURCES.map')) failures.push('app/observatory/page.tsx: governed sources are not emitted into the Observatory artifact')
  const sourceMatches = [...datasetsSource.matchAll(/\{ id: '([^']+)', contentClass: '([^']+)', sourcePath: '([^']+)', observatory_status: '([^']+)'(?:, datasetIds: \[([^\]]+)\])? \}/g)]
  if (sourceMatches.length === 0) { failures.push('datasets.ts: governed Observatory source set is empty or unparseable; remediation: declare canonical sources'); return failures }
  const datasetIds = new Set([...datasetsSource.matchAll(/id: '([^']+)'/g)].map((match) => match[1]))
  for (const [, id, , sourcePath, status, linked] of sourceMatches) {
    if (status !== 'publishing_authorized') failures.push(`Observatory source ${id}: status ${status} is not publishing_authorized`)
    if (!repoRoot || !require('node:fs').existsSync(require('node:path').resolve(repoRoot, sourcePath))) failures.push(`Observatory source ${id}: source path ${sourcePath} does not resolve`)
    for (const linkedId of (linked ?? '').matchAll(/'([^']+)'/g)) if (!datasetIds.has(linkedId[1])) failures.push(`Observatory source ${id}: dataset ${linkedId[1]} does not resolve`)
  }
  return failures
}

function extractObservatoryReferences(source) {
  return [...source.matchAll(/(?:evidence_id|evidenceId)\s*[:=]\s*['"]([^'"]+)['"]/g)].map((match) => ({ surface: 'app/observatory/page.tsx', evidence_id: match[1] }))
}

function parseGateBlock(text) {
  const record = { determinations: {} }
  let nested = false
  for (const line of text.split('\n')) {
    const match = /^(\s*)([A-Za-z0-9_]+):\s*(.*?)\s*$/.exec(line)
    if (!match) continue
    const [, indent, key, raw] = match
    if (key === 'determinations') { nested = true; continue }
    const value = raw.replace(/^['"]|['"]$/g, '')
    if (nested && indent.length > 0) record.determinations[key] = value
    else { nested = false; record[key] = value === 'null' ? null : value }
  }
  return record
}

function extractGateRecords(markdown) {
  const section = markdown.split('## Gate Decisions')[1] ?? ''
  return [...section.matchAll(/```yaml\s*([\s\S]*?)```/g)].map((match) => parseGateBlock(match[1]))
}

function validateCommercialOffers({ source, baselineSource, gateMarkdown }) {
  const failures = []
  const current = new Set(extractOfferKeys(source))
  if (current.size === 0) failures.push('public-facts.ts: commercial offer discovery returned zero keys; remediation: repair parser or canonical offer structure')
  const baseline = new Set(extractOfferKeys(baselineSource))
  const newKeys = [...current].filter((key) => !baseline.has(key))
  const currentDefinitions = extractOfferDefinitions(source)
  const baselineDefinitions = extractOfferDefinitions(baselineSource)
  const changedKeys = [...current].filter((key) => baseline.has(key) && currentDefinitions.get(key) !== baselineDefinitions.get(key))
  const governedKeys = [...new Set([...newKeys, ...changedKeys])]
  const grandfathered = new Set(['fix-pack'])
  const records = extractGateRecords(gateMarkdown)
  for (const key of governedKeys) {
    const isMaterialChange = changedKeys.includes(key)
    if (!isMaterialChange && grandfathered.has(key)) continue
    const marker = new RegExp(`opportunity_id\\s*[:=]\\s*['\"]?([A-Z]+-[0-9]{6}-[0-9]{3})['\"]?[^\\n]*[\\s\\S]{0,500}?offer[_ -]?key\\s*[:=]\\s*['\"]?${key}['\"]?`, 'i').test(source)
    if (!marker) failures.push(`offer ${key}: missing gate-record opportunity_id reference; remediation: add a prior authorized PASS reference`)
    const record = records.find((candidate) => candidate?.offer_key === key || candidate?.label === key || candidate?.opportunity_id === key)
    if (!record) { failures.push(`offer ${key}: gate record missing or does not correspond to offer; remediation: add a valid gate record`); continue }
    if (record.gate_outcome !== 'PASS' || record.adr_ref == null || record.adr_ref === 'null') failures.push(`offer ${key}: gate is not authorized PASS; remediation: require PASS and committed adr_ref`)
    for (const determination of REQUIRED_DETERMINATIONS) if (record.determinations?.[determination] !== 'PASS') failures.push(`offer ${key}: ${determination} is ${record.determinations?.[determination] ?? '<missing>'}; remediation: all C1-C7 must be PASS`)
  }
  return failures
}

module.exports = { validateClaimRegister, validateObservatoryReferences, validateCommercialOffers, validateObservatorySourceBinding, extractObservatoryReferences }
