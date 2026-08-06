#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const roots = ['stories']
const generatedFiles = ['storybook-static/index.html', 'storybook-static/iframe.html']
const banned = [
  { pattern: /Above Fold/gi, reason: 'deprecated signal label' },
  { pattern: /Ad Signals/gi, reason: 'deprecated signal label' },
  { pattern: /7\.7\/10/gi, reason: 'stale historical score' },
  { pattern: /9 conversion signals/gi, reason: 'deprecated taxonomy count' },
  { pattern: /9-signal/gi, reason: 'deprecated taxonomy count' },
]

function filesUnder(root) {
  if (!existsSync(root)) return []
  const result = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) result.push(...filesUnder(path))
    else if (/\.(css|html|js|jsx|md|mdx|mjs|ts|tsx|json)$/.test(entry.name)) result.push(path)
  }
  return result
}

const matches = []
for (const root of roots) {
  for (const file of filesUnder(root)) {
    const text = readFileSync(file, 'utf8')
    for (const bannedString of banned) {
      bannedString.pattern.lastIndex = 0
      let match
      while ((match = bannedString.pattern.exec(text))) {
        const line = text.slice(0, match.index).split('\n').length
        matches.push(`${relative(process.cwd(), file)}:${line}: ${match[0]} (${bannedString.reason})`)
      }
    }
  }
}

for (const file of generatedFiles) {
  if (!existsSync(file)) continue
  const text = readFileSync(file, 'utf8')
  for (const bannedString of banned) {
    bannedString.pattern.lastIndex = 0
    let match
    while ((match = bannedString.pattern.exec(text))) {
      const line = text.slice(0, match.index).split('\n').length
      matches.push(`${relative(process.cwd(), file)}:${line}: ${match[0]} (${bannedString.reason})`)
    }
  }
}

if (matches.length > 0) {
  console.error('Content guard failed: banned strings found:')
  for (const match of matches) console.error(`- ${match}`)
  process.exit(1)
}

console.log(`Content guard passed: scanned ${roots.filter(existsSync).join(', ') || 'no story source'} and generated Storybook shell output`)
