/** @jest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  validateClaimRegister,
  validateCommercialOffers,
  validateObservatoryReferences,
  validateObservatorySourceBinding,
} from '../scripts/opportunity-governance-enforcement.cjs'

const asOf = '2026-09-01'
const claimTable = (row: string) => `### Product Claims\n\n| Claim ID | Claim | Class | Evidence | Source | Date | Approval | Expiry | Review Due | Evidence State | Dependency | Used In | Observatory |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${row}\n`
const validRow = '| claim-empirical | "Measured claim" | empirical | evidence-1 | internal | 2026-08-01 | Mike | 2026-12-31 | 2026-12-01 | verified | method:v1 | / | none |'

test('I1 accepts valid governed claims and exempts descriptive claims', () => {
  expect(validateClaimRegister(
    `${claimTable(validRow)}\n${claimTable('| claim-description | "A capability" | descriptive | docs | internal | 2026-08-01 | Mike | - | - | verified | docs:v1 | / | none |')}`,
    asOf,
  )).toEqual([])
})

test('I1 rejects an active register when discovery returns zero rows', () => {
  expect(validateClaimRegister('### Product Claims\\n\\n| Claim | Evidence |\\n|---|---|\\n', asOf).join('\\n')).toContain('discovery returned zero rows')
})

test.each([
  ['expired claim', validRow.replace('2026-12-31', '2026-08-31'), 'Expiry overdue'],
  ['review overdue', validRow.replace('2026-12-01', '2026-08-31'), 'Review Due overdue'],
  ['malformed expiry', validRow.replace('2026-12-31', '2026-02-31'), 'Expiry invalid'],
  ['missing expiry', validRow.replace('2026-12-31', '-'), 'required Expiry metadata missing'],
  ['missing review', validRow.replace('2026-12-01', '-'), 'required Review Due metadata missing'],
  ['invalid dependency', validRow.replace('method:v1', 'method'), 'methodology/version dependency invalid'],
  ['evidence regression', validRow.replace('verified', 'stale'), 'evidence state regression'],
])('I1 rejects %s with a specific remediation diagnostic', (_label, row, diagnostic) => {
  expect(validateClaimRegister(claimTable(row), asOf).join('\n')).toContain(diagnostic)
})

test('I1 rejects a published claim that is no longer supported', () => {
  const row = validRow.replace('none', 'published').replace('verified', 'reviewed')
  expect(validateClaimRegister(claimTable(row), asOf).join('\n')).toContain('published Observatory claim lacks verified evidence')
})

const evidence = (status = 'publishing_authorized', verification_status = 'verified') => status === null ? [] : [{ evidence_id: 'evidence-1', ...(status === undefined ? {} : { observatory_status: status }), verification_status }]

test('I2 accepts an authorized, valid Observatory evidence reference', () => {
  expect(validateObservatoryReferences([{ surface: 'app/observatory/page.tsx', evidence_id: 'evidence-1' }], evidence())).toEqual([])
})

test.each([
  ['not authorized', evidence('not_applicable'), 'status not_applicable'],
  ['missing status', [{ evidence_id: 'evidence-1', verification_status: 'verified' }], 'status <missing>'],
  ['unknown status', evidence('future_state'), 'status future_state'],
  ['unknown evidence ID', [], 'does not resolve'],
  ['invalid evidence state', evidence('publishing_authorized', 'stale'), 'invalid evidence state stale'],
])('I2 rejects %s fail closed', (_label, entries, diagnostic) => {
  expect(validateObservatoryReferences([{ surface: 'observatory', evidence_id: 'evidence-1' }], entries).join('\n')).toContain(diagnostic)
})

test('I2 does not authorize unrelated Citable capabilities', () => {
  expect(validateObservatoryReferences([{ surface: 'observatory', evidence_id: 'evidence-1' }], [{ evidence_id: 'evidence-1', observatory_status: 'publishing_authorized', verification_status: 'verified', signal_source: 'citable' }])).toEqual([])
  expect(validateObservatoryReferences([{ surface: 'observatory', evidence_id: 'evidence-2' }], [{ evidence_id: 'evidence-2', observatory_status: 'not_applicable', verification_status: 'verified', signal_source: 'citable' }])).not.toEqual([])
})

const gate = (overrides = '') => `## Gate Decisions\n\n\`\`\`yaml\nopportunity_id: OPP-202609-001\noffer_key: new-offer\ngate_outcome: PASS\nadr_ref: docs/adr/adr-new.md\ndeterminations:\n  c1_phenomenon: PASS\n  c2_pain: PASS\n  c3_addressability: PASS\n  c4_roi: PASS\n  c5_demand: PASS\n  c6_economics: PASS\n  c7_strategic_coherence: PASS\n${overrides}\`\`\`\n`
const newSource = `const offer = { // opportunity_id: OPP-202609-001\n  checkout: { offerKey: 'new-offer' },\n}`

test('I3 accepts grandfathered and authorized new offers', () => {
  const baseline = "checkout: { offerKey: 'fix-pack' }"
  expect(validateCommercialOffers({ source: baseline, baselineSource: baseline, gateMarkdown: '' })).toEqual([])
  expect(validateCommercialOffers({ source: newSource, baselineSource: baseline, gateMarkdown: gate() })).toEqual([])
})

test.each([
  ['without gate reference', newSource.replace(' // opportunity_id: OPP-202609-001', ''), gate(), 'missing gate-record opportunity_id reference'],
  ['missing gate', newSource, '', 'gate record missing'],
  ['wrong offer', newSource, gate().replace('offer_key: new-offer', 'offer_key: other-offer'), 'gate record missing'],
  ['C4 indeterminate', newSource, gate('  c4_roi: INDETERMINATE\n'), 'c4_roi is INDETERMINATE'],
  ['C5 fail', newSource, gate('  c5_demand: FAIL\n'), 'c5_demand is FAIL'],
  ['C6 indeterminate', newSource, gate('  c6_economics: INDETERMINATE\n'), 'c6_economics is INDETERMINATE'],
  ['unauthorized state', newSource, gate('gate_outcome: INSUFFICIENT_EVIDENCE\n'), 'gate is not authorized PASS'],
  ['malformed record', newSource, '## Gate Decisions\n```yaml\n: bad: yaml\n```', 'gate record missing'],
])('I3 rejects %s', (_label, source, gates, diagnostic) => {
  expect(validateCommercialOffers({ source, baselineSource: "checkout: { offerKey: 'fix-pack' }", gateMarkdown: gates }).join('\n')).toContain(diagnostic)
})

test('I3 treats material term changes under a grandfathered key as a governed change', () => {
  const baseline = "const offer = { priceCents: 9700, checkout: { offerKey: 'fix-pack' } }"
  const changed = "const offer = { priceCents: 14700, checkout: { offerKey: 'fix-pack' } }"
  expect(validateCommercialOffers({ source: changed, baselineSource: baseline, gateMarkdown: '' }).join('\\n')).toContain('offer fix-pack: gate record missing')
})

test('I2 production path binds the real Observatory to canonical sources', () => {
  const pageSource = readFileSync(path.join(process.cwd(), 'app/observatory/page.tsx'), 'utf8')
  const datasetsSource = readFileSync(path.join(process.cwd(), 'app/lib/datasets.ts'), 'utf8')
  expect(validateObservatorySourceBinding({ pageSource, datasetsSource, repoRoot: path.resolve(process.cwd(), '..') })).toEqual([])
})

test('I2 rejects vacuous or omitted governed source discovery', () => {
  const datasetsSource = readFileSync(path.join(process.cwd(), 'app/lib/datasets.ts'), 'utf8')
  expect(validateObservatorySourceBinding({ pageSource: 'export default function Observatory() {}', datasetsSource, repoRoot: path.resolve(process.cwd(), '..') }).join('\\n')).toContain('binding is missing')
  expect(validateObservatorySourceBinding({ pageSource: "import { OBSERVATORY_SOURCES } from '@/app/lib/datasets'; OBSERVATORY_SOURCES.map", datasetsSource: 'export const OBSERVATORY_SOURCES = []', repoRoot: path.resolve(process.cwd(), '..') }).join('\\n')).toContain('source set is empty')
})

test('I2 rejects an omitted canonical source path', () => {
  const pageSource = "import { OBSERVATORY_SOURCES } from '@/app/lib/datasets'; OBSERVATORY_SOURCES.map"
  const datasetsSource = "{ id: 'broken', contentClass: 'operational-ledger', sourcePath: 'missing/file.json', observatory_status: 'publishing_authorized' }"
  expect(validateObservatorySourceBinding({ pageSource, datasetsSource, repoRoot: path.resolve(process.cwd(), '..') }).join('\\n')).toContain('does not resolve')
})

test('cross-control gates remain independent', () => {
  expect(validateClaimRegister(claimTable(validRow.replace('2026-12-31', '2026-08-31')), asOf).length).toBeGreaterThan(0)
  expect(validateObservatoryReferences([{ surface: 'observatory', evidence_id: 'evidence-1' }], evidence('publishing_authorized', 'stale')).length).toBeGreaterThan(0)
  expect(validateCommercialOffers({ source: newSource, baselineSource: "checkout: { offerKey: 'fix-pack' }", gateMarkdown: gate() })).toEqual([])
  expect(validateCommercialOffers({ source: newSource, baselineSource: "checkout: { offerKey: 'fix-pack' }", gateMarkdown: gate('  c5_demand: INDETERMINATE\n') }).length).toBeGreaterThan(0)
})

test('repository path is wired into the authoritative checker', () => {
  const packageManifest = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
  expect(packageManifest.scripts['check:opportunity-governance']).toBe('node scripts/check-opportunity-governance.mjs')
  expect(packageManifest.scripts.ci).toContain('npm run check:opportunity-governance')
})
