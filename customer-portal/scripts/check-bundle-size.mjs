#!/usr/bin/env node
/**
 * scripts/check-bundle-size.mjs
 *
 * CI guard: fails if any JS chunk exceeds the defined threshold.
 * Prevents accidental bundle bloat from large dependency additions.
 *
 * Thresholds are deliberately generous — we want to catch large regressions,
 * not micro-optimize every commit.
 *
 * Usage: node scripts/check-bundle-size.mjs
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CHUNKS_DIR = '.next/static/chunks'
const THRESHOLDS = {
  // Single chunk limit: alert if any one chunk exceeds this
  single_chunk_kb: 300,
  // Total JS limit: alert if all chunks together exceed this
  total_js_kb: 1800,
}

const files = readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.js'))
let totalBytes = 0
const violations = []

for (const file of files) {
  const bytes = statSync(join(CHUNKS_DIR, file)).size
  totalBytes += bytes
  const kb = bytes / 1024
  if (kb > THRESHOLDS.single_chunk_kb) {
    violations.push({ file, kb: kb.toFixed(1) })
  }
}

const totalKb = totalBytes / 1024
console.log(`Bundle summary: ${files.length} chunks, ${totalKb.toFixed(0)}KB total`)

let failed = false

if (violations.length > 0) {
  console.error(`\n⚠ Oversized chunks (>${THRESHOLDS.single_chunk_kb}KB):`)
  violations.forEach(v => console.error(`  ${v.file}: ${v.kb}KB`))
  failed = true
}

if (totalKb > THRESHOLDS.total_js_kb) {
  console.error(`\n⚠ Total JS ${totalKb.toFixed(0)}KB exceeds ${THRESHOLDS.total_js_kb}KB budget`)
  failed = true
}

if (failed) {
  console.error('\nBundle size check FAILED. Review recent dependency additions.')
  process.exit(1)
} else {
  console.log('✓ Bundle size check passed')
}
