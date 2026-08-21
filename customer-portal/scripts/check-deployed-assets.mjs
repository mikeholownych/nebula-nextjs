#!/usr/bin/env node
/**
 * D1/D3 deployed-asset integrity check.
 *
 * Catches the stale-build/deploy-drift class of production incidents that
 * unit tests cannot see:
 *  - D1: HTML referencing JS/CSS chunks that return non-200 or wrong
 *    content-type at the edge (dead checkout button, unstyled pages).
 *  - D5/D3: a running Next process serving an older build than the one on
 *    disk / advertised by build-info (ChunkLoadError 500s).
 *
 * Usage: node scripts/check-deployed-assets.mjs [--base-url https://...]
 * Exits 1 on any failure. Designed for CI smoke + post-deploy verification.
 */
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    'base-url': { type: 'string', default: 'https://nebulacomponents.com' },
  },
})

const BASE = values['base-url'].replace(/\/$/, '')
const PAGES = ['/', '/audit', '/pricing', '/checkout', '/primer', '/7-systems']

let failures = 0
const fail = (msg) => {
  failures += 1
  console.error(`FAIL: ${msg}`)
}
const pass = (msg) => console.log(`PASS: ${msg}`)

async function fetchWithTimeout(url, init = {}) {
  return fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(15_000) })
}

function extractAssets(html, pagePath) {
  const assets = new Set()
  const patterns = [
    /<script[^>]+src="(\/_next\/static\/[^"]+)"/g,
    /<link[^>]+href="(\/_next\/static\/[^"]+\.css)"/g,
  ]
  for (const re of patterns) {
    for (const match of html.matchAll(re)) assets.add(match[1])
  }
  return [...assets].map((a) => ({ asset: a, url: `${BASE}${a}`, pagePath }))
}

// ── 1. Key pages respond 200 at the edge ─────────────────────────────────────
const htmlByPage = new Map()
for (const page of PAGES) {
  try {
    const res = await fetchWithTimeout(`${BASE}${page}`)
    if (res.status !== 200) {
      fail(`${page} returned HTTP ${res.status} (expected 200)`)
      continue
    }
    pass(`${page} -> 200`)
    htmlByPage.set(page, await res.text())
  } catch (err) {
    fail(`${page} unreachable: ${err.message}`)
  }
}
if (htmlByPage.size === 0) {
  fail('no key page returned 200 - aborting asset checks')
  process.exit(1)
}

// ── 2. Every referenced _next static chunk resolves with the right type ──────
const seen = new Map() // asset -> page first referenced it
for (const [page, html] of htmlByPage) {
  for (const { asset, url } of extractAssets(html, page)) {
    if (seen.has(asset)) continue
    seen.set(asset, page)
  }
}

let checked = 0
for (const [asset, page] of seen) {
  const url = `${BASE}${asset}`
  try {
    const res = await fetchWithTimeout(url)
    checked += 1
    if (res.status !== 200) {
      fail(`chunk ${asset} (referenced by ${page}) returned HTTP ${res.status} - stale HTML vs edge cache or missing build artifact`)
      continue
    }
    const type = res.headers.get('content-type') ?? ''
    const expectJs = asset.endsWith('.js')
    const expectCss = asset.endsWith('.css')
    if (expectJs && !/javascript|ecmascript/i.test(type)) {
      fail(`chunk ${asset} has content-type '${type}' - browsers will refuse to execute it`)
      continue
    }
    if (expectCss && !/text\/css/i.test(type)) {
      fail(`stylesheet ${asset} has content-type '${type}'`)
      continue
    }
  } catch (err) {
    checked += 1
    fail(`chunk ${asset} unreachable: ${err.message}`)
  }
}
if (checked > 0 && failures === 0) pass(`${checked} unique _next chunks resolved 200 with correct content-types`)

// ── 3. Served revision matches build-info (stale-process detector) ───────────
try {
  const [infoRes, homeRes] = await Promise.all([
    fetchWithTimeout(`${BASE}/api/build-info`),
    fetchWithTimeout(`${BASE}/`),
  ])
  const info = await infoRes.json()
  const servedRevision = homeRes.headers.get('x-nebula-revision')
  if (info.revision && servedRevision && info.revision !== servedRevision) {
    fail(
      `revision mismatch: /api/build-info says ${info.revision} but homepage x-nebula-revision is ${servedRevision} - running process predates the current build`,
    )
  } else if (info.revision && servedRevision) {
    pass(`build revision consistent across build-info and served HTML (${servedRevision})`)
  } else {
    console.warn('WARN: revision headers unavailable; skipped staleness cross-check')
  }
} catch (err) {
  console.warn(`WARN: revision cross-check skipped (${err.message})`)
}

console.log(failures === 0 ? '\nAll deployed-asset checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
