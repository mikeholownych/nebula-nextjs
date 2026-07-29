#!/usr/bin/env node
/**
 * Upload Next.js source maps to PostHog for de-minified error stack traces.
 *
 * Usage: node scripts/upload-sourcemaps.mjs
 *
 * Requires:
 *   - POSTHOG_PERSONAL_API_KEY env var (a personal API key with project write scope)
 *   - A completed `next build` with productionBrowserSourceMaps enabled in next.config.ts
 *
 * The build must produce .map files in .next/static/chunks/. After upload,
 * the maps are deleted so they're never served publicly.
 */

import { readFileSync, readdirSync, unlinkSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { execFileSync } from 'node:child_process'

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const POSTHOG_PROJECT_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_PERSONAL_KEY = process.env.POSTHOG_PERSONAL_API_KEY

if (!POSTHOG_PROJECT_KEY) {
  console.error('[sourcemaps] NEXT_PUBLIC_POSTHOG_KEY not set — skipping upload')
  process.exit(0)
}

if (!POSTHOG_PERSONAL_KEY) {
  console.error('[sourcemaps] POSTHOG_PERSONAL_API_KEY not set — skipping upload')
  console.error('[sourcemaps] Generate one at https://us.posthog.com/settings/user-api-keys')
  process.exit(0)
}

function getRevision() {
  try {
    const info = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'app', 'lib', 'build-info.json'), 'utf8'))
    return info.revision
  } catch {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  }
}

function findMapFiles(dir) {
  const results = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...findMapFiles(full))
      } else if (entry.name.endsWith('.map')) {
        results.push(full)
      }
    }
  } catch { /* dir doesn't exist */ }
  return results
}

const buildDir = join(import.meta.dirname, '..', '.next')
const staticDir = join(buildDir, 'static')
const mapFiles = findMapFiles(staticDir)

if (mapFiles.length === 0) {
  console.error('[sourcemaps] No .map files found in .next/static/ — ensure productionBrowserSourceMaps is enabled')
  process.exit(0)
}

const revision = getRevision()
console.log(`[sourcemaps] Uploading ${mapFiles.length} source maps for revision ${revision.slice(0, 8)}…`)

let uploaded = 0
let failed = 0

for (const mapPath of mapFiles) {
  const relativePath = mapPath.replace(join(buildDir, ''), '')
  const jsUrl = `~/_next${relativePath.replace(/\.map$/, '')}`

  const mapContent = readFileSync(mapPath)
  const form = new FormData()
  form.append('minified_url', jsUrl)
  form.append('source_map', new Blob([mapContent], { type: 'application/json' }), basename(mapPath))

  try {
    const res = await fetch(
      `${POSTHOG_HOST}/api/projects/@current/error_tracking/symbol_sets/?token=${POSTHOG_PROJECT_KEY}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${POSTHOG_PERSONAL_KEY}` },
        body: form,
      },
    )

    if (res.ok) {
      uploaded++
    } else {
      const text = await res.text().catch(() => '')
      console.error(`[sourcemaps] Failed ${basename(mapPath)}: ${res.status} ${text.slice(0, 200)}`)
      failed++
    }
  } catch (err) {
    console.error(`[sourcemaps] Network error uploading ${basename(mapPath)}:`, err.message)
    failed++
  }
}

console.log(`[sourcemaps] Upload complete: ${uploaded} succeeded, ${failed} failed`)

// Delete .map files so they're never deployed publicly
let deleted = 0
for (const mapPath of mapFiles) {
  try {
    unlinkSync(mapPath)
    deleted++
  } catch { /* best effort */ }
}
console.log(`[sourcemaps] Cleaned up ${deleted} .map files from build output`)
