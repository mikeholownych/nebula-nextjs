// Exports the canonical TEARDOWNS map to JSON for the DB seeder.
import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const tsx = createRequire(import.meta.url)('tsx/cjs/api')
const require_ts = tsx.require
const mod = require_ts('../app/teardowns/[slug]/data.ts', import.meta.url)
const TEARDOWNS = mod.TEARDOWNS ?? mod.default?.TEARDOWNS

const out = {}
for (const [slug, t] of Object.entries(TEARDOWNS)) {
  out[slug] = { ...t }
}
mkdirSync('/tmp/opencode', { recursive: true })
writeFileSync('/tmp/opencode/teardown_seed.json', JSON.stringify(out, null, 2))
console.log(`exported ${Object.keys(out).length} teardowns`)
