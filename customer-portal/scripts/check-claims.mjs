/**
 * CI claim linter — flags unsupported causal/commercial language in public copy.
 *
 * Supports an allowlist for phrases that are valid in context.
 * Exit 1 on violations (blocks merge). Run: node scripts/check-claims.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const BANNED_PHRASES = [
  { pattern: /guaranteed?\s+conversions?/gi, id: 'guaranteed-conversions' },
  { pattern: /guaranteed?\s+revenue/gi, id: 'guaranteed-revenue' },
  { pattern: /exactly\s+why/gi, id: 'exactly-why' },
  { pattern: /proves?\s+your\s+ad/gi, id: 'proves-your-ad' },
  { pattern: /your\s+ads?\s+(?:are|is)\s+working/gi, id: 'ads-are-working' },
  { pattern: /killing\s+(?:your\s+)?conversions?/gi, id: 'killing-conversions' },
  { pattern: /killing\s+your\s+ads?/gi, id: 'killing-ads' },
  { pattern: /(?:where|exactly where)\s+you(?:'re| are)\s+losing\s+money/gi, id: 'losing-money' },
  { pattern: /the\s+ad\s+is\s+not\s+the\s+problem/gi, id: 'ad-not-problem' },
  { pattern: /the\s+problem\s+was\s+never\s+the\s+ad/gi, id: 'problem-never-ad' },
  { pattern: /highest[- ]confidence/gi, id: 'highest-confidence' },
  { pattern: /determines?\s+whether/gi, id: 'determines-whether' },
  { pattern: /will\s+outperform/gi, id: 'will-outperform' },
  { pattern: /conversion\s+impact/gi, id: 'conversion-impact' },
  { pattern: /revenue\s+leak/gi, id: 'revenue-leak' },
  { pattern: /money\s+leak/gi, id: 'money-leak' },
  { pattern: /impact\s+score/gi, id: 'impact-score' },
  { pattern: /ranked\s+by\s+impact/gi, id: 'ranked-by-impact' },
  { pattern: /highest[- ]impact/gi, id: 'highest-impact' },
  { pattern: /leaking\s+(?:the\s+)?budget/gi, id: 'leaking-budget' },
  { pattern: /costing\s+you\s+conversions/gi, id: 'costing-conversions' },
  { pattern: /observable\s+impact/gi, id: 'observable-impact' },
  { pattern: /kills?\s+(?:the\s+)?conversions?/gi, id: 'kills-conversions' },
  { pattern: /lives?\s+entirely\s+on\s+the\s+landing/gi, id: 'entirely-on-page' },
]

const ALLOWLIST_PATH = resolve(root, 'config/claims-allowlist.json')
let allowlist = {}
if (existsSync(ALLOWLIST_PATH)) {
  allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'))
}

const EXCLUDE = /node_modules|\.next|__tests__|\.test\.|\.spec\.|scripts\/check-claims/
const SCAN_DIRS = ['app', 'components', 'content'].map(d => resolve(root, d))
const extensions = '\\( -name "*.tsx" -o -name "*.ts" -o -name "*.mdx" -o -name "*.md" \\)'

const files = SCAN_DIRS
  .filter(d => existsSync(d))
  .flatMap(d =>
    execSync(`find "${d}" -type f ${extensions} 2>/dev/null || true`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }).trim().split('\n')
  )
  .filter(f => f && !EXCLUDE.test(f))

let failures = []

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  const rel = file.replace(root + '/', '')

  for (const { pattern, id } of BANNED_PHRASES) {
    pattern.lastIndex = 0
    let m
    while ((m = pattern.exec(content)) !== null) {
      const line = content.slice(0, m.index).split('\n').length

      // Check allowlist (line 0 = any line in that file for this phrase)
      const allowed = allowlist[id]
      if (allowed && allowed.some(entry => entry.file === rel && (entry.line === 0 || entry.line === line))) {
        continue
      }

      failures.push({
        id,
        file: rel,
        line,
        match: m[0],
      })
    }
  }
}

if (failures.length > 0) {
  console.error(`\n❌ Claim lint FAILED (${failures.length} violations):\n`)
  for (const f of failures) {
    console.error(`  [${f.id}] ${f.file}:${f.line} — "${f.match}"`)
  }
  console.error(`\nTo allow a specific usage, add to config/claims-allowlist.json:`)
  console.error(`  { "${failures[0].id}": [{ "file": "${failures[0].file}", "line": ${failures[0].line}, "reason": "..." }] }\n`)
  process.exit(1)
} else {
  console.log('✓ Claim lint passed — no unsupported causal/commercial language detected')
}
