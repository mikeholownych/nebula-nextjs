#!/usr/bin/env node
/**
 * Nebula Conversion Funnel Continuity & Verification Gate
 * Leverages Citable's `test funnel` command to synthetically verify multi-step
 * conversion funnels, step page reachability, interactive CTAs, and parameter persistence.
 */
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const repoRoot = resolve(root, '..')

const targetUrl = process.env.FUNNEL_TARGET_URL || 'https://nebulacomponents.com'
const funnelId = process.env.FUNNEL_ID || 'funnel-free-audit'

try {
  console.log(`[Funnel Verification] Testing funnel "${funnelId}" against target: ${targetUrl}`)
  const output = execFileSync('npx', [
    '-y',
    '@nebulacomponents/citable@latest',
    'test',
    'funnel',
    funnelId,
    '--target',
    targetUrl,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  process.stdout.write(output)
  if (output.includes('Status: FAIL')) {
    console.error(`[Funnel Verification] Fail closed: funnel "${funnelId}" failed verification.`)
    process.exit(1)
  }
  console.log(`[Funnel Verification] Funnel "${funnelId}" verified successfully (Status: PASS).`)
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout)
  if (error.stderr) process.stderr.write(error.stderr)
  process.exit(error.status || 1)
}
