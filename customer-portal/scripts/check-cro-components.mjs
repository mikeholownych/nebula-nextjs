#!/usr/bin/env node
/**
 * Nebula CRO & Design System Component Lint Gate
 * Leverages Citable's AST-based component linter to enforce touch targets,
 * form accessibility, autocomplete hygiene, CTA microcopy, and image attributes.
 */
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)

try {
  const output = execFileSync('npx', [
    '-y',
    '@nebulacomponents/citable@latest',
    'lint',
    'components',
    'app',
    'components',
  ], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  process.stdout.write(output)
  if (output.includes('ISSUES_DETECTED')) {
    console.error('[CRO Component Lint] Fail closed on component anti-patterns.')
    process.exit(1)
  }
  console.log('[CRO Component Lint] All design system and UI components passed clean.')
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout)
  if (error.stderr) process.stderr.write(error.stderr)
  process.exit(error.status || 1)
}
