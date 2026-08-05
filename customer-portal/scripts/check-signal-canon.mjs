/**
 * CI gate: validates that no rendered content drifts from signals.canon.json.
 * Checks: C1 (signal count), C2 (retired names), C3 (canon membership).
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const canon = JSON.parse(readFileSync(resolve(root, 'config/signals.canon.json'), 'utf8'))

const EXCLUDE = /node_modules|\.next|__tests__|\.test\./

let failures = []

import { execSync } from 'child_process'
const files = execSync(
  `find "${root}/app" "${root}/content" -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.mdx" -o -name "*.md" \\) 2>/dev/null || true`,
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
).trim().split('\n').filter(f => f && !EXCLUDE.test(f))

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  const rel = file.replace(root + '/', '')

  // C1: signal count — "N-signal audit/framework/check" patterns that claim a total count
  const countRe = /(\d+)[- ](conversion )?signal[s]?\s*(audit|framework|check)/gi
  let m
  while ((m = countRe.exec(content)) !== null) {
    const n = parseInt(m[1], 10)
    if (n !== 9) {
      const line = content.slice(0, m.index).split('\n').length
      failures.push(`C1 [signal-count] ${rel}:${line} — found "${m[0]}" (expected 9)`)
    }
  }
  // Also catch "N Conversion Signals" as a heading/label (capitalized)
  const headingRe = /(\d+)\s+Conversion\s+Signals?/g
  while ((m = headingRe.exec(content)) !== null) {
    const n = parseInt(m[1], 10)
    if (n !== 9) {
      const line = content.slice(0, m.index).split('\n').length
      failures.push(`C1 [signal-count] ${rel}:${line} — found "${m[0]}" (expected 9)`)
    }
  }

  // C2: retired names used AS a named signal (enumerated "Signal N: <retired>")
  // "proof" and "social proof" are legitimate generic CRO prose — only flag them
  // when used in an explicit signal enumeration (handled by C3).
  // Only unambiguous framework-specific retired names are checked in proximity.
  const unambiguousRetired = canon.retired.filter(r => !r.includes('proof'))
  for (const retired of unambiguousRetired) {
    const re = new RegExp(`Signal\\s+\\d+\\s*[-:]\\s*${retired.replace(/\s+/g, '\\s+')}`, 'gi')
    let rm
    while ((rm = re.exec(content)) !== null) {
      const line = content.slice(0, rm.index).split('\n').length
      failures.push(`C2 [retired-name] ${rel}:${line} — "${retired}" used as a named signal`)
    }
  }

  // C3: "Signal N" enumeration with non-canon name
  const enumRe = /Signal\s+(\d+)\s*[-:]\s*([A-Za-z][A-Za-z\s-]+)/g
  while ((m = enumRe.exec(content)) !== null) {
    const name = m[2].trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ')
    const canonNormalized = canon.signals.map(s => s.toLowerCase().replace(/-/g, ' '))
    if (!canonNormalized.some(s => name.startsWith(s))) {
      const line = content.slice(0, m.index).split('\n').length
      failures.push(`C3 [non-canon-signal] ${rel}:${line} — "Signal ${m[1]}: ${m[2].trim()}" not in canon`)
    }
  }
}

// C5: corruption chars (U+2580–U+259F block elements, U+FFFD replacement char)
// ResultsClient uses ░ (U+2591) deliberately as a SERP visual — allowed there.
const C5_ALLOW = /ResultsClient\.tsx$/
for (const file of files) {
  if (C5_ALLOW.test(file)) continue
  const content = readFileSync(file, 'utf8')
  const rel = file.replace(root + '/', '')
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i)
    if ((code >= 0x2580 && code <= 0x259F) || code === 0xFFFD) {
      const line = content.slice(0, i).split('\n').length
      failures.push(`C5 [corruption] ${rel}:${line} — U+${code.toString(16).toUpperCase().padStart(4, '0')}`)
      break
    }
  }
}

if (failures.length > 0) {
  console.error(`\n❌ Signal canon check FAILED (${failures.length} violations):\n`)
  failures.forEach(f => console.error(`  ${f}`))
  console.error('')
  process.exit(1)
} else {
  console.log('✓ Signal canon check passed — all content consistent with config/signals.canon.json')
}
