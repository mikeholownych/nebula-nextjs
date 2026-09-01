#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { resolve } from 'node:path'
import enforcement from './opportunity-governance-enforcement.cjs'
const {
  validateClaimRegister,
  validateCommercialOffers,
  validateObservatoryReferences,
  validateObservatorySourceBinding,
} = enforcement

const root = resolve(new URL('..', import.meta.url).pathname)
const claimPath = resolve(root, 'docs/governance/CLAIM_REGISTER.md')
const evidencePath = resolve(root, '.citable/evidence.yaml')
const factsPath = resolve(root, 'app/lib/public-facts.ts')
const gatesPath = resolve(root, '../docs/governance/commercialization-gates.md')
const asOf = process.env.GOVERNANCE_AS_OF ?? new Date().toISOString().slice(0, 10)
const factsSource = readFileSync(factsPath, 'utf8')
let baselineSource = factsSource
if (!process.env.GOVERNANCE_BASELINE_FACTS) {
  try { baselineSource = execFileSync('git', ['show', 'HEAD^:customer-portal/app/lib/public-facts.ts'], { cwd: resolve(root, '..'), encoding: 'utf8' }) } catch { /* initial commit fallback */ }
} else baselineSource = readFileSync(process.env.GOVERNANCE_BASELINE_FACTS, 'utf8')
const observatorySource = readFileSync(resolve(root, 'app/observatory/page.tsx'), 'utf8')
const datasetsSource = readFileSync(resolve(root, 'app/lib/datasets.ts'), 'utf8')

const failures = [
  ...validateClaimRegister(readFileSync(claimPath, 'utf8'), asOf),
  ...validateObservatorySourceBinding({ pageSource: observatorySource, datasetsSource, repoRoot: resolve(root, '..') }),
  ...validateObservatoryReferences(enforcement.extractObservatoryReferences(observatorySource), parse(readFileSync(evidencePath, 'utf8')).entries ?? []),
  ...validateCommercialOffers({
    source: factsSource,
    baselineSource,
    gateMarkdown: readFileSync(gatesPath, 'utf8'),
  }),
]

if (failures.length) {
  console.error(`Opportunity governance enforcement FAILED (${failures.length} violation${failures.length === 1 ? '' : 's'})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`Opportunity governance enforcement passed (I1/I2/I3, as of ${asOf})`)
